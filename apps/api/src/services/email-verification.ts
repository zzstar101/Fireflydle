import { randomToken, sha256 } from "../lib/crypto";
import { ApiProblem } from "../lib/http";
import { sendAccountEmail } from "./account-email";
import { EMAIL_VERIFICATION_TTL_MS } from "./account-token-policy";

interface VerificationUserRow {
  id: string;
  email: string;
  email_normalized: string;
}

interface VerificationTokenRow {
  user_id: string;
  email_normalized: string;
}

export interface EmailVerificationDelivery {
  email: string;
  token: string;
}

export async function createEmailVerification(
  env: Env,
  userId: string,
  now = Date.now(),
): Promise<EmailVerificationDelivery | null> {
  const user = await env.DB.prepare(
    `SELECT id, email, email_normalized FROM users
     WHERE id = ? AND is_guest = 0 AND merged_into_user_id IS NULL
       AND email IS NOT NULL AND email_normalized IS NOT NULL AND email_verified = 0
     LIMIT 1`,
  )
    .bind(userId)
    .first<VerificationUserRow>();
  if (!user) return null;

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE email_verification_tokens SET used_at = ?
       WHERE user_id = ? AND used_at IS NULL`,
    ).bind(now, user.id),
    env.DB.prepare(
      `INSERT INTO email_verification_tokens
         (id, user_id, email_normalized, token_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      user.id,
      user.email_normalized,
      tokenHash,
      now,
      now + EMAIL_VERIFICATION_TTL_MS,
    ),
  ]);
  return { email: user.email, token };
}

export async function sendEmailVerificationEmail(
  env: Env,
  delivery: EmailVerificationDelivery,
): Promise<void> {
  await sendAccountEmail(env, { kind: "email-verification", ...delivery });
}

export async function confirmEmailVerification(
  env: Env,
  token: string,
  now = Date.now(),
): Promise<void> {
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT t.user_id, t.email_normalized
     FROM email_verification_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > ?
       AND u.is_guest = 0 AND u.merged_into_user_id IS NULL
       AND u.email_verified = 0 AND u.email_normalized = t.email_normalized
     LIMIT 1`,
  )
    .bind(tokenHash, now)
    .first<VerificationTokenRow>();
  if (!row) throw new ApiProblem("AUTH_INVALID_CREDENTIALS", 400);

  const [verified] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE users SET email_verified = 1, updated_at = ?
       WHERE id = ? AND email_normalized = ? AND email_verified = 0`,
    ).bind(now, row.user_id, row.email_normalized),
    env.DB.prepare(
      `UPDATE email_verification_tokens SET used_at = ?
       WHERE user_id = ? AND used_at IS NULL`,
    ).bind(now, row.user_id),
  ]);
  if (!verified || (verified.meta.changes ?? 0) !== 1) {
    throw new ApiProblem("AUTH_INVALID_CREDENTIALS", 400);
  }
}
