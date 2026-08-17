import { StartWeeklyRunRequestSchema, SubmitGuessRequestSchema } from "@fireflydle/contracts";
import { getBeijingWeekKey } from "@fireflydle/game-engine";
import { Hono } from "hono";
import { z } from "zod";
import { randomToken, sha256 } from "../lib/crypto";
import { ApiProblem, ok, readJson } from "../lib/http";
import { requireAuth } from "../services/auth";
import { forfeitWeeklyGame, submitGameGuess } from "../services/games";
import { enforceRateLimit } from "../services/rate-limit";
import {
  getCurrentWeeklyRun,
  getSharedWeeklyRun,
  getWeeklyRun,
  startWeeklyRun,
} from "../services/weekly";
import type { AppContext } from "../types";

const IdentifierSchema = z.string().uuid();
const ShareTokenSchema = z.string().min(32).max(256);

export const weeklyRoutes = new Hono<AppContext>();

weeklyRoutes.get("/weekly/runs/current", async (context) => {
  const auth = requireAuth(context);
  return ok(context, await getCurrentWeeklyRun(context.env.DB, auth.user.id));
});

weeklyRoutes.post("/weekly/runs", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "weekly:start:user", auth.user.id, {
    limit: 10,
    windowMs: 60 * 1_000,
  });
  const parsed = StartWeeklyRunRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  return ok(
    context,
    await startWeeklyRun(context.env.DB, auth.user.id, auth.user.isGuest, parsed.data.practice),
    201,
  );
});

weeklyRoutes.get("/weekly/runs/:runId", async (context) => {
  const auth = requireAuth(context);
  const parsed = IdentifierSchema.safeParse(context.req.param("runId"));
  if (!parsed.success) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, await getWeeklyRun(context.env.DB, parsed.data, auth.user.id));
});

weeklyRoutes.post("/weekly/runs/:runId/guesses", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "games:guess:user", auth.user.id, {
    limit: 30,
    windowMs: 60 * 1_000,
  });
  const runId = IdentifierSchema.safeParse(context.req.param("runId"));
  const guess = SubmitGuessRequestSchema.safeParse(await readJson(context));
  if (!runId.success || !guess.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const run = await getWeeklyRun(context.env.DB, runId.data, auth.user.id);
  if (!run.currentGame) throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  await submitGameGuess(context.env.DB, run.currentGame.id, auth.user.id, guess.data.characterId);
  return ok(context, await getWeeklyRun(context.env.DB, run.id, auth.user.id));
});

weeklyRoutes.post("/weekly/runs/:runId/forfeit", async (context) => {
  const auth = requireAuth(context);
  const runId = IdentifierSchema.safeParse(context.req.param("runId"));
  if (!runId.success) throw new ApiProblem("NOT_FOUND", 404);
  const run = await getWeeklyRun(context.env.DB, runId.data, auth.user.id);
  if (!run.currentGame) throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  await forfeitWeeklyGame(context.env.DB, run.currentGame.id, auth.user.id);
  return ok(context, await getWeeklyRun(context.env.DB, run.id, auth.user.id));
});

weeklyRoutes.post("/weekly/runs/:runId/share", async (context) => {
  const auth = requireAuth(context);
  const parsed = IdentifierSchema.safeParse(context.req.param("runId"));
  if (!parsed.success) throw new ApiProblem("NOT_FOUND", 404);
  const run = await getWeeklyRun(context.env.DB, parsed.data, auth.user.id);
  if (run.status !== "completed") {
    throw new ApiProblem("VALIDATION_FAILED", 409, { reason: "weekly-run-active" });
  }
  const token = randomToken(32);
  const now = Date.now();
  await context.env.DB.prepare(
    `INSERT INTO weekly_run_shares
       (id, run_id, created_by_user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      run.id,
      auth.user.id,
      await sha256(token),
      now,
      Date.parse(run.weekEndsAt) + 30 * 24 * 60 * 60 * 1_000,
    )
    .run();
  return ok(
    context,
    { url: `${context.env.PUBLIC_WEB_URL.replace(/\/$/u, "")}/weekly/shared/${token}` },
    201,
  );
});

weeklyRoutes.get("/weekly/shared/:token", async (context) => {
  const parsed = ShareTokenSchema.safeParse(context.req.param("token"));
  if (!parsed.success) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, await getSharedWeeklyRun(context.env.DB, await sha256(parsed.data)));
});

weeklyRoutes.get("/leaderboards/weekly", async (context) => {
  const weekKey = context.req.query("week") ?? getBeijingWeekKey();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(weekKey)) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { field: "week" });
  }
  const rows = await context.env.DB.prepare(
    `SELECT u.display_name, score.correct_count, score.total_guesses,
            score.elapsed_ms, score.completed_at
     FROM weekly_scores score JOIN users u ON u.id = score.user_id
     WHERE score.week_key = ? AND u.is_guest = 0 AND u.merged_into_user_id IS NULL
     ORDER BY score.correct_count DESC, score.total_guesses ASC,
              score.elapsed_ms ASC, score.completed_at ASC, score.run_id ASC
     LIMIT 100`,
  )
    .bind(weekKey)
    .all<{
      display_name: string;
      correct_count: number;
      total_guesses: number;
      elapsed_ms: number;
      completed_at: number;
    }>();
  return ok(
    context,
    rows.results.map((row, index) => ({
      rank: index + 1,
      displayName: row.display_name,
      correctCount: row.correct_count,
      totalGuesses: row.total_guesses,
      elapsedMs: row.elapsed_ms,
      completedAt: new Date(row.completed_at).toISOString(),
    })),
  );
});
