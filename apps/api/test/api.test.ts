import {
  PASSWORD_MIN_LENGTH,
  type Character,
  type PublicGame,
  type RoomSnapshot,
} from "@fireflydle/contracts";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSWORD_ITERATIONS } from "../src/lib/crypto";

const character: Character = {
  id: "firefly-test",
  officialId: "test-1",
  baseCharacterId: "firefly-test",
  names: { "zh-CN": "测试流萤", en: "Test Firefly", ja: "テストホタル" },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "stellaron-hunters",
  factionGroupId: "stellaron-hunters",
  releaseVersionId: "2.3",
  releaseOrder: 10,
  assets: {
    avatarPath: "/assets/characters/firefly-test-avatar.webp",
    portraitPath: "/assets/characters/firefly-test-portrait.webp",
    sourceUrl: "https://hsr.hoyoverse.com/",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: "0".repeat(64),
    rightsNotice: "测试数据",
  },
  enabled: true,
  targetEligible: true,
  sourceRevision: "test",
};

interface SessionData {
  expiresAt: string;
  user: {
    id: string;
    hasEmail: boolean;
    emailVerified: boolean;
    elo?: number;
    rankedMatches?: number;
  };
}

async function dataOf<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) throw new Error("非法 API 响应");
  const record = payload as Record<string, unknown>;
  if (record.ok !== true || !("data" in record)) throw new Error("非成功 API 响应");
  return record.data as T;
}

async function createSession(): Promise<{ cookie: string; data: SessionData }> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("HttpOnly");
  if (!cookie) throw new Error("缺少 session cookie");
  return { cookie, data: await dataOf<SessionData>(response) };
}

async function createRegisteredSession(
  suffix: string,
): Promise<{ cookie: string; data: SessionData; password: string }> {
  const password = `registered-${suffix}-password`;
  const response = await SELF.fetch("https://fireflydle.games/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      loginName: `registered_${suffix}`,
      displayName: `Reg ${suffix}`,
      password,
    }),
  });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少注册账号 session cookie");
  return { cookie, data: await dataOf<SessionData>(response), password };
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

beforeEach(async () => {
  vi.restoreAllMocks();
  await seedCharacter();
});

describe("Worker 入口与会话", () => {
  it("返回统一健康响应并严格限制 CORS", async () => {
    const health = await SELF.fetch("https://fireflydle.games/api/health");
    expect(health.status).toBe(200);
    expect(await dataOf<{ status: string }>(health)).toMatchObject({ status: "ok" });

    const preflight = await SELF.fetch("https://fireflydle.games/api/session", {
      method: "OPTIONS",
      headers: { origin: "http://localhost:5173" },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");

    const denied = await SELF.fetch("https://fireflydle.games/api/health", {
      headers: { origin: "https://evil.example" },
    });
    expect(denied.status).toBe(403);
  });

  it("只在 HttpOnly cookie 中交付 session token", async () => {
    const session = await createSession();
    expect(session.cookie).toContain("Secure");
    expect(session.cookie).toContain("SameSite=Lax");
    expect(session.cookie).toContain("Domain=.fireflydle.games");
    expect(session.data).not.toHaveProperty("token");
    expect(session.data.user.id).toMatch(/^[0-9a-f-]{36}$/u);
  });
});

describe("账号密码边界", () => {
  it("密码哈希迭代次数不超过 Workers Web Crypto 上限", () => {
    expect(PASSWORD_ITERATIONS).toBeLessThanOrEqual(100_000);
  });

  it("注册拒绝 5 位密码并接受 6 位密码", async () => {
    const register = (suffix: string, password: string) =>
      SELF.fetch("https://fireflydle.games/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          loginName: `password_${suffix}`,
          displayName: `Password ${suffix}`,
          password,
        }),
      });

    const tooShort = await register("short", "x".repeat(PASSWORD_MIN_LENGTH - 1));
    expect(tooShort.status).toBe(400);

    const accepted = await register("accepted", "x".repeat(PASSWORD_MIN_LENGTH));
    expect(accepted.status).toBe(201);
  });
});

