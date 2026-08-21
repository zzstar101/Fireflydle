import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson } from "../lib/http";
import { requireAuth, requireRole } from "../services/auth";
import { sendFeedbackEmail } from "../services/feedback-email";
import type { AppContext } from "../types";

const FEEDBACK_ROLES = ["moderator", "admin", "owner"] as const;
const FeedbackStatusSchema = z.enum(["open", "reviewing", "accepted", "resolved", "closed"]);
const FeedbackAdminQuerySchema = z.object({
  status: FeedbackStatusSchema.optional(),
});
const FeedbackReviewSchema = z.object({
  status: FeedbackStatusSchema,
  resolvedReleaseTag: z.string().trim().max(50).nullable().optional(),
});

const FeedbackRequestSchema = z.object({
  category: z.enum(["bug", "suggestion", "data"]),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(20_000),
  reproduction: z.string().trim().max(10_000).optional().default(""),
  sourceUrl: z.string().url().max(2_000).optional().or(z.literal("")),
  contactEmail: z.string().email().max(320).optional().or(z.literal("")),
  attachments: z
    .array(
      z.object({
        name: z.string().max(160),
        mime: z.string().max(100),
        dataUrl: z.string().max(700_000),
      }),
    )
    .max(5)
    .default([]),
});

interface FeedbackRow {
  id: string;
  category: "bug" | "suggestion" | "data";
  title: string;
  description: string;
  reproduction: string | null;
  source_url: string | null;
  contact_email: string | null;
  attachments_json: string;
  status: "open" | "reviewing" | "accepted" | "resolved" | "closed";
  resolved_release_tag: string | null;
  created_at: number;
  updated_at: number;
  user_id: string;
  submitter_name?: string;
}

function serialize(row: FeedbackRow) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    reproduction: row.reproduction ?? "",
    sourceUrl: row.source_url ?? "",
    contactEmail: row.contact_email ?? "",
    status: row.status,
    resolvedReleaseTag: row.resolved_release_tag,
    attachments: JSON.parse(row.attachments_json) as Array<{
      name: string;
      mime: string;
      dataUrl: string;
    }>,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    ...(row.submitter_name ? { submitterName: row.submitter_name } : {}),
  };
}

export const feedbackRoutes = new Hono<AppContext>();

feedbackRoutes.get("/feedback", async (context) => {
  const auth = requireAuth(context);
  const rows = await context.env.DB.prepare(
    `SELECT * FROM feedback_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
  )
    .bind(auth.user.id)
    .all<FeedbackRow>();
  return ok(context, rows.results.map(serialize));
});

feedbackRoutes.post("/feedback", async (context) => {
  const auth = requireAuth(context);
  if (auth.user.isGuest) throw new ApiProblem("AUTH_REQUIRED", 401);
  const parsed = FeedbackRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const now = Date.now();
  const id = `FB-${now.toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const attachments = parsed.data.attachments.map(({ name, mime, dataUrl }) => ({
    name,
    mime,
    dataUrl,
  }));
  await context.env.DB.prepare(
    `INSERT INTO feedback_items
       (id, user_id, category, title, description, reproduction, source_url,
        contact_email, attachments_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
  )
    .bind(
      id,
      auth.user.id,
      parsed.data.category,
      parsed.data.title,
      parsed.data.description,
      parsed.data.reproduction,
      parsed.data.sourceUrl ?? "",
      parsed.data.contactEmail ?? "",
      JSON.stringify(attachments),
      now,
      now,
    )
    .run();
  context.executionCtx.waitUntil(
    sendFeedbackEmail(context.env, {
      id,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      reproduction: parsed.data.reproduction,
      sourceUrl: parsed.data.sourceUrl ?? "",
      contactEmail: parsed.data.contactEmail ?? "",
      submitterName: auth.user.displayName,
      attachmentCount: attachments.length,
      submittedAt: now,
    }).catch((error: unknown) => console.error("feedback-email-failed", error)),
  );
  return ok(context, { id, status: "open" }, 201);
});

feedbackRoutes.get("/admin/feedback", async (context) => {
  requireRole(context, FEEDBACK_ROLES);
  const parsed = FeedbackAdminQuerySchema.safeParse(context.req.query());
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const rows = parsed.data.status
    ? await context.env.DB.prepare(
        `SELECT f.*, u.display_name AS submitter_name
         FROM feedback_items f JOIN users u ON u.id = f.user_id
         WHERE f.status = ? ORDER BY f.updated_at DESC LIMIT 100`,
      )
        .bind(parsed.data.status)
        .all<FeedbackRow>()
    : await context.env.DB.prepare(
        `SELECT f.*, u.display_name AS submitter_name
         FROM feedback_items f JOIN users u ON u.id = f.user_id
         ORDER BY CASE f.status
           WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 WHEN 'accepted' THEN 2 ELSE 3 END,
           f.updated_at DESC LIMIT 100`,
      ).all<FeedbackRow>();
  return ok(context, rows.results.map(serialize));
});

feedbackRoutes.patch("/admin/feedback/:feedbackId", async (context) => {
  const auth = requireRole(context, FEEDBACK_ROLES);
  const parsed = FeedbackReviewSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const feedbackId = context.req.param("feedbackId");
  const current = await context.env.DB.prepare("SELECT * FROM feedback_items WHERE id = ?")
    .bind(feedbackId)
    .first<FeedbackRow>();
  if (!current) throw new ApiProblem("NOT_FOUND", 404);
  const resolvedReleaseTag =
    parsed.data.status === "resolved"
      ? (parsed.data.resolvedReleaseTag ?? current.resolved_release_tag)
      : null;
  if (parsed.data.status === "resolved" && !resolvedReleaseTag) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "missing-release-tag" });
  }
  const now = Date.now();
  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE feedback_items SET status = ?, resolved_release_tag = ?, updated_at = ? WHERE id = ?`,
    ).bind(parsed.data.status, resolvedReleaseTag, now, feedbackId),
    context.env.DB.prepare(
      `INSERT INTO audit_logs
         (id, actor_user_id, action, target_type, target_id, request_id, metadata_json, created_at)
       VALUES (?, ?, 'feedback.review', 'feedback', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      auth.user.id,
      feedbackId,
      context.get("requestId"),
      JSON.stringify({
        before: { status: current.status, resolvedReleaseTag: current.resolved_release_tag },
        after: { status: parsed.data.status, resolvedReleaseTag },
      }),
      now,
    ),
  ]);
  const updated = await context.env.DB.prepare(
    `SELECT f.*, u.display_name AS submitter_name
     FROM feedback_items f JOIN users u ON u.id = f.user_id WHERE f.id = ?`,
  )
    .bind(feedbackId)
    .first<FeedbackRow>();
  if (!updated) throw new ApiProblem("INTERNAL_ERROR", 500);
  return ok(context, serialize(updated));
});
