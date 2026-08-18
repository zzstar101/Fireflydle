import {
  CreateGameRequestSchema,
  SubmitGuessRequestSchema,
  type CreateGameRequest,
} from "@fireflydle/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson } from "../lib/http";
import {
  concedeGame,
  createGame,
  getCurrentGames,
  getPublicGame,
  submitGameGuess,
} from "../services/games";
import { requireAuth } from "../services/auth";
import { enforceRateLimit } from "../services/rate-limit";
import type { AppContext } from "../types";

export const gameRoutes = new Hono<AppContext>();

const LegacyCreateGameRequestSchema = z.strictObject({
  mode: z.enum(["daily", "random"]),
  modeId: z.enum(["playable", "npc", "currency-wars"]).optional(),
  difficulty: z.enum(["casual", "standard", "hard"]).optional(),
});

function normalizeCreateGameRequest(input: unknown): CreateGameRequest | null {
  const current = CreateGameRequestSchema.safeParse(input);
  if (current.success) return current.data;
  const legacy = LegacyCreateGameRequestSchema.safeParse(input);
  if (!legacy.success) return null;
  return {
    modeId: legacy.data.modeId ?? "playable",
    activityId: legacy.data.mode === "daily" ? "daily" : "practice",
  };
}

gameRoutes.get("/games/current", async (context) => {
  const auth = requireAuth(context);
  return ok(context, await getCurrentGames(context.env.DB, auth.user.id));
});

gameRoutes.post("/games", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "games:create:user", auth.user.id, {
    limit: 30,
    windowMs: 60 * 1_000,
  });
  const input = normalizeCreateGameRequest(await readJson(context));
  if (!input) throw new ApiProblem("VALIDATION_FAILED", 400);
  return ok(context, await createGame(context.env.DB, auth.user.id, input), 201);
});

gameRoutes.get("/games/:gameId", async (context) => {
  const auth = requireAuth(context);
  return ok(
    context,
    await getPublicGame(context.env.DB, context.req.param("gameId"), auth.user.id),
  );
});

gameRoutes.post("/games/:gameId/guesses", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "games:guess:user", auth.user.id, {
    limit: 30,
    windowMs: 60 * 1_000,
  });
  const parsed = SubmitGuessRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  return ok(
    context,
    await submitGameGuess(
      context.env.DB,
      context.req.param("gameId"),
      auth.user.id,
      parsed.data.characterId,
    ),
  );
});

gameRoutes.post("/games/:gameId/concede", async (context) => {
  const auth = requireAuth(context);
  return ok(context, await concedeGame(context.env.DB, context.req.param("gameId"), auth.user.id));
});
