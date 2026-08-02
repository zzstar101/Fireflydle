import type { Character, PublicGame } from "@fireflydle/contracts";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const candidates: Character[] = Array.from({ length: 4 }, (_, index) => ({
  id: `personalized-daily-${index}`,
  officialId: `personalized-daily-${index}`,
  baseCharacterId: `personalized-daily-${index}`,
  names: {
    "zh-CN": `个性化每日角色${index}`,
    en: `Personalized Daily ${index}`,
    ja: `パーソナライズデイリー${index}`,
  },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "test-faction",
  factionGroupId: "test-faction",
  releaseVersionId: "1.0",
  releaseOrder: index,
  assets: {
    avatarPath: `/assets/characters/personalized-daily-${index}.webp`,
    portraitPath: `/assets/characters/personalized-daily-${index}.webp`,
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
  if (!payload.data) throw new Error("缺少 API 数据");
  return payload.data;
}

async function createSession(): Promise<string> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少 session cookie");
  return cookie;
}

async function seedCandidates(): Promise<void> {
  const now = Date.now();
  for (const character of candidates) {
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

async function answerFor(cookie: string): Promise<string> {
  const create = () =>
    SELF.fetch("https://fireflydle.games/api/games", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ mode: "daily", difficulty: "casual" }),
    });
  const game = await dataOf<PublicGame>(await create());
  expect((await dataOf<PublicGame>(await create())).id).toBe(game.id);

  let current = game;
  for (const candidate of candidates) {
    if (current.status !== "active") break;
    current = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: candidate.id }),
      }),
    );
  }
  if (!current.answer) throw new Error("每日题没有结算答案");
  return current.answer.id;
}

describe("个性化每日题", () => {
  it("同一玩家当天稳定续局，不同玩家不再共享唯一答案", async () => {
    await seedCandidates();
    const answers = new Set<string>();
    for (let index = 0; index < 12; index += 1) {
      answers.add(await answerFor(await createSession()));
    }
    expect(answers.size).toBeGreaterThan(1);
  });
});
