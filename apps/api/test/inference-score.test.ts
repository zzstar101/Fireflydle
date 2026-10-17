import {
  InferenceReviewSchema,
  PublicGameSchema,
  type InferenceReview,
  type PublicGame,
} from "@fireflydle/contracts";
import { characters } from "@fireflydle/game-data";
import { createGame, submitGameGuess } from "../src/services/games";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

async function dataOf<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok: boolean; data: T };
  expect(response.ok, JSON.stringify(payload)).toBe(true);
  expect(payload.ok).toBe(true);
  return payload.data;
}

describe("结算推理评分", () => {
  it.each(["playable", "currency-wars", "npc", "aeon"] as const)(
    "%s 仅在结束后公开评分，既有复盘接口完整透传",
    async (modeId) => {
      if (modeId === "playable") {
        await env.DB.batch(
          characters
            .filter((entry) => entry.enabled && entry.targetEligible)
            .slice(0, 7)
            .map((character) =>
              env.DB.prepare(
                `INSERT INTO characters
        (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id,
         release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`,
              ).bind(
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
                Date.now(),
                Date.now(),
              ),
            ),
        );
      }
      const session = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
      expect(session.status).toBe(201);
      const cookie = session.headers.get("set-cookie")!;
      const headers = { cookie, "content-type": "application/json" };
      const { user } = await dataOf<{ user: { id: string } }>(session);
      // NPC 创建路由目前关闭；直接验证服务层，恢复和回放仍走真实 HTTP 接口。
      const created =
        modeId === "npc"
          ? await createGame(env.DB, user.id, { modeId, activityId: "practice" })
          : await dataOf<PublicGame>(
              await SELF.fetch("https://fireflydle.games/api/games", {
                method: "POST",
                headers,
                body: JSON.stringify({ modeId, activityId: "practice" }),
              }),
            );
      expect(created).not.toHaveProperty("inferenceReview");
      const row = await env.DB.prepare(
        "SELECT target_character_id, candidate_pool_json FROM games WHERE id = ?",
      )
        .bind(created.id)
        .first<{ target_character_id: string; candidate_pool_json: string }>();
      if (!row) throw new Error("缺少测试对局");
      const wrongId = Object.keys(JSON.parse(row.candidate_pool_json)).find(
        (id) => id !== row.target_character_id,
      );
      if (!wrongId) throw new Error("缺少错误猜测候选");
      const guess = async (characterId: string) =>
        modeId === "npc"
          ? submitGameGuess(env.DB, created.id, user.id, characterId)
          : dataOf<PublicGame>(
              await SELF.fetch(`https://fireflydle.games/api/games/${created.id}/guesses`, {
                method: "POST",
                headers,
                body: JSON.stringify({ characterId }),
              }),
            );
      const active = await guess(wrongId);
      expect(active.status).toBe("active");
      expect(active).not.toHaveProperty("inferenceReview");
      const restored = await dataOf<PublicGame>(
        await SELF.fetch(`https://fireflydle.games/api/games/${created.id}`, { headers }),
      );
      expect(restored).not.toHaveProperty("inferenceReview");
      const finished = await guess(row.target_character_id);
      expect(finished.status).toBe("won");
      expect(PublicGameSchema.safeParse(finished).success).toBe(true);
      if (modeId === "aeon") {
        expect(finished).not.toHaveProperty("inferenceReview");
        return;
      }
      expect(finished.inferenceReview).toMatchObject({
        score: expect.any(Number),
        grade: expect.stringMatching(/^[SABCD]$/),
      });
      expect(InferenceReviewSchema.safeParse(finished.inferenceReview).success).toBe(true);
      expect(finished.inferenceReview?.steps).toHaveLength(2);
      for (const step of finished.inferenceReview!.steps) {
        expect(step.skill).toBeGreaterThanOrEqual(0);
        expect(step.skill).toBeLessThanOrEqual(100);
        expect(step.bestGuess?.id).toEqual(expect.any(String));
        expect(step.bestGuess).not.toHaveProperty("sourceRevision");
        expect(step.bestGuess).not.toHaveProperty("reviewStatus");
      }
      const replay = await dataOf<{ game: PublicGame }>(
        await SELF.fetch(`https://fireflydle.games/api/replays/${created.id}`, { headers }),
      );
      expect(replay.game.inferenceReview).toEqual(finished.inferenceReview);
      // 战绩接口现有查询只收录 playable，不在评分任务中改变统计口径。
      if (modeId === "playable") {
        const stats = await dataOf<{ recent: { id: string; inferenceReview?: InferenceReview }[] }>(
          await SELF.fetch("https://fireflydle.games/api/stats/me", { headers }),
        );
        expect(stats.recent.find((entry) => entry.id === created.id)?.inferenceReview).toEqual(
          finished.inferenceReview,
        );
      }
    },
  );
});
