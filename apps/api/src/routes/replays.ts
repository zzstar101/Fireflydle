import type {
  ActivityId,
  Character,
  ContentModeId,
  GuessResult,
  MatchFinishReason,
  MultiplayerReplay,
} from "@fireflydle/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { randomToken, sha256 } from "../lib/crypto";
import { ApiProblem, ok } from "../lib/http";
import { requireAuth } from "../services/auth";
import { getReplayGame } from "../services/games";
import type { AppContext } from "../types";

const GameIdSchema = z.string().uuid();
const ShareTokenSchema = z.string().min(32).max(256);

interface ReplayResultRow {
  user_id: string;
  replay_expires_at: number;
  replay_deleted_at: number | null;
}

interface MatchRow {
  id: string;
  mode_id: ContentModeId;
  activity_id: ActivityId;
  match_format: 1 | 3 | 5 | 7;
  ranked: number;
  winner_user_id: string | null;
  finish_reason: MatchFinishReason;
  started_at: number;
  completed_at: number;
}

interface MatchPlayerRow {
  user_id: string;
  seat: 0 | 1;
  display_name: string;
  score: number;
  rating_before: number;
  rating_after: number;
}

interface MatchRoundRow {
  round_number: number;
  target_json: string;
  winner_user_id: string | null;
  started_at: number;
  completed_at: number;
}

interface MatchGuessRow {
  round_number: number;
  user_id: string;
  ordinal: number;
  result_json: string;
}

function gameId(value: string): string {
  const parsed = GameIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiProblem("NOT_FOUND", 404);
  return parsed.data;
}

async function replayResult(db: D1Database, id: string): Promise<ReplayResultRow> {
  const result = await db
    .prepare(
      "SELECT user_id, replay_expires_at, replay_deleted_at FROM game_results WHERE game_id = ?",
    )
    .bind(id)
    .first<ReplayResultRow>();
  if (!result || result.replay_deleted_at !== null || result.replay_expires_at <= Date.now()) {
    throw new ApiProblem("NOT_FOUND", 404);
  }
  return result;
}

async function multiplayerReplay(
  db: D1Database,
  id: string,
  userId: string,
): Promise<MultiplayerReplay | null> {
  const match = await db
    .prepare(
      `SELECT m.id, m.mode_id, m.activity_id, m.match_format, m.ranked, m.winner_user_id,
              COALESCE(m.resolution, m.finish_reason) AS finish_reason,
              m.started_at, m.completed_at
       FROM matches m
       JOIN match_players own ON own.match_id = m.id AND own.user_id = ?
       WHERE m.id = ?`,
    )
    .bind(userId, id)
    .first<MatchRow>();
  if (!match) return null;

  const [players, rounds, guesses] = await Promise.all([
    db
      .prepare(
        `SELECT user_id, seat, display_name, score, rating_before, rating_after
         FROM match_players WHERE match_id = ? ORDER BY seat`,
      )
      .bind(id)
      .all<MatchPlayerRow>(),
    db
      .prepare(
        `SELECT mr.round_number, COALESCE(mr.target_json, c.payload_json) AS target_json,
                mr.winner_user_id, mr.started_at, mr.completed_at
         FROM match_rounds mr
         LEFT JOIN characters c ON c.id = mr.target_character_id
         WHERE mr.match_id = ? ORDER BY mr.round_number`,
      )
      .bind(id)
      .all<MatchRoundRow>(),
    db
      .prepare(
        `SELECT round_number, user_id, ordinal, result_json
         FROM match_guesses WHERE match_id = ?
         ORDER BY round_number, user_id, ordinal`,
      )
      .bind(id)
      .all<MatchGuessRow>(),
  ]);

  return {
    id: match.id,
    modeId: match.mode_id,
    activityId: match.activity_id,
    format: match.match_format,
    ranked: match.ranked === 1,
    finishReason: match.finish_reason,
    winnerPlayerId: match.winner_user_id,
    startedAt: new Date(match.started_at).toISOString(),
    completedAt: new Date(match.completed_at).toISOString(),
    players: players.results.map((player) => ({
      playerId: player.user_id,
      seat: player.seat,
      displayName: player.display_name,
      score: player.score,
      ratingBefore: player.rating_before,
      ratingAfter: player.rating_after,
    })),
    rounds: rounds.results.map((round) => ({
      roundNumber: round.round_number,
      answer: JSON.parse(round.target_json) as Character,
      winnerPlayerId: round.winner_user_id,
      startedAt: new Date(round.started_at).toISOString(),
      completedAt: new Date(round.completed_at).toISOString(),
      guesses: guesses.results
        .filter((guess) => guess.round_number === round.round_number)
        .map((guess) => ({
          playerId: guess.user_id,
          ordinal: guess.ordinal,
          result: JSON.parse(guess.result_json) as GuessResult,
        })),
    })),
  };
}

export const replayRoutes = new Hono<AppContext>();

