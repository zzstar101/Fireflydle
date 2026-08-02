import { getBeijingDateKey } from "@fireflydle/game-engine";
import type { Context } from "hono";
import { routePath } from "hono/route";
import { sendOperationsAlertEmail } from "./operations-alert-email";
import type { AppContext, AuthUser } from "../types";

const VISIT_SESSION_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const FIVE_MINUTES_MS = 5 * 60 * 1_000;
const ALERT_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1_000;

type FlowMetric =
  | "register_success"
  | "register_failure"
  | "email_send_success"
  | "email_send_failure"
  | "verification_success"
  | "verification_failure"
  | "login_success"
  | "login_failure";

export interface DailyPlayer {
  id: string;
  isGuest: boolean;
}

export interface OperationsAlertInput {
  kind: string;
  severity: "warning" | "critical";
  title: string;
  message: string;
  active: boolean;
  notifyByEmail?: boolean;
}

function loggedError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function incrementDailyMetric(
  db: D1Database,
  dateKey: string,
  metric: FlowMetric | "visit_sessions" | "registered_dau" | "guest_dau" | "multiplayer_started",
  now: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO operations_daily_metrics (date_key, ${metric}, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(date_key) DO UPDATE SET
         ${metric} = ${metric} + 1,
         updated_at = excluded.updated_at`,
    )
    .bind(dateKey, now)
    .run();
}

export async function recordFlowMetric(
  env: Env,
  metric: FlowMetric,
  now = Date.now(),
): Promise<void> {
  await incrementDailyMetric(env.DB, getBeijingDateKey(now), metric, now);
}

async function recordVisitSession(
  env: Env,
  sessionId: string,
  user: AuthUser,
  now: number,
): Promise<void> {
  const dateKey = getBeijingDateKey(now);
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO operations_visit_sessions
       (id, user_id, is_guest, date_key, started_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, user.id, user.isGuest ? 1 : 0, dateKey, now)
    .run();
  if ((inserted.meta.changes ?? 0) > 0) {
    await incrementDailyMetric(env.DB, dateKey, "visit_sessions", now);
  }
}

export async function recordDailyPlayers(
  env: Env,
  players: readonly DailyPlayer[],
  options: { roomId?: string; now?: number } = {},
): Promise<void> {
  const now = options.now ?? Date.now();
  const dateKey = getBeijingDateKey(now);
  for (const player of players) {
    const inserted = await env.DB.prepare(
      `INSERT OR IGNORE INTO operations_daily_players
         (date_key, user_id, is_guest, first_started_at)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(dateKey, player.id, player.isGuest ? 1 : 0, now)
      .run();
    if ((inserted.meta.changes ?? 0) > 0) {
      await incrementDailyMetric(
        env.DB,
        dateKey,
        player.isGuest ? "guest_dau" : "registered_dau",
        now,
      );
    }
  }
  if (options.roomId) {
    const inserted = await env.DB.prepare(
      `INSERT OR IGNORE INTO operations_multiplayer_starts (room_id, date_key, started_at)
       VALUES (?, ?, ?)`,
    )
      .bind(options.roomId, dateKey, now)
      .run();
    if ((inserted.meta.changes ?? 0) > 0) {
      await incrementDailyMetric(env.DB, dateKey, "multiplayer_started", now);
    }
  }
}

