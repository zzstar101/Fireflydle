import {
  ConfirmEmailVerificationSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
} from "@fireflydle/contracts";
import { Hono, type Context } from "hono";
import { clearSessionCookie, sessionCookie } from "../lib/crypto";
import { ApiProblem, ok, readJson } from "../lib/http";
import {
  createGuest,
  loginUser,
  registerUser,
  requireAuth,
  revokeSession,
  toPublicUser,
} from "../services/auth";
import {
  confirmEmailVerification,
  createEmailVerification,
  sendEmailVerificationEmail,
} from "../services/email-verification";
import {
  confirmPasswordReset,
  createPasswordReset,
  sendPasswordResetEmail,
} from "../services/password-reset";
import { clientAddress, enforceRateLimit } from "../services/rate-limit";
import type { AppContext } from "../types";

export const authRoutes = new Hono<AppContext>();

function sessionPayload(auth: ReturnType<typeof requireAuth>) {
  return {
    expiresAt: new Date(auth.expiresAt).toISOString(),
    user: toPublicUser(auth.user),
  };
}

function normalizedLimitKey(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

function scheduleEmailVerification(context: Context<AppContext>, userId: string): void {
  context.executionCtx.waitUntil(
    createEmailVerification(context.env, userId)
      .then(async (delivery) => {
        if (delivery) await sendEmailVerificationEmail(context.env, delivery);
      })
      .catch((error: unknown) => {
        console.error(
          JSON.stringify({
            event: "email-verification-send-failed",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),
  );
}

authRoutes.get("/session", (context) => {
  const auth = requireAuth(context);
  return ok(context, sessionPayload(auth));
});

authRoutes.post("/session", async (context) => {
  const existing = context.get("auth");
  if (!existing) {
    await enforceRateLimit(context.env.DB, "session:create:ip", clientAddress(context.req.raw), {
      limit: 20,
      windowMs: 60 * 60 * 1_000,
    });
  }
  const auth =
    existing ?? (await createGuest(context.env, context.req.header("user-agent") ?? null));
  context.header("Set-Cookie", sessionCookie(auth.token, auth.expiresAt, context.req.url));
  return ok(context, sessionPayload(auth), existing ? 200 : 201);
});

authRoutes.delete("/session", async (context) => {
  const auth = requireAuth(context);
  await revokeSession(context.env, auth);
  context.header("Set-Cookie", clearSessionCookie(context.req.url));
  return ok(context, { revoked: true });
});

authRoutes.get("/auth/me", (context) => {
  const auth = requireAuth(context);
  return ok(context, toPublicUser(auth.user));
});

authRoutes.post("/auth/register", async (context) => {
  const parsed = RegisterRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { issues: parsed.error.issues });
  }
  await Promise.all([
    enforceRateLimit(context.env.DB, "auth:register:ip", clientAddress(context.req.raw), {
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    }),
    enforceRateLimit(
      context.env.DB,
      "auth:register:identity",
      normalizedLimitKey(parsed.data.loginName),
      { limit: 3, windowMs: 60 * 60 * 1_000 },
    ),
  ]);
  const auth = await registerUser(
    context.env,
    parsed.data,
    context.get("auth"),
    context.req.header("user-agent") ?? null,
  );
  if (parsed.data.email) scheduleEmailVerification(context, auth.user.id);
  context.header("Set-Cookie", sessionCookie(auth.token, auth.expiresAt, context.req.url));
  return ok(context, sessionPayload(auth), 201);
});

authRoutes.post("/auth/login", async (context) => {
  const parsed = LoginRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  await Promise.all([
    enforceRateLimit(context.env.DB, "auth:login:ip", clientAddress(context.req.raw), {
      limit: 30,
      windowMs: 15 * 60 * 1_000,
    }),
    enforceRateLimit(
      context.env.DB,
      "auth:login:identity",
      normalizedLimitKey(parsed.data.loginName),
      { limit: 10, windowMs: 15 * 60 * 1_000 },
    ),
  ]);
  const auth = await loginUser(
    context.env,
    parsed.data.loginName,
    parsed.data.password,
    context.get("auth"),
    context.req.header("user-agent") ?? null,
  );
  context.header("Set-Cookie", sessionCookie(auth.token, auth.expiresAt, context.req.url));
  return ok(context, sessionPayload(auth));
});

authRoutes.post("/auth/logout", async (context) => {
  const auth = requireAuth(context);
  await revokeSession(context.env, auth);
  context.header("Set-Cookie", clearSessionCookie(context.req.url));
  return ok(context, { revoked: true });
});

authRoutes.post("/auth/email-verification/request", async (context) => {
  const auth = requireAuth(context, false);
  await Promise.all([
    enforceRateLimit(
      context.env.DB,
      "auth:email-verification-request:ip",
      clientAddress(context.req.raw),
      { limit: 10, windowMs: 60 * 60 * 1_000 },
    ),
    enforceRateLimit(context.env.DB, "auth:email-verification-request:user", auth.user.id, {
      limit: 3,
      windowMs: 60 * 60 * 1_000,
    }),
  ]);
  scheduleEmailVerification(context, auth.user.id);
  return ok(context, { accepted: true });
});

authRoutes.post("/auth/email-verification/confirm", async (context) => {
  const parsed = ConfirmEmailVerificationSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  await Promise.all([
    enforceRateLimit(
      context.env.DB,
      "auth:email-verification-confirm:ip",
      clientAddress(context.req.raw),
      { limit: 10, windowMs: 15 * 60 * 1_000 },
    ),
    enforceRateLimit(context.env.DB, "auth:email-verification-confirm:token", parsed.data.token, {
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    }),
  ]);
  await confirmEmailVerification(context.env, parsed.data.token);
  return ok(context, { verified: true });
});

authRoutes.post("/auth/password-reset/request", async (context) => {
  const parsed = RequestPasswordResetSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  await Promise.all([
    enforceRateLimit(context.env.DB, "auth:reset-request:ip", clientAddress(context.req.raw), {
      limit: 10,
      windowMs: 60 * 60 * 1_000,
    }),
    enforceRateLimit(
      context.env.DB,
      "auth:reset-request:email",
      normalizedLimitKey(parsed.data.email),
      { limit: 3, windowMs: 60 * 60 * 1_000 },
    ),
  ]);
  const delivery = await createPasswordReset(context.env, parsed.data.email);
  if (delivery) {
    context.executionCtx.waitUntil(
      sendPasswordResetEmail(context.env, delivery).catch((error: unknown) => {
        console.error(
          JSON.stringify({
            event: "password-reset-email-failed",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),
    );
  }
  // 无论邮箱是否存在都返回相同结果，防止账号枚举。
  return ok(context, { accepted: true });
});

authRoutes.post("/auth/password-reset/confirm", async (context) => {
  const parsed = ResetPasswordSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  await Promise.all([
    enforceRateLimit(context.env.DB, "auth:reset-confirm:ip", clientAddress(context.req.raw), {
      limit: 10,
      windowMs: 15 * 60 * 1_000,
    }),
    enforceRateLimit(context.env.DB, "auth:reset-confirm:token", parsed.data.token, {
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    }),
  ]);
  await confirmPasswordReset(context.env, parsed.data.token, parsed.data.password);
  context.header("Set-Cookie", clearSessionCookie(context.req.url));
  return ok(context, { reset: true });
});
