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
      game: await getReplayGame(context.env.DB, share.game_id),
      visibility: "shared" as const,
      expiresAt: new Date(share.replay_expires_at).toISOString(),
    });
  }
  const auth = requireAuth(context);
  const id = parsedId.data;
  const result = await replayResult(context.env.DB, id);
  if (result.user_id !== auth.user.id) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, {
    game: await getReplayGame(context.env.DB, id),
    visibility: "private" as const,
    expiresAt: new Date(result.replay_expires_at).toISOString(),
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
