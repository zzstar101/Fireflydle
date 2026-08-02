import { Hono } from "hono";
import { z } from "zod";
import { getEnabledCharacters, getTargetPool } from "../lib/db";
import { ApiProblem, ok } from "../lib/http";
import { requireAuth } from "../services/auth";
import { enforceRateLimit } from "../services/rate-limit";
import type { AppContext, AuthUser } from "../types";

const TicketSchema = z.string().uuid();
const RANKED_FORMAT = 3 as const;

function participant(user: AuthUser) {
  return {
    userId: user.id,
    displayName: user.displayName,
    isGuest: user.isGuest,
    rating: user.elo,
    rankedMatches: user.rankedMatches,
  };
}

function matchmakerName(): string {
  return "ranked:bo3";
}

function validatedTicket(value: string): string {
  const parsed = TicketSchema.safeParse(value);
  if (!parsed.success) throw new ApiProblem("NOT_FOUND", 404);
  return parsed.data;
}

export const matchmakingRoutes = new Hono<AppContext>();

matchmakingRoutes.post("/matchmaking", async (context) => {
  const auth = requireAuth(context, false);
  await enforceRateLimit(context.env.DB, "matchmaking:enqueue:user", auth.user.id, {
    limit: 10,
    windowMs: 60 * 1_000,
  });
  const [characters, targets] = await Promise.all([
    getEnabledCharacters(context.env.DB),
    getTargetPool(context.env.DB),
  ]);
  if (targets.length === 0) {
    throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  }
  const result = await context.env.MATCHMAKER.getByName(matchmakerName()).enqueue({
    participant: participant(auth.user),
    format: RANKED_FORMAT,
    ranked: true,
    characters,
    targetIds: targets.map((character) => character.id),
  });
  return ok(context, result, result.status === "waiting" ? 202 : 200);
});

matchmakingRoutes.get("/matchmaking/socket", async (context) => {
  const auth = requireAuth(context, false);
  const ticketId = validatedTicket(context.req.query("ticketId") ?? "");
  const headers = new Headers(context.req.raw.headers);
  headers.set("x-fireflydle-player-id", auth.user.id);
  const url = new URL(context.req.url);
  url.searchParams.set("ticketId", ticketId);
  return context.env.MATCHMAKER.getByName(matchmakerName()).fetch(
    new Request(url, { method: "GET", headers }),
  );
});

matchmakingRoutes.get("/matchmaking/:ticketId", async (context) => {
  const auth = requireAuth(context, false);
  const ticketId = validatedTicket(context.req.param("ticketId"));
  const result = await context.env.MATCHMAKER.getByName(matchmakerName()).status(
    ticketId,
    auth.user.id,
  );
  if (!result) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, result);
});

matchmakingRoutes.delete("/matchmaking/:ticketId", async (context) => {
  const auth = requireAuth(context, false);
  const ticketId = validatedTicket(context.req.param("ticketId"));
  const disposition = await context.env.MATCHMAKER.getByName(matchmakerName()).release(
    ticketId,
    auth.user.id,
  );
  if (disposition === "active") {
    throw new ApiProblem("FORBIDDEN", 409, { reason: "active-ranked-room" });
  }
  if (!disposition) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, {
    ticketId,
    cancelled: disposition === "cancelled",
    acknowledged: disposition === "acknowledged",
  });
});

matchmakingRoutes.post("/matchmaking/:ticketId/ack", async (context) => {
  const auth = requireAuth(context, false);
  const ticketId = validatedTicket(context.req.param("ticketId"));
  const acknowledged = await context.env.MATCHMAKER.getByName(matchmakerName()).acknowledge(
    ticketId,
    auth.user.id,
  );
  if (acknowledged === "active") {
    throw new ApiProblem("FORBIDDEN", 409, { reason: "active-ranked-room" });
  }
  if (!acknowledged) throw new ApiProblem("NOT_FOUND", 404);
  return ok(context, { ticketId, acknowledged: true });
});

matchmakingRoutes.get("/matchmaking/:ticketId/socket", async (context) => {
  const auth = requireAuth(context, false);
  const ticketId = validatedTicket(context.req.param("ticketId"));
  const headers = new Headers(context.req.raw.headers);
  headers.set("x-fireflydle-player-id", auth.user.id);
  const url = new URL(context.req.url);
  url.searchParams.set("ticketId", ticketId);
  return context.env.MATCHMAKER.getByName(matchmakerName()).fetch(
    new Request(url, { method: "GET", headers }),
  );
});
