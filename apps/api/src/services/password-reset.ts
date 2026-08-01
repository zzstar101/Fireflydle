import { hashPassword, randomToken, sha256 } from "../lib/crypto";
import { ApiProblem } from "../lib/http";
import { sendAccountEmail } from "./account-email";

const RESET_TTL_MS = 30 * 60 * 1_000;

interface ResetUserRow {
  id: string;
  email: string;
}

export interface PasswordResetDelivery {
  email: string;
  token: string;
}

function normalizeEmail(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

export async function createPasswordReset(
  env: Env,
  email: string,
  now = Date.now(),
): Promise<PasswordResetDelivery | null> {
  const user = await env.DB.prepare(
    `SELECT id, email FROM users
     WHERE email_normalized = ? AND is_guest = 0 AND merged_into_user_id IS NULL
       AND email IS NOT NULL AND email_verified = 1
     LIMIT 1`,
  )
    .bind(normalizeEmail(email))
    .first<ResetUserRow>();
  if (!user) return null;

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
    ).bind(now, user.id),
    env.DB.prepare(
      `INSERT INTO password_reset_tokens
         (id, user_id, token_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), user.id, tokenHash, now, now + RESET_TTL_MS),
  ]);
  return { email: user.email, token };
}

export async function sendPasswordResetEmail(
  env: Env,
  delivery: PasswordResetDelivery,
): Promise<void> {
  await sendAccountEmail(env, { kind: "password-reset", ...delivery });
}

export async function confirmPasswordReset(
  env: Env,
  token: string,
  password: string,
  now = Date.now(),
): Promise<void> {
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT user_id FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
  )
    .bind(tokenHash, now)
    .first<{ user_id: string }>();
  if (!row) throw new ApiProblem("AUTH_INVALID_CREDENTIALS", 400);

  const consumed = await env.DB.prepare(
    `UPDATE password_reset_tokens SET used_at = ?
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
  )
    .bind(now, tokenHash, now)
    .run();
  if ((consumed.meta.changes ?? 0) !== 1) {
    throw new ApiProblem("AUTH_INVALID_CREDENTIALS", 400);
  }

  const digest = await hashPassword(password);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE users SET
         password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ?
       WHERE id = ? AND is_guest = 0`,
    ).bind(digest.hash, digest.salt, digest.iterations, now, row.user_id),
    env.DB.prepare(
      "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
    ).bind(now, row.user_id),
    env.DB.prepare(
      "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
    ).bind(now, row.user_id),
  ]);
}
