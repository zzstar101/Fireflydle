import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { accountRoutes } from "./routes/account";
import { adminRoutes } from "./routes/admin";
import { analyticsRoutes } from "./routes/analytics";
import { announcementRoutes } from "./routes/announcements";
import { authRoutes } from "./routes/auth";
import { characterRoutes } from "./routes/characters";
import { challengeRoutes } from "./routes/challenges";
import { gameRoutes } from "./routes/games";
import { endlessRoutes } from "./routes/endless";
import { matchmakingRoutes } from "./routes/matchmaking";
import { replayRoutes } from "./routes/replays";
import { roomRoutes } from "./routes/rooms";
import { weeklyRoutes } from "./routes/weekly";
import { feedbackRoutes } from "./routes/feedback";
import { ApiProblem, ok, problemResponse } from "./lib/http";
import { resolveAuth } from "./services/auth";
import { runScheduledMaintenance } from "./services/maintenance";
import { recordRequestOperations } from "./services/operations";
import type { AppContext } from "./types";

export { GameRoom } from "./durable-objects/game-room";
export { Matchmaker } from "./durable-objects/matchmaker";

const ALLOWED_PRODUCTION_ORIGINS = new Set([
  "https://fireflydle.games",
  "https://www.fireflydle.games",
]);
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function failureDetails(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    const details: Record<string, string> = {
      errorName: error.name,
      errorMessage: error.message,
    };
    if (error.stack) details.errorStack = error.stack.slice(0, 8_000);
    if (error.cause instanceof Error) {
      details.errorCauseName = error.cause.name;
      details.errorCauseMessage = error.cause.message;
    } else if (error.cause !== undefined) {
      details.errorCause = String(error.cause).slice(0, 2_000);
    }
    return details;
  }
  return { errorMessage: String(error).slice(0, 2_000) };
}

function logRequestFailure(
  context: Parameters<MiddlewareHandler<AppContext>>[0],
  error: unknown,
): void {
  console.error(
    JSON.stringify({
      event: "request-failed",
      requestId: context.get("requestId"),
      method: context.req.method,
      path: new URL(context.req.url).pathname,
      responseStatus: 500,
      ...failureDetails(error),
    }),
  );
}

export function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (ALLOWED_PRODUCTION_ORIGINS.has(url.origin)) return true;
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOCAL_HOSTNAMES.has(url.hostname.toLocaleLowerCase("en-US"))
    );
  } catch {
    return false;
  }
}

function setCorsHeaders(
  context: Parameters<MiddlewareHandler<AppContext>>[0],
  origin: string,
): void {
  context.header("Access-Control-Allow-Origin", origin);
  context.header("Access-Control-Allow-Credentials", "true");
  context.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  context.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Visit-Session-Id,X-Guest-Id",
  );
  context.header("Access-Control-Max-Age", "86400");
  context.header("Vary", "Origin", { append: true });
}

const corsMiddleware: MiddlewareHandler<AppContext> = async (context, next) => {
  const origin = context.req.header("origin");
  if (origin && !isAllowedOrigin(origin)) throw new ApiProblem("FORBIDDEN", 403);
  if (context.req.method === "OPTIONS") {
    if (origin) setCorsHeaders(context, origin);
    return context.body(null, 204);
  }
  await next();
  if (origin && context.res.status !== 101) setCorsHeaders(context, origin);
};

export const app = new Hono<AppContext>();

app.use("*", async (context, next) => {
  const requestId = crypto.randomUUID();
  context.set("requestId", requestId);
  context.header("X-Request-Id", requestId);
  await next();
});

const api = new Hono<AppContext>();
api.use("*", corsMiddleware);
api.use("*", async (context, next) => {
  const startedAt = performance.now();
  try {
    context.set("auth", await resolveAuth(context.env, context.req.raw));
    await next();
  } catch (error) {
    const problem = error instanceof ApiProblem ? error : new ApiProblem("INTERNAL_ERROR", 500);
    context.set("errorCode", problem.code);
    if (!(error instanceof ApiProblem)) {
      logRequestFailure(context, error);
    }
    context.res = problemResponse(context, problem);
  }
  recordRequestOperations(context, startedAt);
});

api.get("/health", (context) =>
  ok(context, {
    status: "ok",
    service: "fireflydle-api",
    timestamp: new Date().toISOString(),
  }),
);
api.route("/", authRoutes);
api.route("/", accountRoutes);
api.route("/", characterRoutes);
api.route("/", challengeRoutes);
api.route("/", gameRoutes);
api.route("/", endlessRoutes);
api.route("/", roomRoutes);
api.route("/", matchmakingRoutes);
api.route("/", analyticsRoutes);
api.route("/", replayRoutes);
api.route("/", announcementRoutes);
api.route("/", weeklyRoutes);
api.route("/", feedbackRoutes);
api.route("/", adminRoutes);

app.route("/api", api);

app.notFound((context) => {
  context.set("errorCode", "NOT_FOUND");
  return problemResponse(context, new ApiProblem("NOT_FOUND", 404));
});
app.onError((error, context) => {
  if (error instanceof ApiProblem) return problemResponse(context, error);
  logRequestFailure(context, error);
  return problemResponse(context, new ApiProblem("INTERNAL_ERROR", 500));
});

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      runScheduledMaintenance(env).catch((error: unknown) => {
        console.error(
          JSON.stringify({
            event: "scheduled-maintenance-failed",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
        throw error;
      }),
    );
  },
} satisfies ExportedHandler<Env>;