describe("服务端游戏裁决", () => {
  it("同一模式只保留一个可继续对局，并在主动结束后允许随机换题", async () => {
    const { cookie } = await createSession();
    const create = (difficulty: "casual" | "hard") =>
      SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "daily", difficulty }),
      });
    const [casualResponse, hardResponse] = await Promise.all([create("casual"), create("hard")]);
    const casual = await dataOf<PublicGame>(casualResponse);
    const hard = await dataOf<PublicGame>(hardResponse);
    expect(hard.id).toBe(casual.id);
    expect(hard.difficulty).toBe(casual.difficulty);

    const concede = async (id: string) =>
      dataOf<PublicGame>(
        await SELF.fetch(`https://fireflydle.games/api/games/${id}/concede`, {
          method: "POST",
          headers: { cookie },
        }),
      );
    const dailyConcede = await SELF.fetch(
      `https://fireflydle.games/api/games/${casual.id}/concede`,
      { method: "POST", headers: { cookie } },
    );
    expect(dailyConcede.status).toBe(403);
    const dailyDone = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${casual.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      }),
    );
    expect(dailyDone.answer?.id).toBe(character.id);
    expect(dailyDone.answer).not.toHaveProperty("officialId");
    expect(dailyDone.guesses[0]?.character).not.toHaveProperty("enabled");

    const randomFirst = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );
    const randomResume = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "hard" }),
      }),
    );
    expect(randomResume.id).toBe(randomFirst.id);
    await concede(randomFirst.id);
    const randomNext = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "hard" }),
      }),
    );
    expect(randomNext.id).not.toBe(randomFirst.id);

    const current = await dataOf<{ daily: PublicGame | null; random: PublicGame | null }>(
      await SELF.fetch("https://fireflydle.games/api/games/current", { headers: { cookie } }),
    );
    expect(current.daily?.id).toBe(dailyDone.id);
    expect(current.daily?.status).toBe("won");
    expect(current.random?.id).toBe(randomNext.id);
    const schedule = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM daily_target_schedule",
    ).first<{ count: number }>();
    expect(schedule?.count).toBe(1);
  });

  it("并发猜测与认输只产生一个最终裁决", async () => {
    const { cookie } = await createSession();
    const game = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );

    const [guess, concede] = await Promise.all([
      SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      }),
      SELF.fetch(`https://fireflydle.games/api/games/${game.id}/concede`, {
        method: "POST",
        headers: { cookie },
      }),
    ]);
    expect([guess.status, concede.status].sort()).toEqual([200, 409]);

    const stored = await env.DB.prepare(
      `SELECT games.status, game_results.result,
         (SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id) AS guess_count
       FROM games
       JOIN game_results ON game_results.game_id = games.id
       WHERE games.id = ?`,
    )
      .bind(game.id)
      .first<{ status: string; result: string; guess_count: number }>();
    expect(stored?.result).toBe(stored?.status);
    expect(stored?.guess_count).toBe(stored?.status === "won" ? 1 : 0);
  });
});