replayRoutes.get("/replays/shared/:token", async (context) => {
  const parsed = ShareTokenSchema.safeParse(context.req.param("token"));
  if (!parsed.success) throw new ApiProblem("NOT_FOUND", 404);
  const tokenHash = await sha256(parsed.data);
  const share = await context.env.DB.prepare(
    `SELECT rs.game_id, gr.replay_expires_at, gr.replay_deleted_at
     FROM replay_shares rs
     JOIN game_results gr ON gr.game_id = rs.game_id
     WHERE rs.token_hash = ? AND rs.revoked_at IS NULL AND rs.expires_at > ?`,
  )
    .bind(tokenHash, Date.now())
    .first<{
      game_id: string;
      replay_expires_at: number;
      replay_deleted_at: number | null;
    }>();
  if (!share || share.replay_deleted_at !== null || share.replay_expires_at <= Date.now()) {
    throw new ApiProblem("NOT_FOUND", 404);
  }
  return ok(context, {
    kind: "solo" as const,
    game: await getReplayGame(context.env.DB, share.game_id),
    visibility: "shared" as const,
    expiresAt: new Date(share.replay_expires_at).toISOString(),
  });
});

replayRoutes.get("/replays/:gameId", async (context) => {
  const identifier = context.req.param("gameId");
  const parsedId = GameIdSchema.safeParse(identifier);
  if (!parsedId.success) {
    const parsedToken = ShareTokenSchema.safeParse(identifier);
    if (!parsedToken.success) throw new ApiProblem("NOT_FOUND", 404);
    const share = await context.env.DB.prepare(
      `SELECT rs.game_id, gr.replay_expires_at, gr.replay_deleted_at
       FROM replay_shares rs
       JOIN game_results gr ON gr.game_id = rs.game_id
       WHERE rs.token_hash = ? AND rs.revoked_at IS NULL AND rs.expires_at > ?`,
    )
      .bind(await sha256(parsedToken.data), Date.now())
      .first<{
        game_id: string;
        replay_expires_at: number;
        replay_deleted_at: number | null;
      }>();
    if (!share || share.replay_deleted_at !== null || share.replay_expires_at <= Date.now()) {
      throw new ApiProblem("NOT_FOUND", 404);
    }
    return ok(context, {
      kind: "solo" as const,
      game: await getReplayGame(context.env.DB, share.game_id),
      visibility: "shared" as const,
      expiresAt: new Date(share.replay_expires_at).toISOString(),
    });
  }
  const auth = requireAuth(context);
  const id = parsedId.data;
  const result = await context.env.DB.prepare(
    "SELECT user_id, replay_expires_at, replay_deleted_at FROM game_results WHERE game_id = ?",
  )
    .bind(id)
    .first<ReplayResultRow>();
  if (
    result &&
    result.user_id === auth.user.id &&
    result.replay_deleted_at === null &&
    result.replay_expires_at > Date.now()
  ) {
    return ok(context, {
      kind: "solo" as const,
      game: await getReplayGame(context.env.DB, id),
      visibility: "private" as const,
      expiresAt: new Date(result.replay_expires_at).toISOString(),
    });
  }

  let match = await multiplayerReplay(context.env.DB, id, auth.user.id);
  if (!match) {
    const room = await context.env.DB.prepare(
      "SELECT durable_object_name FROM room_directory WHERE room_id = ?",
    )
      .bind(id)
      .first<{ durable_object_name: string }>();
    if (room) {
      await context.env.GAME_ROOM.getByName(room.durable_object_name).archiveForPlayer(
        auth.user.id,
      );
      match = await multiplayerReplay(context.env.DB, id, auth.user.id);
    }
  }
  if (!match) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, {
    kind: "multiplayer" as const,
    match,
    visibility: "private" as const,
    expiresAt: null,
  });
});

replayRoutes.post("/replays/:gameId/share", async (context) => {
  const auth = requireAuth(context);
  const id = gameId(context.req.param("gameId"));
  const result = await replayResult(context.env.DB, id);
  if (result.user_id !== auth.user.id) throw new ApiProblem("NOT_FOUND", 404);
  const token = randomToken(32);
  const now = Date.now();
  await context.env.DB.prepare(
    `INSERT INTO replay_shares
       (id, game_id, created_by_user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), id, auth.user.id, await sha256(token), now, result.replay_expires_at)
    .run();
  return ok(
    context,
    {
      url: `${context.env.PUBLIC_WEB_URL.replace(/\/$/u, "")}/replay/${token}`,
      visibility: "shared" as const,
    },
    201,
  );
});

replayRoutes.delete("/replays/:gameId/share", async (context) => {
  const auth = requireAuth(context);
  const id = gameId(context.req.param("gameId"));
  const result = await replayResult(context.env.DB, id);
  if (result.user_id !== auth.user.id) throw new ApiProblem("NOT_FOUND", 404);
  await context.env.DB.prepare(
    `UPDATE replay_shares SET revoked_at = ?
     WHERE game_id = ? AND created_by_user_id = ? AND revoked_at IS NULL`,
  )
    .bind(Date.now(), id, auth.user.id)
    .run();
  return ok(context, { revoked: true });
});
