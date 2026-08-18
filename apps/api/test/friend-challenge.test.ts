import type { Character, ContentModeId, FriendChallenge, PublicGame } from "@fireflydle/contracts";
import { env } from "cloudflare:workers";
import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { compareChallengeScores } from "../src/services/challenges";
import { runScheduledMaintenance } from "../src/services/maintenance";

const characters: Character[] = ["march-test", "firefly-test", "blade-test"].map((id, index) => ({
  id,
  officialId: `challenge-${index}`,
  baseCharacterId: id,
  names: { "zh-CN": `挑战角色${index}`, en: `Challenge ${index}`, ja: `挑戦${index}` },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: (["ice", "fire", "wind"] as const)[index] ?? "fire",
  path: (["preservation", "destruction", "destruction"] as const)[index] ?? "destruction",
  rarity: index === 0 ? 4 : 5,
  factionId: index === 0 ? "astral-express" : "stellaron-hunters",
  factionGroupId: index === 0 ? "astral-express" : "stellaron-hunters",
  releaseVersionId: `1.${index}`,
  releaseOrder: index,
  assets: {
    avatarPath: `/assets/characters/${id}-avatar.webp`,
    portraitPath: `/assets/characters/${id}-portrait.webp`,
    sourceUrl: "https://hsr.hoyoverse.com/",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: String(index).repeat(64),
    rightsNotice: "测试数据",
  },
  enabled: true,
  targetEligible: true,
  sourceRevision: "challenge-test",
}));

async function dataOf<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok?: boolean; data?: T };
  if (payload.ok !== true || payload.data === undefined) throw new Error("非成功 API 响应");
  return payload.data;
}

async function createSession(stableGuestId?: string): Promise<string> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", {
    method: "POST",
    ...(stableGuestId ? { headers: { "x-guest-id": stableGuestId } } : {}),
  });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少 session cookie");
  return cookie;
}

