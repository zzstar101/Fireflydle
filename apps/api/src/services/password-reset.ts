import { hashPassword, randomToken, sha256 } from "../lib/crypto";
import { ApiProblem } from "../lib/http";

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

function resendApiKey(env: Env): string | null {
  if (!("RESEND_API_KEY" in env)) return null;
  const value = env.RESEND_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function createPasswordReset(
  env: Env,
  email: string,
  now = Date.now(),
): Promise<PasswordResetDelivery | null> {
  const user = await env.DB.prepare(
    `SELECT id, email FROM users
     WHERE email_normalized = ? AND is_guest = 0 AND merged_into_user_id IS NULL
       AND email IS NOT NULL
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
  const apiKey = resendApiKey(env);
  if (!apiKey) {
    console.warn(
      JSON.stringify({ event: "password-reset-email-skipped", reason: "missing-secret" }),
    );
    return;
  }
  const baseUrl = env.PUBLIC_WEB_URL.replace(/\/$/u, "");
  const resetUrl = `${baseUrl}/recover?token=${encodeURIComponent(delivery.token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [delivery.email],
      subject: "Fireflydle 密码重置",
      text: `请在 30 分钟内打开以下链接重置密码：\n\n${resetUrl}\n\n如果不是你发起的请求，可以忽略此邮件。`,
      html: `<p>请在 30 分钟内重置 Fireflydle 密码。</p><p><a href="${resetUrl}">重置密码</a></p><p>如果不是你发起的请求，可以忽略此邮件。</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend 返回 ${response.status}`);
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