describe("匹配、SQLite Durable Object 与 WebSocket", () => {
  it("固定 BO3 排位并建立只对局内玩家可用的房间", async () => {
    const guest = await createSession();
    const guestRanked = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: guest.cookie },
    });
    expect(guestRanked.status).toBe(401);

    const left = await createRegisteredSession("ranked_left");
    const right = await createRegisteredSession("ranked_right");
    const outsider = await createSession();
    const first = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: left.cookie },
    });
    expect(first.status).toBe(202);
    const waiting = await dataOf<{ status: "waiting"; ticketId: string }>(first);
    expect(waiting.status).toBe("waiting");

    const second = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: right.cookie, "content-type": "application/json" },
      body: JSON.stringify({ format: 7 }),
    });
    const matched = await dataOf<{
      status: "matched";
      ticketId: string;
      roomId: string;
      roomCode: string;
    }>(second);
    expect(matched.status).toBe("matched");

    const status = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${waiting.ticketId}`,
      { headers: { cookie: left.cookie } },
    );
    expect((await dataOf<{ status: string }>(status)).status).toBe("matched");

    const room = await SELF.fetch(`https://fireflydle.games/api/rooms/${matched.roomId}`, {
      headers: { cookie: left.cookie },
    });
    const roomData = await dataOf<{ snapshot: RoomSnapshot }>(room);
    expect(roomData.snapshot.format).toBe(3);
    expect(roomData.snapshot.ranked).toBe(true);
    expect(roomData.snapshot.state).toBe("playing");
    expect(roomData.snapshot.players).toHaveLength(2);
    expect((roomData.snapshot.roundEndsAt ?? 0) - Date.now()).toBeGreaterThan(85_000);

    const hiddenRoom = await SELF.fetch(`https://fireflydle.games/api/rooms/${matched.roomId}`, {
      headers: { cookie: outsider.cookie },
    });
    expect(hiddenRoom.status).toBe(404);
    const hiddenLeave = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${matched.roomId}/leave`,
      { method: "POST", headers: { cookie: outsider.cookie } },
    );
    expect(hiddenLeave.status).toBe(404);
    const hiddenSocket = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${matched.roomId}/socket`,
      { headers: { cookie: outsider.cookie, upgrade: "websocket" } },
    );
    expect(hiddenSocket.status).toBe(404);

    const roomObject = env.GAME_ROOM.getByName(matched.roomId);
    const rateAt = Date.now();
    // BO7 理论峰值是 42 次；前 60 个唯一 action 都不应被速率上限误伤。
    for (let index = 0; index < 60; index += 1) {
      const invalidGuess = await roomObject.guess(
        left.data.user.id,
        "missing-character",
        `invalid-${index}`,
        rateAt,
      );
      expect(invalidGuess).toMatchObject({ ok: false, code: "NOT_FOUND" });
    }
    const limitedGuess = await roomObject.guess(
      left.data.user.id,
      "missing-character",
      "invalid-over-limit",
      rateAt,
    );
    expect(limitedGuess).toMatchObject({ ok: false, code: "RATE_LIMITED" });

    const socketResponse = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${matched.roomId}/socket`,
      { headers: { cookie: left.cookie, upgrade: "websocket" } },
    );
    expect(socketResponse.status).toBe(101);
    expect(socketResponse.webSocket).not.toBeNull();
    socketResponse.webSocket?.accept();
    socketResponse.webSocket?.close(1000, "test-complete");

    const prematureAck = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}/ack`,
      { method: "POST", headers: { cookie: right.cookie } },
    );
    expect(prematureAck.status).toBe(409);
    const activeRetry = await dataOf<{
      status: "matched";
      ticketId: string;
      roomId: string;
    }>(
      await SELF.fetch("https://fireflydle.games/api/matchmaking", {
        method: "POST",
        headers: { cookie: right.cookie },
      }),
    );
    expect(activeRetry).toMatchObject({
      status: "matched",
      ticketId: matched.ticketId,
      roomId: matched.roomId,
    });

    await env.DB.prepare("UPDATE room_directory SET state = 'finished' WHERE room_id = ?")
      .bind(matched.roomId)
      .run();
    const nextAttempt = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: left.cookie },
    });
    const nextTicket = await dataOf<{ status: "waiting"; ticketId: string }>(nextAttempt);
    expect(nextTicket.status).toBe("waiting");
    expect(nextTicket.ticketId).not.toBe(waiting.ticketId);

    const firstAck = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}/ack`,
      { method: "POST", headers: { cookie: right.cookie } },
    );
    const retryAck = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}/ack`,
      { method: "POST", headers: { cookie: right.cookie } },
    );
    expect(firstAck.status).toBe(200);
    expect(retryAck.status).toBe(200);
    const consumedStatus = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}`,
      { headers: { cookie: right.cookie } },
    );
    expect(consumedStatus.status).toBe(404);
    const leftStatus = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${nextTicket.ticketId}`,
      { headers: { cookie: left.cookie } },
    );
    expect(leftStatus.status).toBe(200);
  });
});

