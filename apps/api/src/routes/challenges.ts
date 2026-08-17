import { Hono } from "hono";
import { ok } from "../lib/http";
import { requireAuth } from "../services/auth";
import {
  createFriendChallenge,
  getFriendChallenge,
  startFriendChallenge,
} from "../services/challenges";
import { enforceRateLimit } from "../services/rate-limit";
import type { AppContext } from "../types";

export const challengeRoutes = new Hono<AppContext>();

challengeRoutes.post("/games/:gameId/challenges", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "challenges:create:user", auth.user.id, {
    limit: 20,
    windowMs: 60 * 1_000,
  });
  return ok(
    context,
    await createFriendChallenge(context.env.DB, context.req.param("gameId"), auth.user.id),
    201,
  );
});

challengeRoutes.get("/challenges/:challengeId", async (context) => {
  const auth = requireAuth(context);
  return ok(
    context,
    await getFriendChallenge(context.env.DB, context.req.param("challengeId"), auth.user.id),
  );
});

challengeRoutes.post("/challenges/:challengeId/attempts", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "challenges:start:user", auth.user.id, {
    limit: 20,
    windowMs: 60 * 1_000,
  });
  return ok(
    context,
    await startFriendChallenge(context.env.DB, context.req.param("challengeId"), auth.user.id),
    201,
  );
});
