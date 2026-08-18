import { ContentModeIdSchema, SubmitGuessRequestSchema } from "@fireflydle/contracts";
import { Hono } from "hono";
import { ApiProblem, ok, readJson } from "../lib/http";
import {
  createOrResumeEndlessRun,
  getEndlessLeaderboard,
  getEndlessRun,
  skipEndlessRound,
  submitEndlessGuess,
} from "../services/endless";
import { requireAuth } from "../services/auth";
import { enforceRateLimit } from "../services/rate-limit";
import type { AppContext } from "../types";

export const endlessRoutes = new Hono<AppContext>();

endlessRoutes.post("/endless", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "endless:create:user", auth.user.id, {
    limit: 10,
    windowMs: 60 * 1_000,
  });
  const mode = ContentModeIdSchema.safeParse(context.req.query("modeId") ?? "playable");
  if (!mode.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  if (mode.data === "npc") {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "npc-mode-disabled" });
  }
  return ok(context, await createOrResumeEndlessRun(context.env.DB, auth.user.id, mode.data), 201);
});

endlessRoutes.get("/endless/:runId", async (context) => {
  const auth = requireAuth(context);
  return ok(context, await getEndlessRun(context.env.DB, context.req.param("runId"), auth.user.id));
});

endlessRoutes.post("/endless/:runId/guesses", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "endless:guess:user", auth.user.id, {
    limit: 30,
    windowMs: 60 * 1_000,
  });
  const parsed = SubmitGuessRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  return ok(
    context,
    await submitEndlessGuess(
      context.env.DB,
      context.req.param("runId"),
      auth.user.id,
      parsed.data.characterId,
    ),
  );
});

endlessRoutes.post("/endless/:runId/skip", async (context) => {
  const auth = requireAuth(context);
  return ok(
    context,
    await skipEndlessRound(context.env.DB, context.req.param("runId"), auth.user.id),
  );
});

endlessRoutes.get("/leaderboards/endless", async (context) => {
  const mode = ContentModeIdSchema.safeParse(context.req.query("modeId") ?? "playable");
  if (!mode.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  if (mode.data === "npc") {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "npc-mode-disabled" });
  }
  return ok(context, await getEndlessLeaderboard(context.env.DB, mode.data));
});
