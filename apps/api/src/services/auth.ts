import type { PublicUser } from "@fireflydle/contracts";
import type { Context } from "hono";
import { ApiProblem } from "../lib/http";
import { hashPassword, randomToken, sessionExpiry, sha256, verifyPassword } from "../lib/crypto";
import type { AppContext, AuthContext, AuthUser } from "../types";

interface SessionUserRow {
  session_id: string;
  expires_at: number;
  last_seen_at: number;
  user_id: string;
  display_name: string;
  role: AuthUser["role"];
  is_guest: number;
  has_email: number;
  email_verified: number;
  elo: number;
  ranked_matches: number;
  leaderboard_eligible: number;
  created_at: number;
}

interface LoginUserRow extends SessionUserRow {
  password_hash: string | null;
  password_salt: string | null;
  password_iterations: number | null;
}

interface GuestUserRow {
  id: string;
  display_name: string;
  created_at: number;
}

async function mergeGuestProgress(
  db: D1Database,
  guestUserId: string,
  targetUserId: string,
  now: number,
): Promise<SessionUserRow | null> {
  const replayExpiry = now + 30 * 24 * 60 * 60 * 1_000;
  const claimToken = crypto.randomUUID();
  const claimExists =
    "EXISTS (SELECT 1 FROM guest_progress_merges claim WHERE claim.claim_token = ?)";
  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO guest_progress_merges
           (guest_user_id, target_user_id, claim_token, merged_at)
         SELECT ?, ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM users guest
           WHERE guest.id = ? AND guest.is_guest = 1
             AND guest.merged_into_user_id IS NULL
         )
           AND EXISTS (
             SELECT 1 FROM users target
             WHERE target.id = ? AND target.is_guest = 0
               AND target.merged_into_user_id IS NULL
           )`,
      )
      .bind(guestUserId, targetUserId, claimToken, now, guestUserId, targetUserId),
    db
      .prepare(
        `INSERT OR IGNORE INTO game_results
           (game_id, user_id, mode, mode_id, difficulty, date_key, result, guess_count,
            elapsed_ms, completed_at, replay_expires_at,
            leaderboard_hidden_at, leaderboard_hidden_reason)
         SELECT
           source.id, source.user_id, source.mode, source.mode_id, source.difficulty, source.date_key,
           'expired',
           (SELECT COUNT(*) FROM game_guesses gg WHERE gg.game_id = source.id),
           MAX(0, ? - source.started_at), ?, ?,
           CASE WHEN source.mode = 'daily' THEN ? ELSE NULL END,
           CASE WHEN source.mode = 'daily' THEN 'guest-merge-daily-conflict' ELSE NULL END
         FROM games source
         WHERE source.user_id = ? AND source.status = 'active'
           AND (
             (source.mode = 'daily' AND EXISTS (
               SELECT 1 FROM games target
               WHERE target.user_id = ? AND target.mode = 'daily'
                 AND target.date_key = source.date_key
             ))
             OR
             (source.mode = 'random' AND EXISTS (
               SELECT 1 FROM games target
               WHERE target.user_id = ? AND target.mode = 'random'
                 AND target.status = 'active'
             ))
           )
           AND ${claimExists}`,
      )
      .bind(now, now, replayExpiry, now, guestUserId, targetUserId, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE games SET status = 'expired', completed_at = ?, updated_at = ?
         WHERE user_id = ? AND status = 'active'
           AND (
             (mode = 'daily' AND EXISTS (
               SELECT 1 FROM games target
               WHERE target.user_id = ? AND target.mode = 'daily'
                 AND target.date_key = games.date_key
             ))
             OR
             (mode = 'random' AND EXISTS (
               SELECT 1 FROM games target
               WHERE target.user_id = ? AND target.mode = 'random'
                 AND target.status = 'active'
             ))
           )
           AND ${claimExists}`,
      )
      .bind(now, now, guestUserId, targetUserId, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE game_results SET
           leaderboard_hidden_at = COALESCE(leaderboard_hidden_at, ?),
           leaderboard_hidden_reason = COALESCE(
             leaderboard_hidden_reason,
             'guest-merge-daily-conflict'
           )
         WHERE user_id = ? AND mode = 'daily' AND date_key IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM games target
             WHERE target.user_id = ? AND target.mode = 'daily'
               AND target.date_key = game_results.date_key
           )
           AND ${claimExists}`,
      )
      .bind(now, guestUserId, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE games SET user_id = ?
         WHERE user_id = ?
           AND NOT (
             mode = 'daily' AND EXISTS (
               SELECT 1 FROM games target
               WHERE target.user_id = ? AND target.mode = 'daily'
                 AND target.date_key = games.date_key
             )
           )
           AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE game_results SET user_id = ?
         WHERE user_id = ?
           AND EXISTS (
             SELECT 1 FROM games transferred
             WHERE transferred.id = game_results.game_id
               AND transferred.user_id = ?
           )
           AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE replay_shares SET created_by_user_id = ?
         WHERE created_by_user_id = ?
           AND EXISTS (
             SELECT 1 FROM games transferred
             WHERE transferred.id = replay_shares.game_id
               AND transferred.user_id = ?
           )
           AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE room_directory SET owner_user_id = ?
         WHERE owner_user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE matches SET winner_user_id = ?
         WHERE winner_user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE match_rounds SET winner_user_id = ?
         WHERE winner_user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE OR IGNORE match_players SET user_id = ?
         WHERE user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE OR IGNORE match_guesses SET user_id = ?
         WHERE user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE OR IGNORE rating_events SET user_id = ?
         WHERE user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id, read_at)
         SELECT announcement_id, ?, read_at
         FROM announcement_reads
         WHERE user_id = ? AND ${claimExists}`,
      )
      .bind(targetUserId, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE users SET
           elo = CASE
             WHEN ranked_matches + COALESCE(
               (SELECT ranked_matches FROM users WHERE id = ?), 0
             ) = 0 THEN elo
             ELSE CAST(ROUND(
               (
                 elo * ranked_matches +
                 COALESCE((SELECT elo * ranked_matches FROM users WHERE id = ?), 0)
               ) * 1.0 /
               (
                 ranked_matches +
                 COALESCE((SELECT ranked_matches FROM users WHERE id = ?), 0)
               )
             ) AS INTEGER)
           END,
           ranked_matches = ranked_matches + COALESCE(
             (SELECT ranked_matches FROM users WHERE id = ?), 0
           ),
           updated_at = ?
         WHERE id = ? AND ${claimExists}`,
      )
      .bind(guestUserId, guestUserId, guestUserId, guestUserId, now, targetUserId, claimToken),
    db
      .prepare(
        `UPDATE sessions SET revoked_at = ?
         WHERE user_id = ? AND revoked_at IS NULL AND ${claimExists}`,
      )
      .bind(now, guestUserId, claimToken),
    db
      .prepare(
        `UPDATE users SET merged_into_user_id = ?, leaderboard_eligible = 0, updated_at = ?
         WHERE id = ? AND is_guest = 1 AND merged_into_user_id IS NULL
           AND ${claimExists}`,
      )
      .bind(targetUserId, now, guestUserId, claimToken),
  ]);

  return db
    .prepare(
      `SELECT
         '' AS session_id, 0 AS expires_at, 0 AS last_seen_at,
         id AS user_id, display_name, role, is_guest,
         CASE WHEN email IS NULL THEN 0 ELSE 1 END AS has_email,
         email_verified, elo,
         ranked_matches, leaderboard_eligible, created_at
       FROM users WHERE id = ? AND merged_into_user_id IS NULL`,
    )
    .bind(targetUserId)
    .first<SessionUserRow>();
}

function normalizeIdentity(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

function parseCookieToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === "fireflydle_session") return valueParts.join("=") || null;
  }
  return null;
}

function requestToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
  }
  return parseCookieToken(request.headers.get("cookie") ?? undefined);
}

function mapAuthUser(row: SessionUserRow): AuthUser {
  return {
    id: row.user_id,
    displayName: row.display_name,
    role: row.role,
    isGuest: row.is_guest === 1,
    hasEmail: row.has_email === 1,
    emailVerified: row.email_verified === 1,
    elo: row.elo,
    rankedMatches: row.ranked_matches,
    leaderboardEligible: row.leaderboard_eligible === 1,
    createdAt: row.created_at,
  };
}

export function toPublicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    isGuest: user.isGuest,
    hasEmail: user.hasEmail,
    emailVerified: user.emailVerified,
    elo: user.elo,
    rankedMatches: user.rankedMatches,
    leaderboardEligible: user.leaderboardEligible,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

async function insertSession(
  db: D1Database,
  userId: string,
  userAgent: string | null,
  now: number,
): Promise<{ id: string; token: string; tokenHash: string; expiresAt: number }> {
  const id = crypto.randomUUID();
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = sessionExpiry(now);
  await db
    .prepare(
      "INSERT INTO sessions (id, token_hash, user_id, created_at, last_seen_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, tokenHash, userId, now, now, expiresAt, userAgent)
    .run();
  return { id, token, tokenHash, expiresAt };
}

export async function resolveAuth(env: Env, request: Request): Promise<AuthContext | null> {
  const token = requestToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT
       s.id AS session_id, s.expires_at, s.last_seen_at,
       u.id AS user_id, u.display_name, u.role, u.is_guest,
       CASE WHEN u.email IS NULL THEN 0 ELSE 1 END AS has_email, u.email_verified,
       u.elo, u.ranked_matches, u.leaderboard_eligible, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
       AND u.merged_into_user_id IS NULL
       AND (u.banned_until IS NULL OR u.banned_until <= ?)`,
  )
    .bind(tokenHash, now, now)
    .first<SessionUserRow>();
  if (!row) return null;

  if (now - row.last_seen_at > 60 * 60 * 1_000) {
    await env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?")
      .bind(now, row.session_id)
      .run();
  }
  return {
    sessionId: row.session_id,
    token,
    expiresAt: row.expires_at,
    user: mapAuthUser(row),
  };
}