describe("访客进度合并", () => {
  it("隔离冲突日常并只迁移非冲突记录，同时按场次加权合并 Elo", async () => {
    const guest = await createSession();
    const password = "merge-password-12345";
    const registered = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginName: "merge_target",
        displayName: "Merge Target",
        password,
      }),
    });
    expect(registered.status).toBe(201);
    const target = await dataOf<SessionData>(registered);

    const createGame = async (cookie: string, mode: "daily" | "random") =>
      dataOf<PublicGame>(
        await SELF.fetch("https://fireflydle.games/api/games", {
          method: "POST",
          headers: { cookie, "content-type": "application/json" },
          body: JSON.stringify({ mode, difficulty: "standard" }),
        }),
      );
    const targetDaily = await createGame(registered.headers.get("set-cookie") ?? "", "daily");
    const guestDaily = await createGame(guest.cookie, "daily");
    const guestRandom = await createGame(guest.cookie, "random");
    const submitCorrect = (cookie: string, gameId: string) =>
      SELF.fetch(`https://fireflydle.games/api/games/${gameId}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
    const [targetResult, randomResult] = await Promise.all([
      submitCorrect(registered.headers.get("set-cookie") ?? "", targetDaily.id),
      submitCorrect(guest.cookie, guestRandom.id),
    ]);
    expect(targetResult.status).toBe(200);
    expect(randomResult.status).toBe(200);
    await SELF.fetch(`https://fireflydle.games/api/replays/${guestRandom.id}/share`, {
      method: "POST",
      headers: { cookie: guest.cookie },
    });

    const matchId = crypto.randomUUID();
    const roomId = crypto.randomUUID();
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO matches
           (id, room_code, match_format, ranked, winner_user_id, finish_reason,
            created_at, started_at, completed_at, archived_at)
         VALUES (?, 'MRG42', 1, 1, ?, 'score', ?, ?, ?, ?)`,
      ).bind(matchId, guest.data.user.id, now, now, now, now),
      env.DB.prepare(
        `INSERT INTO match_players
           (match_id, user_id, seat, display_name, score, rating_before, rating_after)
         VALUES (?, ?, 0, 'Guest Merge', 1, 800, 810)`,
      ).bind(matchId, guest.data.user.id),
      env.DB.prepare(
        `INSERT INTO match_rounds
           (match_id, round_number, target_character_id, winner_user_id, started_at, completed_at)
         VALUES (?, 1, ?, ?, ?, ?)`,
      ).bind(matchId, character.id, guest.data.user.id, now, now),
      env.DB.prepare(
        `INSERT INTO match_guesses
           (match_id, round_number, user_id, ordinal, character_id, result_json, guessed_at)
         VALUES (?, 1, ?, 1, ?, '{}', ?)`,
      ).bind(matchId, guest.data.user.id, character.id, now),
      env.DB.prepare(
        `INSERT INTO rating_events
           (id, match_id, user_id, rating_before, rating_after, delta, created_at)
         VALUES (?, ?, ?, 800, 810, 10, ?)`,
      ).bind(crypto.randomUUID(), matchId, guest.data.user.id, now),
      env.DB.prepare(
        `INSERT INTO room_directory
           (room_id, room_code, durable_object_name, owner_user_id, state,
            ranked, match_format, created_at, expires_at)
         VALUES (?, 'OWN42', ?, ?, 'finished', 0, 1, ?, ?)`,
      ).bind(roomId, roomId, guest.data.user.id, now, now + 60_000),
      env.DB.prepare(
        "UPDATE users SET elo = 1200, ranked_matches = 12, leaderboard_eligible = 1 WHERE id = ?",
      ).bind(target.user.id),
      env.DB.prepare(
        "UPDATE users SET elo = 800, ranked_matches = 8, leaderboard_eligible = 0 WHERE id = ?",
      ).bind(guest.data.user.id),
    ]);

    const login = await SELF.fetch("https://fireflydle.games/api/auth/login", {
      method: "POST",
      headers: { cookie: guest.cookie, "content-type": "application/json" },
      body: JSON.stringify({ loginName: "merge_target", password }),
    });
    expect(login.status).toBe(200);
    const merged = await dataOf<SessionData>(login);
    expect(merged.user.id).toBe(target.user.id);
    expect(merged.user.elo).toBe(1040);
    expect(merged.user.rankedMatches).toBe(20);

    const resultOwners = await env.DB.prepare(
      "SELECT game_id, user_id, leaderboard_hidden_at FROM game_results WHERE game_id IN (?, ?) ORDER BY game_id",
    )
      .bind(targetDaily.id, guestDaily.id)
      .all<{ game_id: string; user_id: string; leaderboard_hidden_at: number | null }>();
    expect(resultOwners.results).toHaveLength(2);
    expect(resultOwners.results.find((row) => row.game_id === targetDaily.id)?.user_id).toBe(
      target.user.id,
    );
    const isolatedDaily = resultOwners.results.find((row) => row.game_id === guestDaily.id);
    expect(isolatedDaily?.user_id).toBe(guest.data.user.id);
    expect(isolatedDaily?.leaderboard_hidden_at).not.toBeNull();
    const visibleDaily = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM game_results
       WHERE user_id = ? AND mode = 'daily' AND leaderboard_hidden_at IS NULL`,
    )
      .bind(target.user.id)
      .first<{ count: number }>();
    expect(visibleDaily?.count).toBe(1);

    const mergedCookie = login.headers.get("set-cookie") ?? "";
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/replays/${guestDaily.id}`, {
          headers: { cookie: mergedCookie },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/replays/${guestRandom.id}`, {
          headers: { cookie: mergedCookie },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/games/${guestRandom.id}`, {
          headers: { cookie: mergedCookie },
        })
      ).status,
    ).toBe(200);

    const history = await env.DB.prepare(
      `SELECT
         (SELECT winner_user_id FROM matches WHERE id = ?) AS match_winner,
         (SELECT user_id FROM match_players WHERE match_id = ?) AS match_player,
         (SELECT user_id FROM rating_events WHERE match_id = ?) AS rating_user,
         (SELECT owner_user_id FROM room_directory WHERE room_id = ?) AS room_owner,
          (SELECT created_by_user_id FROM replay_shares WHERE game_id = ?) AS share_owner,
          (SELECT merged_into_user_id FROM users WHERE id = ?) AS merged_into,
          (SELECT status FROM games WHERE id = ?) AS isolated_daily_status,
          (SELECT COUNT(*) FROM guest_progress_merges WHERE guest_user_id = ?) AS merge_count`,
    )
      .bind(
        matchId,
        matchId,
        matchId,
        roomId,
        guestRandom.id,
        guest.data.user.id,
        guestDaily.id,
        guest.data.user.id,
      )
      .first<Record<string, string>>();
    expect(history).toMatchObject({
      match_winner: target.user.id,
      match_player: target.user.id,
      rating_user: target.user.id,
      room_owner: target.user.id,
      share_owner: target.user.id,
      merged_into: target.user.id,
      isolated_daily_status: "expired",
      merge_count: 1,
    });
  });

  it("并行登录只会合并一次访客 Elo", async () => {
    const guest = await createSession();
    const target = await createRegisteredSession("concurrent_merge");
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE users SET elo = 1200, ranked_matches = 12, leaderboard_eligible = 1 WHERE id = ?",
      ).bind(target.data.user.id),
      env.DB.prepare(
        "UPDATE users SET elo = 800, ranked_matches = 8, leaderboard_eligible = 0 WHERE id = ?",
      ).bind(guest.data.user.id),
    ]);

    const login = () =>
      SELF.fetch("https://fireflydle.games/api/auth/login", {
        method: "POST",
        headers: { cookie: guest.cookie, "content-type": "application/json" },
        body: JSON.stringify({
          loginName: "registered_concurrent_merge",
          password: target.password,
        }),
      });
    const responses = await Promise.all([login(), login()]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);

    const merged = await env.DB.prepare(
      `SELECT elo, ranked_matches,
         (SELECT COUNT(*) FROM guest_progress_merges WHERE guest_user_id = ?) AS merge_count
       FROM users WHERE id = ?`,
    )
      .bind(guest.data.user.id, target.data.user.id)
      .first<{ elo: number; ranked_matches: number; merge_count: number }>();
    expect(merged).toMatchObject({ elo: 1040, ranked_matches: 20, merge_count: 1 });
  });
});

describe("邮箱验证", () => {
  it("无邮箱注册保持可用，验证邮件发送失败也不会回滚带邮箱注册", async () => {
    const outbound = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("test-email-delivery-failed"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const withoutEmail = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.101",
      },
      body: JSON.stringify({
        loginName: "without_email",
        displayName: "Without Email",
        password: "secret",
      }),
    });
    expect(withoutEmail.status).toBe(201);
    const registeredWithoutEmail = await dataOf<SessionData>(withoutEmail);
    expect(registeredWithoutEmail.user).toMatchObject({
      hasEmail: false,
      emailVerified: false,
    });
    expect(outbound).not.toHaveBeenCalled();
    const withoutEmailTokens = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM email_verification_tokens WHERE user_id = ?",
    )
      .bind(registeredWithoutEmail.user.id)
      .first<{ count: number }>();
    expect(withoutEmailTokens?.count).toBe(0);

    const withEmail = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.102",
      },
      body: JSON.stringify({
        loginName: "delivery_failure",
        displayName: "Delivery Failure",
        password: "secret",
        email: "delivery-failure@example.com",
      }),
    });
    expect(withEmail.status).toBe(201);
    const registered = await dataOf<SessionData>(withEmail);
    expect(registered.user).toMatchObject({ hasEmail: true, emailVerified: false });
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalledOnce());

    const stored = await env.DB.prepare(
      `SELECT users.email_verified,
         (SELECT COUNT(*) FROM email_verification_tokens
          WHERE user_id = users.id AND used_at IS NULL) AS token_count
       FROM users WHERE id = ?`,
    )
      .bind(registered.user.id)
      .first<{ email_verified: number; token_count: number }>();
    expect(stored).toMatchObject({ email_verified: 0, token_count: 1 });
  });

  it("重发会使旧 token 失效，确认后刷新会话中的邮箱状态", async () => {
    const emailedTokens: string[] = [];
    const outbound = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      expect(request.url).toBe("https://api.resend.com/emails");
      expect(request.headers.get("authorization")).toBe("Bearer test-resend-key");
      const body = (await request.json()) as {
        from?: unknown;
        to?: unknown;
        subject?: unknown;
        text?: unknown;
        html?: unknown;
      };
      expect(body).toMatchObject({
        from: "Fireflydle <account@fireflydle.games>",
        to: ["Verify@Example.com"],
        subject: "[Fireflydle] 验证你的邮箱",
      });
      expect(body.html).toEqual(expect.stringContaining(">验证邮箱</a>"));
      expect(body.html).toEqual(expect.stringContaining("verify-email?token="));
      if (typeof body.text === "string") {
        const match = /verify-email\?token=([^\s]+)/u.exec(body.text);
        if (match?.[1]) emailedTokens.push(decodeURIComponent(match[1]));
      }
      return Response.json({ id: "email-verification-test" });
    });

    const response = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.103",
      },
      body: JSON.stringify({
        loginName: "verify_email",
        displayName: "Verify Email",
        password: "secret",
        email: "Verify@Example.com",
      }),
    });
    expect(response.status).toBe(201);
    const registered = await dataOf<SessionData>(response);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(registered.user).toMatchObject({ hasEmail: true, emailVerified: false });
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledOnce());

    const resent = await SELF.fetch(
      "https://fireflydle.games/api/auth/email-verification/request",
      { method: "POST", headers: { cookie } },
    );
    expect(resent.status).toBe(200);
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledTimes(2));
    expect(emailedTokens).toHaveLength(2);

    const currentToken = emailedTokens[1];
    if (!currentToken) throw new Error("未从验证邮件中取得 token");
    const stored = await env.DB.prepare(
      `SELECT token_hash FROM email_verification_tokens
       WHERE user_id = ? AND used_at IS NULL`,
    )
      .bind(registered.user.id)
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(currentToken);

    const confirm = (token: string) =>
      SELF.fetch("https://fireflydle.games/api/auth/email-verification/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
    expect((await confirm(emailedTokens[0] ?? "")).status).toBe(400);
    expect((await confirm(currentToken)).status).toBe(200);
    expect((await confirm(currentToken)).status).toBe(400);

    const me = await SELF.fetch("https://fireflydle.games/api/auth/me", { headers: { cookie } });
    expect((await dataOf<SessionData["user"]>(me)).emailVerified).toBe(true);
  });
});

describe("密码重置", () => {
  it("未验证邮箱保持不可枚举且不创建 token 或发送邮件", async () => {
    const now = Date.now();
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users
         (id, login_name, login_name_normalized, display_name, display_name_normalized,
          password_hash, password_salt, password_iterations, email, email_normalized,
          role, is_guest, email_verified, elo, ranked_matches, leaderboard_eligible,
          created_at, updated_at)
       VALUES (?, 'unverified_reset', 'unverified_reset', 'Unverified Reset', 'unverified reset',
               'old-hash', 'old-salt', 1, 'unverified@example.com', 'unverified@example.com',
               'player', 0, 0, 1000, 0, 0, ?, ?)`,
    )
      .bind(userId, now, now)
      .run();
    const outbound = vi.spyOn(globalThis, "fetch");

    const requested = await SELF.fetch("https://fireflydle.games/api/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unverified@example.com" }),
    });
    expect(requested.status).toBe(200);
    expect(await dataOf<{ accepted: boolean }>(requested)).toEqual({ accepted: true });
    expect(outbound).not.toHaveBeenCalled();
    const stored = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ?",
    )
      .bind(userId)
      .first<{ count: number }>();
    expect(stored?.count).toBe(0);
  });

  it("只存 token hash，通过 Resend 发送并且 token 一次性使用", async () => {
    const now = Date.now();
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users
         (id, login_name, login_name_normalized, display_name, display_name_normalized,
          password_hash, password_salt, password_iterations, email, email_normalized,
          role, is_guest, email_verified, elo, ranked_matches, leaderboard_eligible,
          created_at, updated_at)
       VALUES (?, 'reset_user', 'reset_user', 'Reset User', 'reset user',
               'old-hash', 'old-salt', 1, 'reset@example.com', 'reset@example.com',
               'player', 0, 1, 1000, 0, 0, ?, ?)`,
    )
      .bind(userId, now, now)
      .run();

    let emailedToken: string | null = null;
    const outbound = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      expect(request.url).toBe("https://api.resend.com/emails");
      expect(request.headers.get("authorization")).toBe("Bearer test-resend-key");
      const body: unknown = await request.json();
      if (typeof body === "object" && body !== null && "text" in body) {
        expect(body).toMatchObject({
          from: "Fireflydle <account@fireflydle.games>",
          to: ["reset@example.com"],
          subject: "[Fireflydle] 重置你的密码",
          html: expect.stringContaining(">重置密码</a>"),
        });
        if (typeof body.text === "string") {
          const match = /recover\?token=([^\s]+)/u.exec(body.text);
          emailedToken = match?.[1] ? decodeURIComponent(match[1]) : null;
        }
      }
      return Response.json({ id: "email-test" });
    });

    const requested = await SELF.fetch("https://fireflydle.games/api/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "reset@example.com" }),
    });
    expect(requested.status).toBe(200);
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledOnce());
    if (!emailedToken) throw new Error("未从邮件中取得重置 token");
    const stored = await env.DB.prepare(
      "SELECT token_hash FROM password_reset_tokens WHERE user_id = ?",
    )
      .bind(userId)
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(emailedToken);

    const confirm = (password: string) =>
      SELF.fetch("https://fireflydle.games/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: emailedToken, password }),
      });
    expect((await confirm("x".repeat(PASSWORD_MIN_LENGTH - 1))).status).toBe(400);
    expect((await confirm("x".repeat(PASSWORD_MIN_LENGTH))).status).toBe(200);
    expect((await confirm("x".repeat(PASSWORD_MIN_LENGTH))).status).toBe(400);
  });
});

describe("持久化限流", () => {
  it("跨请求累计登录失败并返回统一重试信息", async () => {
    const attempt = () =>
      SELF.fetch("https://fireflydle.games/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "203.0.113.77",
        },
        body: JSON.stringify({ loginName: "rate_limited_identity", password: "wrong" }),
      });
    for (let index = 0; index < 10; index += 1) {
      expect((await attempt()).status).toBe(401);
    }
    const limited = await attempt();
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    const payload = (await limited.json()) as {
      ok: boolean;
      error: { code: string; details: { retryAfter: number; retryAt: string } };
    };
    expect(payload).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(payload.error.details.retryAfter).toBeGreaterThan(0);
    expect(Date.parse(payload.error.details.retryAt)).not.toBeNaN();
    const persisted = await env.DB.prepare(
      "SELECT request_count, blocked_until FROM rate_limits WHERE scope = 'auth:login:identity'",
    ).first<{ request_count: number; blocked_until: number }>();
    expect(persisted?.request_count).toBe(11);
    expect(persisted?.blocked_until ?? 0).toBeGreaterThan(Date.now());
  });
});