async function post(path: string, cookie: string, body?: unknown): Promise<Response> {
  return SELF.fetch(`https://fireflydle.games/api${path}`, {
    method: "POST",
    headers: {
      cookie,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeAll(async () => {
  const now = Date.now();
  for (const character of characters) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO characters
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
});

describe("普通角色好友挑战", () => {
  it("冻结源局、隐藏答案并把首次完成后的重玩标记为练习", async () => {
    const creatorCookie = await createSession();
    const stableChallengerId = crypto.randomUUID();
    const challengerCookie = await createSession(stableChallengerId);
    const sourceResponse = await post("/games", creatorCookie, {
      modeId: "playable",
      activityId: "practice",
    });
    const source = await dataOf<PublicGame>(sourceResponse);
    const sourceRow = await env.DB.prepare("SELECT target_character_id FROM games WHERE id = ?")
      .bind(source.id)
      .first<{ target_character_id: string }>();
    if (!sourceRow) throw new Error("缺少源局");
    const wrong = characters.find((character) => character.id !== sourceRow.target_character_id);
    if (!wrong) throw new Error("缺少错误选项");

    await post(`/games/${source.id}/guesses`, creatorCookie, { characterId: wrong.id });
    const finishedSourceResponse = await post(`/games/${source.id}/guesses`, creatorCookie, {
      characterId: sourceRow.target_character_id,
    });
    expect((await dataOf<PublicGame>(finishedSourceResponse)).status).toBe("won");
    const replayRetention = await env.DB.prepare(
      "SELECT completed_at, replay_expires_at FROM game_results WHERE game_id = ?",
    )
      .bind(source.id)
      .first<{ completed_at: number; replay_expires_at: number }>();
    expect(replayRetention?.replay_expires_at).toBe(
      (replayRetention?.completed_at ?? 0) + 30 * 24 * 60 * 60 * 1_000,
    );

    const createdResponse = await post(`/games/${source.id}/challenges`, creatorCookie);
    expect(createdResponse.status).toBe(201);
    const createdText = await createdResponse.text();
    expect(createdText).not.toContain(sourceRow.target_character_id);
    const createdPayload = JSON.parse(createdText) as { data: FriendChallenge };
    const created = createdPayload.data;
    expect(created).toMatchObject({
      modeId: "playable",
      activityId: "friend-challenge",
      maxAttempts: 6,
      creatorScore: { status: "won", guessCount: 2 },
      officialScore: null,
      comparison: null,
      attempt: null,
    });
    const challengeRetention = await env.DB.prepare(
      "SELECT created_at, expires_at FROM friend_challenges WHERE id = ?",
    )
      .bind(created.id)
      .first<{ created_at: number; expires_at: number }>();
    expect(challengeRetention?.expires_at).toBe(
      (challengeRetention?.created_at ?? 0) + 90 * 24 * 60 * 60 * 1_000,
    );

    // 创建后修改源局，挑战仍必须使用之前冻结的内容和规则。
    const replacement = characters.find(
      (character) => character.id !== sourceRow.target_character_id,
    );
    if (!replacement) throw new Error("缺少替换角色");
    await env.DB.prepare(
      `UPDATE games
       SET target_character_id = ?, target_payload_json = ?, manifest_version = '9.9.9',
           max_attempts = 1
       WHERE id = ?`,
    )
      .bind(replacement.id, JSON.stringify(replacement), source.id)
      .run();

    const viewResponse = await SELF.fetch(`https://fireflydle.games/api/challenges/${created.id}`, {
      headers: { cookie: challengerCookie },
    });
    const viewText = await viewResponse.text();
    expect(viewText).not.toContain(sourceRow.target_character_id);

    const startedResponse = await post(`/challenges/${created.id}/attempts`, challengerCookie);
    const startedText = await startedResponse.text();
    expect(startedText).not.toContain(sourceRow.target_character_id);
    const started = (JSON.parse(startedText) as { data: FriendChallenge }).data;
    expect(started.manifestVersion).toBe(created.manifestVersion);
    expect(started.maxAttempts).toBe(6);
    expect(started.attempt).toMatchObject({
      kind: "official",
      game: { activityId: "friend-challenge", answer: null, maxAttempts: 6 },
    });
    if (!started.attempt) throw new Error("缺少正式挑战局");

    const regularPractice = await dataOf<PublicGame>(
      await post("/games", challengerCookie, {
        modeId: "playable",
        activityId: "practice",
      }),
    );
    expect(regularPractice.id).not.toBe(started.attempt.game.id);
    expect(regularPractice.activityId).toBe("practice");

    const completedResponse = await post(
      `/games/${started.attempt.game.id}/guesses`,
      challengerCookie,
      { characterId: sourceRow.target_character_id },
    );
    const completed = await dataOf<PublicGame>(completedResponse);
    expect(completed).toMatchObject({
      status: "won",
      answer: { id: sourceRow.target_character_id },
      manifestVersion: created.manifestVersion,
      maxAttempts: 6,
    });

    const result = await dataOf<FriendChallenge>(
      await SELF.fetch(`https://fireflydle.games/api/challenges/${created.id}`, {
        headers: { cookie: challengerCookie },
      }),
    );
    expect(result.officialScore).toMatchObject({ status: "won", guessCount: 1 });
    expect(result.comparison).toBe("challenger-won");

    // 丢失 cookie 后，同一本地游客 ID 仍绑定已经锁定的首次成绩。
    const resumedChallengerCookie = await createSession(stableChallengerId);
    const replay = await dataOf<FriendChallenge>(
      await post(`/challenges/${created.id}/attempts`, resumedChallengerCookie),
    );
    expect(replay.attempt?.kind).toBe("practice");
    expect(replay.attempt?.game.id).not.toBe(started.attempt.game.id);
    expect(replay.officialScore).toEqual(result.officialScore);

    const expiredCookie = await createSession();
    const expiring = await dataOf<FriendChallenge>(
      await post(`/challenges/${created.id}/attempts`, expiredCookie),
    );
    if (!expiring.attempt) throw new Error("缺少待过期挑战局");
    await env.DB.prepare(
      "UPDATE games SET status = 'expired', completed_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(Date.now(), Date.now(), expiring.attempt.game.id)
      .run();
    const retried = await dataOf<FriendChallenge>(
      await post(`/challenges/${created.id}/attempts`, expiredCookie),
    );
    expect(retried.attempt?.kind).toBe("official");
    expect(retried.attempt?.game.id).not.toBe(expiring.attempt.game.id);

    const expiresAt = Date.now() - 1;
    await env.DB.prepare("UPDATE friend_challenges SET expires_at = ? WHERE id = ?")
      .bind(expiresAt, created.id)
      .run();
    const expiredResponse = await SELF.fetch(
      `https://fireflydle.games/api/challenges/${created.id}`,
      { headers: { cookie: challengerCookie } },
    );
    expect(expiredResponse.status).toBe(410);
    const expiredText = await expiredResponse.text();
    expect(expiredText).not.toContain(sourceRow.target_character_id);
    expect(expiredText).not.toContain("creatorScore");
    expect(JSON.parse(expiredText)).toMatchObject({
      ok: false,
      error: { code: "CHALLENGE_EXPIRED", details: { modeId: "playable" } },
    });
    expect((await post(`/challenges/${created.id}/attempts`, challengerCookie)).status).toBe(410);

    await runScheduledMaintenance(env, Date.now());
    expect(
      await env.DB.prepare("SELECT id FROM friend_challenges WHERE id = ?")
        .bind(created.id)
        .first(),
    ).toBeNull();
    expect(
      await env.DB.prepare("SELECT id FROM games WHERE id = ?")
        .bind(started.attempt.game.id)
        .first(),
    ).toBeNull();
    expect(
      await env.DB.prepare("SELECT mode_id FROM friend_challenge_tombstones WHERE id = ?")
        .bind(created.id)
        .first(),
    ).toEqual({ mode_id: "playable" });
    const tombstoneResponse = await SELF.fetch(
      `https://fireflydle.games/api/challenges/${created.id}`,
      { headers: { cookie: challengerCookie } },
    );
    expect(tombstoneResponse.status).toBe(410);
    expect(await tombstoneResponse.text()).not.toContain(sourceRow.target_character_id);
  });

  it("按命中、次数、用时的顺序比较双方成绩", () => {
    expect(
      compareChallengeScores(
        { status: "won", guessCount: 4, elapsedMs: 10_000 },
        { status: "lost", guessCount: 1, elapsedMs: 1_000 },
      ),
    ).toBe("creator-won");
    expect(
      compareChallengeScores(
        { status: "won", guessCount: 4, elapsedMs: 1_000 },
        { status: "won", guessCount: 3, elapsedMs: 10_000 },
      ),
    ).toBe("challenger-won");
    expect(
      compareChallengeScores(
        { status: "won", guessCount: 3, elapsedMs: 10_000 },
        { status: "won", guessCount: 3, elapsedMs: 9_999 },
      ),
    ).toBe("challenger-won");
  });
});

describe("特殊模式好友挑战", () => {
  for (const modeId of ["currency-wars", "aeon"] as const satisfies readonly ContentModeId[]) {
    it(`${modeId} 锁定快照并完成首次成绩比较`, async () => {
      const creatorCookie = await createSession();
      const challengerCookie = await createSession();
      const source = await dataOf<PublicGame>(
        await post("/games", creatorCookie, { modeId, activityId: "practice" }),
      );
      const sourceRow = await env.DB.prepare(
        `SELECT target_character_id, field_rules_json
         FROM games WHERE id = ?`,
      )
        .bind(source.id)
        .first<{ target_character_id: string; field_rules_json: string }>();
      if (!sourceRow) throw new Error("缺少特殊模式源局");

      const finishedSource = await dataOf<PublicGame>(
        await post(`/games/${source.id}/guesses`, creatorCookie, {
          characterId: sourceRow.target_character_id,
        }),
      );
      expect(finishedSource.status).toBe("won");

      const createdResponse = await post(`/games/${source.id}/challenges`, creatorCookie);
      const createdText = await createdResponse.text();
      expect(createdResponse.status).toBe(201);
      expect(createdText).not.toContain(sourceRow.target_character_id);
      const created = (JSON.parse(createdText) as { data: FriendChallenge }).data;
      expect(created).toMatchObject({
        modeId,
        manifestVersion: source.manifestVersion,
        poolRuleVersion: source.poolRuleVersion,
        maxAttempts: source.maxAttempts,
        creatorScore: { status: "won", guessCount: 1 },
        officialScore: null,
        comparison: null,
      });

      const startedResponse = await post(`/challenges/${created.id}/attempts`, challengerCookie);
      const startedText = await startedResponse.text();
      expect(startedText).not.toContain(sourceRow.target_character_id);
      const started = (JSON.parse(startedText) as { data: FriendChallenge }).data;
      expect(started.attempt).toMatchObject({
        kind: "official",
        game: {
          modeId,
          activityId: "friend-challenge",
          manifestVersion: source.manifestVersion,
          poolRuleVersion: source.poolRuleVersion,
          maxAttempts: source.maxAttempts,
          answer: null,
        },
      });
      if (!started.attempt) throw new Error("缺少特殊模式挑战局");
      expect(started.attempt.game).not.toHaveProperty("skipAvailable");

      const candidatesResponse = await SELF.fetch(
        `https://fireflydle.games/api/challenges/${created.id}/candidates`,
        { headers: { cookie: challengerCookie } },
      );
      const candidatesText = await candidatesResponse.text();
      const candidates = (JSON.parse(candidatesText) as { data: Array<{ id: string }> }).data;
      expect(candidates.some((candidate) => candidate.id === sourceRow.target_character_id)).toBe(
        true,
      );

      const concedeResponse = await post(
        `/games/${started.attempt.game.id}/concede`,
        challengerCookie,
      );
      expect(concedeResponse.status).toBe(403);

      if (modeId === "aeon") {
        expect(source.aeonRevealSeed).toBe(source.id);
        expect(started.attempt.game.aeonRevealSeed).toBe(source.id);
      }

      const completedResponse = await post(
        `/games/${started.attempt.game.id}/guesses`,
        challengerCookie,
        { characterId: sourceRow.target_character_id },
      );
      const completedText = await completedResponse.text();
      const completed = (JSON.parse(completedText) as { data: PublicGame }).data;
      expect(completed).toMatchObject({
        modeId,
        status: "won",
        answer: { id: sourceRow.target_character_id },
        manifestVersion: source.manifestVersion,
        poolRuleVersion: source.poolRuleVersion,
        maxAttempts: source.maxAttempts,
      });

      if (modeId === "currency-wars") {
        const privateSnapshot = JSON.parse(sourceRow.field_rules_json) as {
          currencyWarsUnits?: Array<{ synergies?: string[] }>;
        };
        expect(
          Boolean(privateSnapshot.currencyWarsUnits?.some((unit) => unit.synergies?.length)),
        ).toBe(true);
        expect(completed.guesses[0]?.character).not.toHaveProperty("synergies");
        expect(completed.answer).not.toHaveProperty("synergies");
        expect(candidatesText).not.toMatch(/stellaron-hunters|astral-express|masked-fools/);
      }

      const result = await dataOf<FriendChallenge>(
        await SELF.fetch(`https://fireflydle.games/api/challenges/${created.id}`, {
          headers: { cookie: challengerCookie },
        }),
      );
      expect(result.officialScore).toMatchObject({ status: "won", guessCount: 1 });
      expect(result.comparison).not.toBeNull();
    });
  }
});