export function requireAuth(context: Context<AppContext>, allowGuest = true): AuthContext {
  const auth = context.get("auth");
  if (!auth || (!allowGuest && auth.user.isGuest)) {
    throw new ApiProblem("AUTH_REQUIRED", 401);
  }
  return auth;
}

export function requireRole(
  context: Context<AppContext>,
  roles: readonly AuthUser["role"][],
): AuthContext {
  const auth = requireAuth(context, false);
  if (!roles.includes(auth.user.role)) throw new ApiProblem("FORBIDDEN", 403);
  return auth;
}

export async function createGuest(
  env: Env,
  userAgent: string | null,
  stableGuestId?: string,
  now = Date.now(),
): Promise<AuthContext> {
  let guest: GuestUserRow | null = null;
  for (let attempt = 0; attempt < 3 && !guest; attempt += 1) {
    const userId = attempt === 0 && stableGuestId ? stableGuestId : crypto.randomUUID();
    const suffix = randomToken(5)
      .replace(/[^a-zA-Z0-9]/gu, "")
      .slice(0, 6)
      .toUpperCase();
    const displayName = `开拓者-${suffix}`;
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users
         (id, display_name, display_name_normalized, role, is_guest, email_verified,
          elo, ranked_matches, leaderboard_eligible, created_at, updated_at)
       VALUES (?, ?, ?, 'player', 1, 0, 1000, 0, 0, ?, ?)`,
    )
      .bind(userId, displayName, normalizeIdentity(displayName), now, now)
      .run();
    guest = await env.DB.prepare(
      `SELECT id, display_name, created_at FROM users
       WHERE id = ? AND is_guest = 1 AND merged_into_user_id IS NULL`,
    )
      .bind(userId)
      .first<GuestUserRow>();
  }
  if (!guest) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "guest-identity" });

  const userId = guest.id;
  const session = await insertSession(env.DB, userId, userAgent, now);
  return {
    sessionId: session.id,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: userId,
      displayName: guest.display_name,
      role: "player",
      isGuest: true,
      hasEmail: false,
      emailVerified: false,
      elo: 1000,
      rankedMatches: 0,
      leaderboardEligible: false,
      createdAt: guest.created_at,
    },
  };
}

interface RegisterInput {
  loginName: string;
  displayName: string;
  password: string;
  email?: string | undefined;
}

export async function registerUser(
  env: Env,
  input: RegisterInput,
  current: AuthContext | null,
  userAgent: string | null,
  now = Date.now(),
): Promise<AuthContext> {
  const loginNormalized = normalizeIdentity(input.loginName);
  const displayNormalized = normalizeIdentity(input.displayName);
  const emailNormalized = input.email ? normalizeIdentity(input.email) : null;
  const duplicate = await env.DB.prepare(
    `SELECT login_name_normalized, display_name_normalized, email_normalized
     FROM users
     WHERE login_name_normalized = ? OR display_name_normalized = ?
       OR (? IS NOT NULL AND email_normalized = ?)
     LIMIT 1`,
  )
    .bind(loginNormalized, displayNormalized, emailNormalized, emailNormalized)
    .first<{
      login_name_normalized: string | null;
      display_name_normalized: string;
      email_normalized: string | null;
    }>();
  if (duplicate?.login_name_normalized === loginNormalized) {
    throw new ApiProblem("AUTH_NAME_TAKEN", 409);
  }
  if (duplicate?.display_name_normalized === displayNormalized) {
    throw new ApiProblem("AUTH_DISPLAY_NAME_TAKEN", 409);
  }
  if (emailNormalized && duplicate?.email_normalized === emailNormalized) {
    throw new ApiProblem("AUTH_EMAIL_TAKEN", 409);
  }
  if (current && !current.user.isGuest) throw new ApiProblem("FORBIDDEN", 403);

  const digest = await hashPassword(input.password);
  const userId = current?.user.id ?? crypto.randomUUID();
  if (current?.user.isGuest) {
    await env.DB.prepare(
      `UPDATE users SET
         login_name = ?, login_name_normalized = ?, display_name = ?, display_name_normalized = ?,
         password_hash = ?, password_salt = ?, password_iterations = ?,
         email = ?, email_normalized = ?, email_verified = 0, is_guest = 0,
         leaderboard_eligible = 1,
         updated_at = ?
       WHERE id = ? AND is_guest = 1`,
    )
      .bind(
        input.loginName,
        loginNormalized,
        input.displayName,
        displayNormalized,
        digest.hash,
        digest.salt,
        digest.iterations,
        input.email ?? null,
        emailNormalized,
        now,
        userId,
      )
      .run();
    return {
      ...current,
      user: {
        ...current.user,
        displayName: input.displayName,
        isGuest: false,
        hasEmail: input.email !== undefined,
        emailVerified: false,
        leaderboardEligible: true,
      },
    };
  }

  await env.DB.prepare(
    `INSERT INTO users
       (id, login_name, login_name_normalized, display_name, display_name_normalized,
        password_hash, password_salt, password_iterations, email, email_normalized,
        role, is_guest, email_verified, elo, ranked_matches, leaderboard_eligible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'player', 0, 0, 1000, 0, 1, ?, ?)`,
  )
    .bind(
      userId,
      input.loginName,
      loginNormalized,
      input.displayName,
      displayNormalized,
      digest.hash,
      digest.salt,
      digest.iterations,
      input.email ?? null,
      emailNormalized,
      now,
      now,
    )
    .run();
  const session = await insertSession(env.DB, userId, userAgent, now);
  return {
    sessionId: session.id,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: userId,
      displayName: input.displayName,
      role: "player",
      isGuest: false,
      hasEmail: input.email !== undefined,
      emailVerified: false,
      elo: 1000,
      rankedMatches: 0,
      leaderboardEligible: true,
      createdAt: now,
    },
  };
}

export async function loginUser(
  env: Env,
  loginName: string,
  password: string,
  current: AuthContext | null,
  userAgent: string | null,
  now = Date.now(),
): Promise<AuthContext> {
  const row = await env.DB.prepare(
    `SELECT
       '' AS session_id, 0 AS expires_at, 0 AS last_seen_at,
       id AS user_id, display_name, role, is_guest,
       CASE WHEN email IS NULL THEN 0 ELSE 1 END AS has_email,
       email_verified, elo,
       ranked_matches, leaderboard_eligible, created_at,
       password_hash, password_salt, password_iterations
     FROM users
     WHERE login_name_normalized = ? AND is_guest = 0 AND merged_into_user_id IS NULL
       AND (banned_until IS NULL OR banned_until <= ?)`,
  )
    .bind(normalizeIdentity(loginName), now)
    .first<LoginUserRow>();
  if (
    !row?.password_hash ||
    !row.password_salt ||
    !row.password_iterations ||
    !(await verifyPassword(password, row.password_hash, row.password_salt, row.password_iterations))
  ) {
    throw new ApiProblem("AUTH_INVALID_CREDENTIALS", 401);
  }

  const mergedRow =
    current?.user.isGuest && current.user.id !== row.user_id
      ? await mergeGuestProgress(env.DB, current.user.id, row.user_id, now)
      : null;
  const session = await insertSession(env.DB, row.user_id, userAgent, now);
  return {
    sessionId: session.id,
    token: session.token,
    expiresAt: session.expiresAt,
    user: mapAuthUser(mergedRow ?? row),
  };
}

export async function revokeSession(env: Env, auth: AuthContext, now = Date.now()): Promise<void> {
  await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE id = ?")
    .bind(now, auth.sessionId)
    .run();
}
