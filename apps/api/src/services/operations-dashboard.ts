import { getBeijingDateKey } from "@fireflydle/game-engine";
import { syncOperationsAlert } from "./operations";

const DAY_MS = 24 * 60 * 60 * 1_000;
const ANALYTICS_DATASET = "fireflydle_api_metrics";
const WORKER_NAME = "fireflydle-api";
const EXTERNAL_CACHE_MS = 5 * 60 * 1_000;
const CLOUDFLARE_PLAN = "paid" as const;
const CLOUDFLARE_CACHE_KEY = "cloudflare-usage-paid-v1";
const PAID_LIMITS = {
  workerRequests: 10_000_000,
  workerCpuMs: 30_000,
  d1RowsRead: 25_000_000_000,
  d1RowsWritten: 50_000_000,
  d1StorageBytes: 5 * 1024 * 1024 * 1024,
} as const;

type CloudflareMetricKind = "quota" | "limit";

export type OperationsLatencyRange = "1h" | "24h" | "7d";
export type OperationsTrendDays = 7 | 30;

interface AnalyticsRow {
  [key: string]: unknown;
}

interface DailyMetricRow {
  date_key: string;
  visit_sessions: number;
  registered_dau: number;
  guest_dau: number;
  register_success: number;
  register_failure: number;
  email_send_success: number;
  email_send_failure: number;
  verification_success: number;
  verification_failure: number;
  login_success: number;
  login_failure: number;
  multiplayer_started: number;
}

export interface OperationsOverview {
  generatedAt: string;
  timezone: "Asia/Shanghai";
  audience: {
    registeredTotal: number;
    registeredToday: number;
    guestActiveToday: number;
    guestTotal: number;
    visitsToday: number;
    registeredDau: number;
    guestDau: number;
    dau: number;
  };
  live: {
    onlineFiveMinutes: number | null;
    onlineRegistered: number | null;
    onlineGuests: number | null;
    activeSoloGames: number;
    activeMatches: number;
    matchmakingWaiting: number;
    matchmakingReserved: number;
  };
  gameplay: {
    startedToday: number;
    completedToday: number;
    interruptedToday: number;
    completionRate: number;
  };
  accountFlows: {
    registerSuccess: number;
    registerFailure: number;
    emailSendSuccess: number;
    emailSendFailure: number;
    verificationSuccess: number;
    verificationFailure: number;
    loginSuccess: number;
    loginFailure: number;
  };
  api: {
    configured: boolean;
    available: boolean;
    range: OperationsLatencyRange;
    requests: number;
    successRate: number;
    clientErrorRate: number;
    serverErrorRate: number;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    endpoints: Array<{
      route: string;
      method: string;
      requests: number;
      p50Ms: number;
      p95Ms: number;
      p99Ms: number;
      serverErrors: number;
    }>;
    error: string | null;
  };
  trends: Array<{
    date: string;
    visits: number;
    dau: number;
    registeredDau: number;
    guestDau: number;
    registrations: number;
    gamesStarted: number;
    gamesCompleted: number;
    completionRate: number;
  }>;
  cloudflare: {
    plan: "paid";
    billingPeriod: "monthly";
    configured: boolean;
    available: boolean;
    fetchedAt: string | null;
    resetAt: string;
    quotas: Array<{
      id: string;
      label: string;
      used: number;
      limit: number;
      percent: number;
      unit: "requests" | "ms" | "rows" | "bytes";
      kind: CloudflareMetricKind;
    }>;
    error: string | null;
  };
  alerts: Array<{
    id: string;
    kind: string;
    severity: "warning" | "critical";
    status: "active" | "recovered";
    title: string;
    message: string;
    startedAt: string;
    lastSeenAt: string;
    recoveredAt: string | null;
    occurrences: number;
  }>;
  recentErrors: Array<{
    id: string;
    occurredAt: string;
    method: string;
    route: string;
    statusCode: number;
    errorCode: string;
    requestId: string;
  }>;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function rowsOf(value: unknown): AnalyticsRow[] {
  return Array.isArray(value)
    ? value.map(recordOf).filter((row): row is AnalyticsRow => row !== null)
    : [];
}

function finiteNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = finiteNumber(value);
  return Number.isFinite(number) ? number : null;
}

