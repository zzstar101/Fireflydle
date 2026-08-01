import { CreateGameRequestSchema, SubmitGuessRequestSchema } from "@fireflydle/contracts";
import { Hono } from "hono";
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
  const parsed = CreateGameRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  return ok(context, await createGame(context.env.DB, auth.user.id, parsed.data), 201);
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
