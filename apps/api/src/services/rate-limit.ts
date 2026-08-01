import { sha256 } from "../lib/crypto";
import { ApiProblem } from "../lib/http";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  blockMs?: number;
}

interface RateLimitRow {
  request_count: number;
  blocked_until: number;
}

export function clientAddress(request: Request): string {
  const connectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (connectingIp) return connectingIp;
  return `local:${new URL(request.url).hostname.toLocaleLowerCase("en-US")}`;
}

export async function enforceRateLimit(
  db: D1Database,
  scope: string,
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): Promise<void> {
  const keyHash = await sha256(key.normalize("NFKC"));
  const blockMs = options.blockMs ?? options.windowMs;
  const result = await db
    .prepare(
      `INSERT INTO rate_limits
         (scope, key_hash, window_started_at, request_count, blocked_until, updated_at)
       VALUES (?, ?, ?, 1, 0, ?)
       ON CONFLICT(scope, key_hash) DO UPDATE SET
         request_count = CASE
           WHEN rate_limits.blocked_until > excluded.updated_at
             THEN rate_limits.request_count
           WHEN rate_limits.window_started_at + ? <= excluded.updated_at THEN 1
           ELSE rate_limits.request_count + 1
         END,
         window_started_at = CASE
           WHEN rate_limits.blocked_until > excluded.updated_at
             THEN rate_limits.window_started_at
           WHEN rate_limits.window_started_at + ? <= excluded.updated_at
             THEN excluded.updated_at
           ELSE rate_limits.window_started_at
         END,
         blocked_until = CASE
           WHEN rate_limits.blocked_until > excluded.updated_at
             THEN rate_limits.blocked_until
           WHEN rate_limits.window_started_at + ? <= excluded.updated_at THEN 0
           WHEN rate_limits.request_count + 1 > ? THEN excluded.updated_at + ?
           ELSE 0
         END,
         updated_at = excluded.updated_at
       RETURNING request_count, blocked_until`,
    )
    .bind(
      scope,
      keyHash,
      now,
      now,
      options.windowMs,
      options.windowMs,
      options.windowMs,
      options.limit,
      blockMs,
    )
    .first<RateLimitRow>();
  if (!result) throw new ApiProblem("INTERNAL_ERROR", 500, { reason: "rate-limit-write" });
  if (result.blocked_until <= now) return;

  const retryAfter = Math.max(1, Math.ceil((result.blocked_until - now) / 1_000));
  throw new ApiProblem("RATE_LIMITED", 429, {
    retryAfter,
    retryAt: new Date(result.blocked_until).toISOString(),
  });
}