function analyticsToken(env: Env): string | null {
  if (!("CLOUDFLARE_ANALYTICS_TOKEN" in env)) return null;
  const value = env.CLOUDFLARE_ANALYTICS_TOKEN;
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function analyticsEngineRows(env: Env, sql: string): Promise<AnalyticsRow[]> {
  const token = analyticsToken(env);
  if (!token) throw new Error("CLOUDFLARE_ANALYTICS_TOKEN 未配置");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "text/plain" },
      body: sql,
    },
  );
  if (!response.ok) throw new Error(`Analytics Engine 返回 ${response.status}`);
  const payload = recordOf(await response.json());
  if (!payload) throw new Error("Analytics Engine 响应无效");
  return rowsOf(payload.data);
}

function intervalFor(range: OperationsLatencyRange): string {
  return range === "1h"
    ? "INTERVAL '1' HOUR"
    : range === "24h"
      ? "INTERVAL '24' HOUR"
      : "INTERVAL '7' DAY";
}

async function apiMetrics(
  env: Env,
  range: OperationsLatencyRange,
): Promise<OperationsOverview["api"]> {
  const configured = analyticsToken(env) !== null;
  if (!configured) {
    return {
      configured: false,
      available: false,
      range,
      requests: 0,
      successRate: 0,
      clientErrorRate: 0,
      serverErrorRate: 0,
      p50Ms: null,
      p95Ms: null,
      p99Ms: null,
      endpoints: [],
      error: "缺少只读 Analytics Token",
    };
  }
  const interval = intervalFor(range);
  try {
    const [overallRows, endpointRows] = await Promise.all([
      analyticsEngineRows(
        env,
        `SELECT
           SUM(_sample_interval) AS requests,
           SUM(if(blob3 LIKE '4%', _sample_interval, 0)) AS client_errors,
           SUM(if(blob3 LIKE '5%', _sample_interval, 0)) AS server_errors,
           quantileExactWeighted(0.5)(double1, _sample_interval) AS p50_ms,
           quantileExactWeighted(0.95)(double1, _sample_interval) AS p95_ms,
           quantileExactWeighted(0.99)(double1, _sample_interval) AS p99_ms
         FROM ${ANALYTICS_DATASET}
         WHERE timestamp >= NOW() - ${interval}`,
      ),
      analyticsEngineRows(
        env,
        `SELECT
           blob1 AS route, blob2 AS method,
           SUM(_sample_interval) AS requests,
           SUM(if(blob3 LIKE '5%', _sample_interval, 0)) AS server_errors,
           quantileExactWeighted(0.5)(double1, _sample_interval) AS p50_ms,
           quantileExactWeighted(0.95)(double1, _sample_interval) AS p95_ms,
           quantileExactWeighted(0.99)(double1, _sample_interval) AS p99_ms
         FROM ${ANALYTICS_DATASET}
         WHERE timestamp >= NOW() - ${interval}
         GROUP BY route, method
         ORDER BY requests DESC
         LIMIT 12`,
      ),
    ]);
    const overall = overallRows[0] ?? {};
    const requests = finiteNumber(overall.requests);
    const clientErrors = finiteNumber(overall.client_errors);
    const serverErrors = finiteNumber(overall.server_errors);
    return {
      configured: true,
      available: true,
      range,
      requests,
      successRate: requests === 0 ? 0 : (requests - clientErrors - serverErrors) / requests,
      clientErrorRate: requests === 0 ? 0 : clientErrors / requests,
      serverErrorRate: requests === 0 ? 0 : serverErrors / requests,
      p50Ms: nullableNumber(overall.p50_ms),
      p95Ms: nullableNumber(overall.p95_ms),
      p99Ms: nullableNumber(overall.p99_ms),
      endpoints: endpointRows.map((row) => ({
        route: typeof row.route === "string" ? row.route : "unknown",
        method: typeof row.method === "string" ? row.method : "-",
        requests: finiteNumber(row.requests),
        p50Ms: finiteNumber(row.p50_ms),
        p95Ms: finiteNumber(row.p95_ms),
        p99Ms: finiteNumber(row.p99_ms),
        serverErrors: finiteNumber(row.server_errors),
      })),
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      available: false,
      range,
      requests: 0,
      successRate: 0,
      clientErrorRate: 0,
      serverErrorRate: 0,
      p50Ms: null,
      p95Ms: null,
      p99Ms: null,
      endpoints: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function d1OnlineMetrics(
  env: Env,
  now: number,
): Promise<{
  total: number | null;
  registered: number | null;
  guests: number | null;
}> {
  try {
    const row = await env.DB.prepare(
      `SELECT
         COUNT(DISTINCT user_id) AS total,
         COUNT(DISTINCT CASE WHEN is_guest = 0 THEN user_id ELSE NULL END) AS registered,
         COUNT(DISTINCT CASE WHEN is_guest = 1 THEN user_id ELSE NULL END) AS guests
       FROM operations_visit_sessions
       WHERE COALESCE(last_seen_at, started_at) >= ?`,
    )
      .bind(now - 5 * 60 * 1_000)
      .first<{ total: number; registered: number; guests: number }>();
    return {
      total: finiteNumber(row?.total),
      registered: finiteNumber(row?.registered),
      guests: finiteNumber(row?.guests),
    };
  } catch {
    return { total: null, registered: null, guests: null };
  }
}

async function onlineMetrics(
  env: Env,
  now = Date.now(),
): Promise<{
  total: number | null;
  registered: number | null;
  guests: number | null;
}> {
  if (!analyticsToken(env)) return d1OnlineMetrics(env, now);
  try {
    const rows = await analyticsEngineRows(
      env,
      `SELECT
           COUNT(DISTINCT if(index1 != 'anonymous', index1, NULL)) AS total,
           COUNT(DISTINCT if(blob4 = 'registered', index1, NULL)) AS registered,
           COUNT(DISTINCT if(blob4 = 'guest', index1, NULL)) AS guests
       FROM ${ANALYTICS_DATASET}
       WHERE timestamp >= NOW() - INTERVAL '5' MINUTE`,
    );
    const row = rows[0] ?? {};
    return {
      total: finiteNumber(row.total),
      registered: finiteNumber(row.registered),
      guests: finiteNumber(row.guests),
    };
  } catch {
    return d1OnlineMetrics(env, now);
  }
}

export interface OnlinePresence {
  generatedAt: string;
  windowMinutes: 5;
  total: number | null;
  registered: number | null;
  guests: number | null;
}

export async function getOnlinePresence(env: Env, now = Date.now()): Promise<OnlinePresence> {
  const metrics = await onlineMetrics(env, now);
  return {
    generatedAt: new Date(now).toISOString(),
    windowMinutes: 5,
    total: metrics.total,
    registered: metrics.registered,
    guests: metrics.guests,
  };
}

function monthlyWindowStart(now: number): Date {
  // Cloudflare 账单续期日不在 Analytics 查询结果中暴露，面板用 UTC 月度窗口做趋势和预警。
  const start = new Date(now);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function monthlyWindowResetAt(now: number): string {
  const start = monthlyWindowStart(now);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)).toISOString();
}

function quota(
  id: string,
  label: string,
  used: number,
  limit: number,
  unit: "requests" | "ms" | "rows" | "bytes",
  kind: CloudflareMetricKind = "quota",
): OperationsOverview["cloudflare"]["quotas"][number] {
  return { id, label, used, limit, percent: limit === 0 ? 0 : used / limit, unit, kind };
}

async function databaseSize(env: Env): Promise<number> {
  try {
    const row = await env.DB.prepare(
      "SELECT page_count * page_size AS bytes FROM pragma_page_count(), pragma_page_size()",
    ).first<{ bytes: number }>();
    return row?.bytes ?? 0;
  } catch {
    return 0;
  }
}

async function cloudflareUsageFresh(
  env: Env,
  now: number,
): Promise<OperationsOverview["cloudflare"]> {
  const token = analyticsToken(env);
  if (!token) {
    return {
      plan: CLOUDFLARE_PLAN,
      billingPeriod: "monthly",
      configured: false,
      available: false,
      fetchedAt: null,
      resetAt: monthlyWindowResetAt(now),
      quotas: [],
      error: "缺少只读 Analytics Token",
    };
  }
  const start = monthlyWindowStart(now);
  const query = `query OperationsUsage(
    $accountTag: string,
    $datetimeStart: string,
    $datetimeEnd: string,
    $dateStart: Date,
    $dateEnd: Date,
    $scriptName: string,
    $databaseId: string
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        workersInvocationsAdaptive(
          limit: 10000,
          filter: {
            scriptName: $scriptName,
            datetime_geq: $datetimeStart,
            datetime_leq: $datetimeEnd
          }
        ) {
          sum { requests errors }
          quantiles { cpuTimeP50 cpuTimeP99 }
        }
        d1AnalyticsAdaptiveGroups(
          limit: 10000,
          filter: {
            date_geq: $dateStart,
            date_leq: $dateEnd,
            databaseId: $databaseId
          }
        ) {
          sum { rowsRead rowsWritten }
        }
      }
    }
  }`;
  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          accountTag: env.CLOUDFLARE_ACCOUNT_ID,
          datetimeStart: start.toISOString(),
          datetimeEnd: new Date(now).toISOString(),
          dateStart: start.toISOString().slice(0, 10),
          dateEnd: start.toISOString().slice(0, 10),
          scriptName: WORKER_NAME,
          databaseId: env.CLOUDFLARE_D1_DATABASE_ID,
        },
      }),
    });
    if (!response.ok) throw new Error(`Cloudflare GraphQL 返回 ${response.status}`);
    const payload = recordOf(await response.json());
    const data = recordOf(payload?.data);
    const viewer = recordOf(data?.viewer);
    const accounts = rowsOf(viewer?.accounts);
    const account = accounts[0];
    if (!account) throw new Error("Cloudflare GraphQL 未返回账号数据");
    const workers = rowsOf(account.workersInvocationsAdaptive);
    const d1 = rowsOf(account.d1AnalyticsAdaptiveGroups);
    const workerRequests = workers.reduce(
      (total, row) => total + finiteNumber(recordOf(row.sum)?.requests),
      0,
    );
    const cpuP99Microseconds = workers.reduce(
      (maximum, row) => Math.max(maximum, finiteNumber(recordOf(row.quantiles)?.cpuTimeP99)),
      0,
    );
    const cpuP99 = cpuP99Microseconds / 1_000;
    const rowsRead = d1.reduce(
      (total, row) => total + finiteNumber(recordOf(row.sum)?.rowsRead),
      0,
    );
    const rowsWritten = d1.reduce(
      (total, row) => total + finiteNumber(recordOf(row.sum)?.rowsWritten),
      0,
    );
    const size = await databaseSize(env);
    return {
      plan: CLOUDFLARE_PLAN,
      billingPeriod: "monthly",
      configured: true,
      available: true,
      fetchedAt: new Date(now).toISOString(),
      resetAt: monthlyWindowResetAt(now),
      quotas: [
        quota(
          "worker-requests",
          "Workers 请求",
          workerRequests,
          PAID_LIMITS.workerRequests,
          "requests",
        ),
        quota(
          "worker-cpu",
          "Worker CPU p99 / 默认单次上限",
          cpuP99,
          PAID_LIMITS.workerCpuMs,
          "ms",
          "limit",
        ),
        quota("d1-reads", "D1 读取行", rowsRead, PAID_LIMITS.d1RowsRead, "rows"),
        quota("d1-writes", "D1 写入行", rowsWritten, PAID_LIMITS.d1RowsWritten, "rows"),
        quota("d1-storage", "D1 存储", size, PAID_LIMITS.d1StorageBytes, "bytes"),
      ],
      error: null,
    };
  } catch (error) {
    return {
      plan: CLOUDFLARE_PLAN,
      billingPeriod: "monthly",
      configured: true,
      available: false,
      fetchedAt: null,
      resetAt: monthlyWindowResetAt(now),
      quotas: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validCloudflareCache(value: unknown): OperationsOverview["cloudflare"] | null {
  const record = recordOf(value);
  if (!record || !Array.isArray(record.quotas) || typeof record.configured !== "boolean") {
    return null;
  }
  const quotas = rowsOf(record.quotas)
    .map((item) => {
      const unit = item.unit;
      if (
        typeof item.id !== "string" ||
        typeof item.label !== "string" ||
        (unit !== "requests" && unit !== "ms" && unit !== "rows" && unit !== "bytes")
      ) {
        return null;
      }
      const kind =
        item.kind === "limit" || (item.kind === undefined && item.id === "worker-cpu")
          ? "limit"
          : "quota";
      return quota(
        item.id,
        item.label,
        finiteNumber(item.used),
        finiteNumber(item.limit),
        unit,
        kind,
      );
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return {
    plan: CLOUDFLARE_PLAN,
    billingPeriod: "monthly",
    configured: record.configured,
    available: record.available === true,
    fetchedAt: typeof record.fetchedAt === "string" ? record.fetchedAt : null,
    resetAt: typeof record.resetAt === "string" ? record.resetAt : new Date(0).toISOString(),
    quotas,
    error: typeof record.error === "string" ? record.error : null,
  };
}

async function cloudflareUsage(env: Env, now: number): Promise<OperationsOverview["cloudflare"]> {
  const cached = await env.DB.prepare(
    `SELECT payload_json FROM operations_external_cache
     WHERE cache_key = '${CLOUDFLARE_CACHE_KEY}' AND expires_at > ?`,
  )
    .bind(now)
    .first<{ payload_json: string }>();
  if (cached) {
    try {
      const parsed = validCloudflareCache(JSON.parse(cached.payload_json) as unknown);
      if (parsed) return parsed;
    } catch {
      // 缓存损坏时直接重新请求，不影响管理概览。
    }
  }
  const fresh = await cloudflareUsageFresh(env, now);
  if (fresh.available) {
    await env.DB.prepare(
      `INSERT INTO operations_external_cache (cache_key, payload_json, expires_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         payload_json = excluded.payload_json,
         expires_at = excluded.expires_at,
         updated_at = excluded.updated_at`,
    )
      .bind(CLOUDFLARE_CACHE_KEY, JSON.stringify(fresh), now + EXTERNAL_CACHE_MS, now)
      .run();
  }
  return fresh;
}

function cloudflareAlertTasks(
  env: Env,
  cloudflare: OperationsOverview["cloudflare"],
  now: number,
): Promise<void>[] {
  const quotaAlerts = cloudflare.quotas
    .filter((item) => item.kind === "quota")
    .map((item) =>
      syncOperationsAlert(
        env,
        {
          kind: `quota-${item.id}`,
          severity: item.percent >= 0.95 ? "critical" : "warning",
          title: `${item.label}接近套餐额度`,
          message: `当前已使用 Workers Paid 月度包含额度的 ${(item.percent * 100).toFixed(1)}%，超出后会产生额外费用。`,
          active: item.percent >= 0.8,
          notifyByEmail: item.percent >= 0.8,
        },
        now,
      ),
    );
  const cpu = cloudflare.quotas.find((item) => item.id === "worker-cpu");
  if (cpu) {
    quotaAlerts.push(
      syncOperationsAlert(
        env,
        {
          // 沿用旧 kind，让已存在的 CPU 告警自动迁移为新的准确口径。
          kind: "quota-worker-cpu",
          severity: cpu.percent >= 2 ? "critical" : "warning",
          title: "Worker CPU p99 超过单次请求上限",
          message: `p99 为 ${cpu.used.toFixed(2)} ms / ${cpu.limit.toFixed(2)} ms（${cpu.percent.toFixed(2)}x）。`,
          active: cpu.percent >= 1,
          notifyByEmail: cpu.percent >= 1,
        },
        now,
      ),
    );
  }
  return quotaAlerts;
}

function dateKeys(days: number, now: number): string[] {
  const today = getBeijingDateKey(now);
  const anchor = Date.parse(`${today}T00:00:00.000Z`);
  return Array.from({ length: days }, (_, index) =>
    new Date(anchor - (days - index - 1) * DAY_MS).toISOString().slice(0, 10),
  );
}

function emptyDaily(dateKey: string): DailyMetricRow {
  return {
    date_key: dateKey,
    visit_sessions: 0,
    registered_dau: 0,
    guest_dau: 0,
    register_success: 0,
    register_failure: 0,
    email_send_success: 0,
    email_send_failure: 0,
    verification_success: 0,
    verification_failure: 0,
    login_success: 0,
    login_failure: 0,
    multiplayer_started: 0,
  };
}

export async function getOperationsOverview(
  env: Env,
  range: OperationsLatencyRange,
  trendDays: OperationsTrendDays,
  now = Date.now(),
): Promise<OperationsOverview> {
  const today = getBeijingDateKey(now);
  const todayStart = Date.parse(`${today}T00:00:00+08:00`);
  const tomorrowStart = todayStart + DAY_MS;
  const keys = dateKeys(trendDays, now);
  const trendStart = keys[0] ?? today;

  const [
    audienceRow,
    dailyRow,
    gameplayRow,
    dailyRows,
    soloStarts,
    soloCompletions,
    multiplayerCompletions,
    api,
    online,
    cloudflare,
    queue,
  ] = await Promise.all([
    env.DB.prepare(
      `SELECT
         SUM(CASE WHEN is_guest = 0 AND merged_into_user_id IS NULL THEN 1 ELSE 0 END) AS registered_total,
         SUM(CASE WHEN is_guest = 0 AND merged_into_user_id IS NULL AND created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS registered_today,
         SUM(CASE WHEN is_guest = 1 THEN 1 ELSE 0 END) AS guest_total
       FROM users`,
    )
      .bind(todayStart, tomorrowStart)
      .first<{ registered_total: number; registered_today: number; guest_total: number }>(),
    env.DB.prepare("SELECT * FROM operations_daily_metrics WHERE date_key = ?")
      .bind(today)
      .first<DailyMetricRow>(),
    env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM games WHERE status = 'active') AS active_solo,
         (SELECT COUNT(*) FROM room_directory WHERE state = 'active' AND expires_at > ?) AS active_matches,
         (SELECT COUNT(*) FROM games WHERE started_at >= ? AND started_at < ?) AS solo_started,
         (SELECT COUNT(*) FROM game_results WHERE completed_at >= ? AND completed_at < ?) AS solo_completed,
         (SELECT COUNT(*) FROM game_results WHERE completed_at >= ? AND completed_at < ? AND result IN ('conceded', 'expired')) AS solo_interrupted,
         (SELECT COUNT(*) FROM matches WHERE completed_at >= ? AND completed_at < ?) AS matches_completed,
         (SELECT COUNT(*) FROM matches WHERE completed_at >= ? AND completed_at < ? AND COALESCE(resolution, finish_reason) IN ('disconnect', 'left', 'cancelled')) AS matches_interrupted`,
    )
      .bind(
        now,
        todayStart,
        tomorrowStart,
        todayStart,
        tomorrowStart,
        todayStart,
        tomorrowStart,
        todayStart,
        tomorrowStart,
        todayStart,
        tomorrowStart,
      )
      .first<{
        active_solo: number;
        active_matches: number;
        solo_started: number;
        solo_completed: number;
        solo_interrupted: number;
        matches_completed: number;
        matches_interrupted: number;
      }>(),
    env.DB.prepare("SELECT * FROM operations_daily_metrics WHERE date_key >= ? ORDER BY date_key")
      .bind(trendStart)
      .all<DailyMetricRow>(),
    env.DB.prepare(
      `SELECT date(started_at / 1000, 'unixepoch', '+8 hours') AS date_key, COUNT(*) AS count
       FROM games WHERE started_at >= ? GROUP BY date_key`,
    )
      .bind(Date.parse(`${trendStart}T00:00:00+08:00`))
      .all<{ date_key: string; count: number }>(),
    env.DB.prepare(
      `SELECT date(completed_at / 1000, 'unixepoch', '+8 hours') AS date_key, COUNT(*) AS count
       FROM game_results WHERE completed_at >= ? GROUP BY date_key`,
    )
      .bind(Date.parse(`${trendStart}T00:00:00+08:00`))
      .all<{ date_key: string; count: number }>(),
    env.DB.prepare(
      `SELECT date(completed_at / 1000, 'unixepoch', '+8 hours') AS date_key, COUNT(*) AS count
       FROM matches WHERE completed_at >= ? GROUP BY date_key`,
    )
      .bind(Date.parse(`${trendStart}T00:00:00+08:00`))
      .all<{ date_key: string; count: number }>(),
    apiMetrics(env, range),
    onlineMetrics(env),
    cloudflareUsage(env, now),
    env.MATCHMAKER.getByName("ranked:bo3").getStats(now),
  ]);

  const daily = dailyRow ?? emptyDaily(today);
  const gameplay = gameplayRow ?? {
    active_solo: 0,
    active_matches: 0,
    solo_started: 0,
    solo_completed: 0,
    solo_interrupted: 0,
    matches_completed: 0,
    matches_interrupted: 0,
  };
  const dailyByDate = new Map(dailyRows.results.map((row) => [row.date_key, row]));
  const soloStartsByDate = new Map(soloStarts.results.map((row) => [row.date_key, row.count]));
  const soloCompletedByDate = new Map(
    soloCompletions.results.map((row) => [row.date_key, row.count]),
  );
  const multiplayerCompletedByDate = new Map(
    multiplayerCompletions.results.map((row) => [row.date_key, row.count]),
  );
  const trends = keys.map((date) => {
    const metric = dailyByDate.get(date) ?? emptyDaily(date);
    const gamesStarted = (soloStartsByDate.get(date) ?? 0) + metric.multiplayer_started;
    const gamesCompleted =
      (soloCompletedByDate.get(date) ?? 0) + (multiplayerCompletedByDate.get(date) ?? 0);
    return {
      date,
      visits: metric.visit_sessions,
      dau: metric.registered_dau + metric.guest_dau,
      registeredDau: metric.registered_dau,
      guestDau: metric.guest_dau,
      registrations: metric.register_success,
      gamesStarted,
      gamesCompleted,
      completionRate: gamesStarted === 0 ? 0 : Math.min(1, gamesCompleted / gamesStarted),
    };
  });

  const recentFiveHundreds = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM operations_error_events WHERE status_code >= 500 AND occurred_at >= ?",
  )
    .bind(now - 5 * 60 * 1_000)
    .first<{ count: number }>();
  await Promise.all([
    ...cloudflareAlertTasks(env, cloudflare, now),
    syncOperationsAlert(
      env,
      {
        kind: "api-5xx-spike",
        severity: "critical",
        title: "API 5xx 错误短时激增",
        message: `最近 5 分钟出现 ${recentFiveHundreds?.count ?? 0} 次服务端错误。`,
        active: (recentFiveHundreds?.count ?? 0) >= 5,
      },
      now,
    ),
  ]);

  const [alerts, recentErrors] = await Promise.all([
    env.DB.prepare(
      `SELECT * FROM operations_alerts
       WHERE status = 'active' OR last_seen_at >= ?
       ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, last_seen_at DESC
       LIMIT 100`,
    )
      .bind(now - 7 * DAY_MS)
      .all<{
        id: string;
        kind: string;
        severity: "warning" | "critical";
        status: "active" | "recovered";
        title: string;
        message: string;
        started_at: number;
        last_seen_at: number;
        recovered_at: number | null;
        occurrences: number;
      }>(),
    env.DB.prepare(
      `SELECT * FROM operations_error_events
       WHERE occurred_at >= ? ORDER BY occurred_at DESC LIMIT 100`,
    )
      .bind(now - 7 * DAY_MS)
      .all<{
        id: string;
        occurred_at: number;
        method: string;
        route: string;
        status_code: number;
        error_code: string;
        request_id: string;
      }>(),
  ]);

  const startedToday = gameplay.solo_started + daily.multiplayer_started;
  const completedToday = gameplay.solo_completed + gameplay.matches_completed;
  const interruptedToday = gameplay.solo_interrupted + gameplay.matches_interrupted;
  return {
    generatedAt: new Date(now).toISOString(),
    timezone: "Asia/Shanghai",
    audience: {
      registeredTotal: audienceRow?.registered_total ?? 0,
      registeredToday: audienceRow?.registered_today ?? 0,
      guestActiveToday: daily.guest_dau,
      guestTotal: audienceRow?.guest_total ?? 0,
      visitsToday: daily.visit_sessions,
      registeredDau: daily.registered_dau,
      guestDau: daily.guest_dau,
      dau: daily.registered_dau + daily.guest_dau,
    },
    live: {
      onlineFiveMinutes: online.total,
      onlineRegistered: online.registered,
      onlineGuests: online.guests,
      activeSoloGames: gameplay.active_solo,
      activeMatches: gameplay.active_matches,
      matchmakingWaiting: queue.waiting,
      matchmakingReserved: queue.reserved,
    },
    gameplay: {
      startedToday,
      completedToday,
      interruptedToday,
      completionRate: startedToday === 0 ? 0 : Math.min(1, completedToday / startedToday),
    },
    accountFlows: {
      registerSuccess: daily.register_success,
      registerFailure: daily.register_failure,
      emailSendSuccess: daily.email_send_success,
      emailSendFailure: daily.email_send_failure,
      verificationSuccess: daily.verification_success,
      verificationFailure: daily.verification_failure,
      loginSuccess: daily.login_success,
      loginFailure: daily.login_failure,
    },
    api,
    trends,
    cloudflare,
    alerts: alerts.results.map((row) => ({
      id: row.id,
      kind: row.kind,
      severity: row.severity,
      status: row.status,
      title: row.title,
      message: row.message,
      startedAt: new Date(row.started_at).toISOString(),
      lastSeenAt: new Date(row.last_seen_at).toISOString(),
      recoveredAt: row.recovered_at === null ? null : new Date(row.recovered_at).toISOString(),
      occurrences: row.occurrences,
    })),
    recentErrors: recentErrors.results.map((row) => ({
      id: row.id,
      occurredAt: new Date(row.occurred_at).toISOString(),
      method: row.method,
      route: row.route,
      statusCode: row.status_code,
      errorCode: row.error_code,
      requestId: row.request_id,
    })),
  };
}

export async function runScheduledOperations(env: Env, now = Date.now()): Promise<void> {
  const usage = await cloudflareUsageFresh(env, now);
  await Promise.all(cloudflareAlertTasks(env, usage, now));
}