export async function syncOperationsAlert(
  env: Env,
  input: OperationsAlertInput,
  now = Date.now(),
): Promise<void> {
  const active = await env.DB.prepare(
    `SELECT id, last_notified_at FROM operations_alerts
     WHERE kind = ? AND status = 'active'`,
  )
    .bind(input.kind)
    .first<{ id: string; last_notified_at: number | null }>();
  if (!input.active) {
    if (active) {
      await env.DB.prepare(
        `UPDATE operations_alerts SET status = 'recovered', recovered_at = ?, last_seen_at = ?
         WHERE id = ?`,
      )
        .bind(now, now, active.id)
        .run();
    }
    return;
  }

  let alertId = active?.id;
  if (active) {
    await env.DB.prepare(
      `UPDATE operations_alerts SET
         severity = ?, title = ?, message = ?, last_seen_at = ?, occurrences = occurrences + 1
       WHERE id = ?`,
    )
      .bind(input.severity, input.title, input.message, now, active.id)
      .run();
  } else {
    alertId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO operations_alerts
         (id, kind, severity, status, title, message, started_at, last_seen_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`,
    )
      .bind(alertId, input.kind, input.severity, input.title, input.message, now, now)
      .run();
  }

  const shouldNotify =
    (input.severity === "critical" || input.notifyByEmail === true) &&
    (!active?.last_notified_at || now - active.last_notified_at >= ALERT_EMAIL_COOLDOWN_MS);
  if (alertId && shouldNotify) {
    try {
      await sendOperationsAlertEmail(env, {
        title: input.title,
        message: input.message,
        occurredAt: now,
      });
      await env.DB.prepare("UPDATE operations_alerts SET last_notified_at = ? WHERE id = ?")
        .bind(now, alertId)
        .run();
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "operations-alert-email-failed",
          kind: input.kind,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}

function normalizeRoute(context: Context<AppContext>): string {
  const matched = routePath(context, -1);
  if (matched && matched !== "*") return matched.startsWith("/api") ? matched : `/api${matched}`;
  return new URL(context.req.url).pathname
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, ":id")
    .replace(/\/[A-Z2-9]{5}(?=\/|$)/gu, "/:code");
}

function shouldMeasure(context: Context<AppContext>, route: string): boolean {
  if (context.req.method === "OPTIONS") return false;
  if (context.req.header("upgrade")?.toLocaleLowerCase("en-US") === "websocket") return false;
  return route !== "/api/health" && route !== "/api/admin/operations";
}

function flowMetricFor(route: string, status: number): FlowMetric | null {
  const success = status < 400;
  if (route === "/api/auth/register") return success ? "register_success" : "register_failure";
  if (route === "/api/auth/login") return success ? "login_success" : "login_failure";
  if (route === "/api/auth/email-verification/confirm") {
    return success ? "verification_success" : "verification_failure";
  }
  return null;
}

async function recordErrorEvent(
  env: Env,
  input: {
    method: string;
    route: string;
    status: number;
    errorCode: string;
    requestId: string;
    now: number;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO operations_error_events
       (id, occurred_at, method, route, status_code, error_code, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      input.now,
      input.method,
      input.route,
      input.status,
      input.errorCode,
      input.requestId,
    )
    .run();
  if (input.status < 500) return;

  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM operations_error_events WHERE status_code >= 500 AND occurred_at >= ?",
  )
    .bind(input.now - FIVE_MINUTES_MS)
    .first<{ count: number }>();
  if ((recent?.count ?? 0) < 5) return;

  const title = "API 5xx 错误短时激增";
  const message = `最近 5 分钟至少出现 ${recent?.count ?? 0} 次服务端错误。`;
  await syncOperationsAlert(
    env,
    { kind: "api-5xx-spike", severity: "critical", title, message, active: true },
    input.now,
  );
}

async function dailyUserIndex(user: AuthUser | null, now: number): Promise<string> {
  if (!user) return "anonymous";
  const input = new TextEncoder().encode(`${getBeijingDateKey(now)}\0${user.id}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function writeRequestMetric(
  env: Env,
  input: {
    route: string;
    method: string;
    status: number;
    durationMs: number;
    user: AuthUser | null;
    now: number;
  },
): Promise<void> {
  env.OPS_METRICS.writeDataPoint({
    indexes: [await dailyUserIndex(input.user, input.now)],
    blobs: [
      input.route,
      input.method,
      String(input.status),
      input.user ? (input.user.isGuest ? "guest" : "registered") : "anonymous",
    ],
    doubles: [input.durationMs, 1],
  });
}

export function recordRequestOperations(context: Context<AppContext>, startedAt: number): void {
  const route = normalizeRoute(context);
  if (!shouldMeasure(context, route)) return;
  const now = Date.now();
  const auth = context.get("auth");
  const visitSessionId = context.req.header("x-visit-session-id") ?? "";
  const tasks: Promise<void>[] = [
    writeRequestMetric(context.env, {
      route,
      method: context.req.method,
      status: context.res.status,
      durationMs: Math.max(0, performance.now() - startedAt),
      user: auth?.user ?? null,
      now,
    }),
  ];
  if (auth && VISIT_SESSION_PATTERN.test(visitSessionId)) {
    tasks.push(recordVisitSession(context.env, visitSessionId, auth.user, now));
  }
  const flowMetric = flowMetricFor(route, context.res.status);
  if (flowMetric) tasks.push(recordFlowMetric(context.env, flowMetric, now));
  if (route === "/api/games" && context.req.method === "POST" && context.res.status < 400 && auth) {
    tasks.push(
      recordDailyPlayers(context.env, [{ id: auth.user.id, isGuest: auth.user.isGuest }], { now }),
    );
  }
  if (context.res.status >= 400) {
    tasks.push(
      recordErrorEvent(context.env, {
        method: context.req.method,
        route,
        status: context.res.status,
        errorCode: context.get("errorCode") ?? `HTTP_${context.res.status}`,
        requestId: context.get("requestId"),
        now,
      }),
    );
  }
  if (tasks.length > 0) {
    context.executionCtx.waitUntil(
      Promise.all(tasks)
        .then(() => undefined)
        .catch((error: unknown) => {
          console.error(
            JSON.stringify({ event: "operations-record-failed", error: loggedError(error) }),
          );
        }),
    );
  }
}
