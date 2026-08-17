import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson } from "../lib/http";
import { requireAuth, toPublicUser } from "../services/auth";
import type { AppContext } from "../types";

const DISPLAY_NAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1_000;
const DELETION_GRACE_MS = 7 * 24 * 60 * 60 * 1_000;
const ProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(24),
});

interface DeletionRow {
  requested_at: number;
  execute_after: number;
  cancelled_at: number | null;
  completed_at: number | null;
}

function normalizeIdentity(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

async function writeAudit(
  context: Parameters<typeof requireAuth>[0],
  action: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const auth = requireAuth(context, false);
  await context.env.DB.prepare(
    `INSERT INTO audit_logs
       (id, actor_user_id, action, target_type, target_id, request_id, metadata_json, created_at)
     VALUES (?, ?, ?, 'user', ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      auth.user.id,
      action,
      auth.user.id,
      context.get("requestId"),
      JSON.stringify(metadata),
      Date.now(),
    )
    .run();
}

export const accountRoutes = new Hono<AppContext>();

accountRoutes.patch("/account/playable-tutorial", async (context) => {
  const auth = requireAuth(context, false);
  const now = Date.now();
  await context.env.DB.prepare(
    `UPDATE users
     SET playable_tutorial_completed_at = COALESCE(playable_tutorial_completed_at, ?),
         updated_at = ?
     WHERE id = ? AND is_guest = 0`,
  )
    .bind(now, now, auth.user.id)
    .run();
  return ok(context, toPublicUser({ ...auth.user, playableTutorialCompleted: true }));
});

accountRoutes.patch("/account/profile", async (context) => {
  const auth = requireAuth(context, false);
  const parsed = ProfileSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const now = Date.now();
  const current = await context.env.DB.prepare(
    "SELECT display_name_changed_at FROM users WHERE id = ? AND is_guest = 0",
  )
    .bind(auth.user.id)
    .first<{ display_name_changed_at: number | null }>();
  if (!current) throw new ApiProblem("AUTH_REQUIRED", 401);
  if (
    current.display_name_changed_at !== null &&
    current.display_name_changed_at + DISPLAY_NAME_COOLDOWN_MS > now
  ) {
    throw new ApiProblem("RATE_LIMITED", 429, {
      retryAt: new Date(current.display_name_changed_at + DISPLAY_NAME_COOLDOWN_MS).toISOString(),
    });
  }

  const normalized = normalizeIdentity(parsed.data.displayName);
  const duplicate = await context.env.DB.prepare(
    "SELECT id FROM users WHERE display_name_normalized = ? AND id <> ? LIMIT 1",
  )
    .bind(normalized, auth.user.id)
    .first<{ id: string }>();
  if (duplicate) throw new ApiProblem("AUTH_DISPLAY_NAME_TAKEN", 409);
  try {
    await context.env.DB.prepare(
      `UPDATE users SET
         display_name = ?, display_name_normalized = ?, display_name_changed_at = ?, updated_at = ?
       WHERE id = ? AND is_guest = 0`,
    )
      .bind(parsed.data.displayName, normalized, now, now, auth.user.id)
      .run();
  } catch (error) {
    if (error instanceof Error && error.message.toLocaleLowerCase("en-US").includes("unique")) {
      throw new ApiProblem("AUTH_DISPLAY_NAME_TAKEN", 409);
    }
    throw error;
  }
  await writeAudit(context, "account.profile.update");
  return ok(context, toPublicUser({ ...auth.user, displayName: parsed.data.displayName }));
});

accountRoutes.get("/account/deletion", async (context) => {
  const auth = requireAuth(context, false);
  const row = await context.env.DB.prepare(
    `SELECT requested_at, execute_after, cancelled_at, completed_at
     FROM account_deletion_requests WHERE user_id = ?`,
  )
    .bind(auth.user.id)
    .first<DeletionRow>();
  return ok(
    context,
    row
      ? {
          scheduledFor:
            row.completed_at || row.cancelled_at ? null : new Date(row.execute_after).toISOString(),
          cancellable: row.completed_at === null && row.cancelled_at === null,
          status: row.completed_at ? "completed" : row.cancelled_at ? "cancelled" : "pending",
          requestedAt: new Date(row.requested_at).toISOString(),
          executeAfter: new Date(row.execute_after).toISOString(),
        }
      : {
          scheduledFor: null,
          cancellable: false,
          status: "none",
          requestedAt: null,
          executeAfter: null,
        },
  );
});

accountRoutes.post("/account/deletion", async (context) => {
  const auth = requireAuth(context, false);
  const now = Date.now();
  const executeAfter = now + DELETION_GRACE_MS;
  await context.env.DB.prepare(
    `INSERT INTO account_deletion_requests
       (user_id, requested_at, execute_after, cancelled_at, completed_at)
     VALUES (?, ?, ?, NULL, NULL)
     ON CONFLICT(user_id) DO UPDATE SET
       requested_at = excluded.requested_at,
       execute_after = excluded.execute_after,
       cancelled_at = NULL,
       completed_at = NULL`,
  )
    .bind(auth.user.id, now, executeAfter)
    .run();
  await writeAudit(context, "account.deletion.request", { executeAfter });
  return ok(context, {
    scheduledFor: new Date(executeAfter).toISOString(),
    cancellable: true,
    status: "pending",
    requestedAt: new Date(now).toISOString(),
    executeAfter: new Date(executeAfter).toISOString(),
  });
});

accountRoutes.delete("/account/deletion", async (context) => {
  const auth = requireAuth(context, false);
  const now = Date.now();
  const result = await context.env.DB.prepare(
    `UPDATE account_deletion_requests SET cancelled_at = ?
     WHERE user_id = ? AND cancelled_at IS NULL AND completed_at IS NULL`,
  )
    .bind(now, auth.user.id)
    .run();
  if ((result.meta.changes ?? 0) === 0) throw new ApiProblem("NOT_FOUND", 404);
  await writeAudit(context, "account.deletion.cancel");
  return ok(context, {
    scheduledFor: null,
    cancellable: false,
    status: "cancelled",
    requestedAt: null,
    executeAfter: null,
  });
});
