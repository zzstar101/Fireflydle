import { PersonalStatsSchema, type Character, type PersonalStats } from "@fireflydle/contracts";
import { getBeijingDateKey } from "@fireflydle/game-engine";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const character: Character = {
  id: "daily-statistics-character",
  officialId: "daily-statistics-character",
  baseCharacterId: "daily-statistics-character",
  names: { "zh-CN": "统计测试角色", en: "Statistics Fixture", ja: "統計テスト" },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "statistics-fixture",
  factionGroupId: "statistics-fixture",
  releaseVersionId: "1.0",
  releaseOrder: 1,
  assets: {
    avatarPath: "/assets/characters/statistics-fixture.webp",
    portraitPath: "/assets/characters/statistics-fixture.webp",
    sourceUrl: "https://hsr.hoyoverse.com/",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: "1".repeat(64),
    rightsNotice: "测试数据",
  },
  enabled: true,
  targetEligible: true,
  sourceRevision: "test",
};

async function dataOf<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok: boolean; data?: T };
  expect(payload.ok).toBe(true);
  if (!payload.data) throw new Error("缺少 API 数据");
  return payload.data;
}

async function createGuest(): Promise<{ cookie: string; userId: string }> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少游客 session cookie");
  const session = await dataOf<{ user: { id: string } }>(response);
  return { cookie, userId: session.user.id };
}

async function register(suffix: string): Promise<{
  cookie: string;
  userId: string;
  loginName: string;
  password: string;
}> {
  const shortSuffix = suffix.slice(0, 8);
  const loginName = `daily_stats_${shortSuffix}`;
  const password = `daily-statistics-${shortSuffix}-password`;
  const response = await SELF.fetch("https://fireflydle.games/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": `stats:${suffix}` },
    body: JSON.stringify({
      loginName,
      displayName: `Daily Stats ${shortSuffix}`,
      password,
    }),
  });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少注册账号 session cookie");
  const session = await dataOf<{ user: { id: string } }>(response);
  return { cookie, userId: session.user.id, loginName, password };
}

function shiftDateKey(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00.000Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

async function seedCharacter(): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO characters
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

async function seedDaily(
  userId: string,
  dateKey: string,
  result: "won" | "lost",
  guesses: number,
  completedAt = Date.now(),
): Promise<string> {
  const gameId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO games
         (id, user_id, mode, difficulty, date_key, target_character_id, max_attempts,
          status, started_at, completed_at, updated_at, mode_id, activity_id,
          pool_rule_version, manifest_version, target_payload_json,
          candidate_pool_json, field_rules_json)
       VALUES (?, ?, 'daily', 'standard', ?, ?, 6, ?, ?, ?, ?, 'playable', 'daily',
               '1.0.0', '1.0.0', ?, '[]', '[]')`,
    ).bind(
      gameId,
      userId,
      dateKey,
      character.id,
      result,
      completedAt - 30_000,
      completedAt,
      completedAt,
      JSON.stringify(character),
    ),
    env.DB.prepare(
      `INSERT INTO game_results
         (game_id, user_id, mode, difficulty, date_key, result, guess_count,
          elapsed_ms, completed_at, replay_expires_at, mode_id, activity_id)
       VALUES (?, ?, 'daily', 'standard', ?, ?, ?, 30000, ?, ?, 'playable', 'daily')`,
    ).bind(gameId, userId, dateKey, result, guesses, completedAt, completedAt + 2_592_000_000),
  ]);
  return gameId;
}

async function stats(cookie: string): Promise<PersonalStats> {
  const response = await SELF.fetch("https://fireflydle.games/api/stats/me", {
    headers: { cookie },
  });
  expect(response.status).toBe(200);
  return PersonalStatsSchema.parse(await dataOf<PersonalStats>(response));
}

describe("每日题个人统计", () => {
  it("按北京时间返回去答案化历史、连续天数、猜测分布和全站完成人数", async () => {
    await seedCharacter();
    const today = getBeijingDateKey();
    const owner = await createGuest();
    const other = await createGuest();
    const completedGameId = await seedDaily(owner.userId, today, "won", 2);
    await seedDaily(owner.userId, shiftDateKey(today, -1), "won", 3);
    await seedDaily(owner.userId, shiftDateKey(today, -3), "lost", 6);
    await seedDaily(other.userId, today, "lost", 6);

    const first = await stats(owner.cookie);
    expect(first).toMatchObject({
      totalSolved: 2,
      accuracy: 2 / 3,
      averageGuesses: 2.5,
      strongestPath: { id: "destruction", solved: 2 },
      strongestElement: { id: "fire", solved: 2 },
      dailyPlayed: 3,
      dailyWon: 2,
      currentStreak: 2,
      bestStreak: 2,
      failedDaily: 1,
      todayCompletions: 2,
    });
    expect(first.dailyHistory.map((item) => item.dateKey)).toEqual([
      today,
      shiftDateKey(today, -1),
      shiftDateKey(today, -3),
    ]);
    expect(first.guessDistribution).toEqual([
      { guesses: 1, count: 0 },
      { guesses: 2, count: 1 },
      { guesses: 3, count: 1 },
      { guesses: 4, count: 0 },
      { guesses: 5, count: 0 },
      { guesses: 6, count: 0 },
    ]);
    expect(JSON.stringify(first.dailyHistory)).not.toMatch(/answer|target|rank/i);
    const duplicate = await SELF.fetch(
      `https://fireflydle.games/api/games/${completedGameId}/guesses`,
      {
        method: "POST",
        headers: { cookie: owner.cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      },
    );
    expect(duplicate.status).toBe(409);
    expect(await stats(owner.cookie)).toEqual(first);
  });

  it("登录合并同日游客与账号记录时只累计一次并保留其他日期", async () => {
    await seedCharacter();
    const today = getBeijingDateKey();
    const account = await register(crypto.randomUUID());
    const baselineToday = (await stats(account.cookie)).todayCompletions;
    await seedDaily(account.userId, today, "won", 4, Date.now() - 1_000);
    const guest = await createGuest();
    await seedDaily(guest.userId, today, "won", 2);
    await seedDaily(guest.userId, shiftDateKey(today, -1), "lost", 6);

    const login = await SELF.fetch("https://fireflydle.games/api/auth/login", {
      method: "POST",
      headers: {
        cookie: guest.cookie,
        "content-type": "application/json",
        "cf-connecting-ip": "stats:merge",
      },
      body: JSON.stringify({
        loginName: account.loginName,
        password: account.password,
      }),
    });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie");
    if (!cookie) throw new Error("缺少登录 session cookie");

    const merged = await stats(cookie);
    expect(merged).toMatchObject({
      totalSolved: 1,
      accuracy: 1 / 2,
      averageGuesses: 4,
      strongestPath: { id: "destruction", solved: 1 },
      strongestElement: { id: "fire", solved: 1 },
      dailyPlayed: 2,
      dailyWon: 1,
      currentStreak: 2,
      bestStreak: 2,
      failedDaily: 1,
      todayCompletions: baselineToday + 1,
    });
    expect(merged.guessDistribution.find((bucket) => bucket.guesses === 2)?.count).toBe(0);
    expect(merged.guessDistribution.find((bucket) => bucket.guesses === 4)?.count).toBe(1);
    expect(merged.dailyHistory.map((item) => item.dateKey)).toEqual([
      today,
      shiftDateKey(today, -1),
    ]);
  });
});
