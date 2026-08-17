import type { Character, WeeklyRun } from "@fireflydle/contracts";
import { getBeijingWeekKey } from "@fireflydle/game-engine";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const characters: Character[] = Array.from({ length: 7 }, (_, index) => ({
  id: `weekly-character-${index}`,
  officialId: `weekly-${index}`,
  baseCharacterId: `weekly-character-${index}`,
  names: {
    "zh-CN": `周赛角色${index}`,
    en: `Weekly Character ${index}`,
    ja: `ウィークリーキャラクター${index}`,
  },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "stellaron-hunters",
  factionGroupId: "stellaron-hunters",
  releaseVersionId: "2.3",
  releaseOrder: index,
  assets: {
    avatarPath: `/assets/characters/weekly-${index}.webp`,
    portraitPath: `/assets/characters/weekly-${index}.webp`,
    sourceUrl: "https://hsr.hoyoverse.com/",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: String(index).repeat(64),
    rightsNotice: "测试数据",
  },
  enabled: true,
  targetEligible: true,
  sourceRevision: "test",
}));

async function dataOf<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok: boolean; data?: T };
  expect(payload.ok).toBe(true);
  if (payload.data === undefined) throw new Error("缺少 API 数据");
  return payload.data;
}

async function seedCharacters(): Promise<void> {
  const now = Date.now();
  for (const character of characters) {
    await env.DB.prepare(
      `INSERT INTO characters
         (id, official_id, base_character_id, element, path, rarity, faction_id,
          faction_group_id, release_version_id, release_order, enabled, target_eligible,
          source_revision, payload_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`,
    )
      .bind(
        character.id,
        character.officialId,
        character.baseCharacterId,
        character.element,
        character.path,
        character.rarity,
        character.factionId,
        character.factionGroupId,
        character.releaseVersionId,
        character.releaseOrder,
        character.sourceRevision,
        JSON.stringify(character),
        now,
        now,
      )
      .run();
  }
}

async function createGuest(): Promise<{ cookie: string; displayName: string }> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少访客 cookie");
  const session = await dataOf<{ user: { displayName: string } }>(response);
  return { cookie, displayName: session.user.displayName };
}

async function createAccount(): Promise<{ cookie: string; displayName: string }> {
  const response = await SELF.fetch("https://fireflydle.games/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "weekly-account" },
    body: JSON.stringify({
      loginName: "weekly_account",
      displayName: "Weekly Account",
      password: "weekly-account-password",
    }),
  });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少账号 cookie");
  return { cookie, displayName: "Weekly Account" };
}

async function start(cookie: string, practice = false): Promise<WeeklyRun> {
  return dataOf<WeeklyRun>(
    await SELF.fetch("https://fireflydle.games/api/weekly/runs", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ practice }),
    }),
  );
}

async function targetId(gameId: string): Promise<string> {
  const row = await env.DB.prepare("SELECT target_character_id FROM games WHERE id = ?")
    .bind(gameId)
    .first<{ target_character_id: string }>();
  if (!row) throw new Error("缺少周赛对局");
  return row.target_character_id;
}

async function guess(cookie: string, run: WeeklyRun, characterId: string): Promise<WeeklyRun> {
  return dataOf<WeeklyRun>(
    await SELF.fetch(`https://fireflydle.games/api/weekly/runs/${run.id}/guesses`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ characterId }),
    }),
  );
}

describe("普通角色周赛核心", () => {
  it("固定全球五题，失败继续；游客可分享但不上榜，账号首成绩锁定", async () => {
    await seedCharacters();
    const guest = await createGuest();
    let guestRun = await start(guest.cookie);
    expect(guestRun).toMatchObject({
      weekKey: getBeijingWeekKey(),
      official: false,
      status: "active",
      questionCount: 5,
    });
    const targetOrder: string[] = [];
    for (let question = 0; question < 5; question += 1) {
      const game = guestRun.currentGame;
      if (!game) throw new Error("周赛题目未创建");
      const target = await targetId(game.id);
      targetOrder.push(target);
      for (const character of characters.filter((item) => item.id !== target)) {
        guestRun = await guess(guest.cookie, guestRun, character.id);
      }
      expect(guestRun.games[question]).toMatchObject({ status: "lost", maxAttempts: 6 });
      expect(guestRun.games[question]?.guesses).toHaveLength(6);
    }
    expect(guestRun).toMatchObject({
      status: "completed",
      correctCount: 0,
      totalGuesses: 30,
      currentGame: null,
    });

    const share = await dataOf<{ url: string }>(
      await SELF.fetch(`https://fireflydle.games/api/weekly/runs/${guestRun.id}/share`, {
        method: "POST",
        headers: { cookie: guest.cookie },
      }),
    );
    const token = share.url.split("/").at(-1);
    if (!token) throw new Error("缺少分享 token");
    const shared = await dataOf<Omit<WeeklyRun, "currentGame">>(
      await SELF.fetch(`https://fireflydle.games/api/weekly/shared/${token}`),
    );
    expect(shared).toMatchObject({ id: guestRun.id, correctCount: 0, totalGuesses: 30 });

    const account = await createAccount();
    let official = await start(account.cookie);
    expect(official.official).toBe(true);
    const officialRunId = official.id;
    for (let question = 0; question < 5; question += 1) {
      const game = official.currentGame;
      if (!game) throw new Error("账号周赛题目未创建");
      expect(await targetId(game.id)).toBe(targetOrder[question]);
      official = await guess(account.cookie, official, targetOrder[question]!);
    }
    expect(official).toMatchObject({ status: "completed", correctCount: 5, totalGuesses: 5 });
    expect((await start(account.cookie)).id).toBe(officialRunId);

    let practice = await start(account.cookie, true);
    expect(practice.official).toBe(false);
    for (const target of targetOrder) {
      practice = await guess(account.cookie, practice, target);
    }
    expect(practice.status).toBe("completed");

    const board = await dataOf<
      Array<{ displayName: string; correctCount: number; totalGuesses: number }>
    >(await SELF.fetch(`https://fireflydle.games/api/leaderboards/weekly`));
    expect(board).toContainEqual(
      expect.objectContaining({
        displayName: account.displayName,
        correctCount: 5,
        totalGuesses: 5,
      }),
    );
    expect(board.some((entry) => entry.displayName === guest.displayName)).toBe(false);
    const score = await env.DB.prepare("SELECT run_id FROM weekly_scores WHERE week_key = ?")
      .bind(getBeijingWeekKey())
      .first<{ run_id: string }>();
    expect(score?.run_id).toBe(officialRunId);
  });
});
