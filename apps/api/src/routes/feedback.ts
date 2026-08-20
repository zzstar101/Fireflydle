import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson } from "../lib/http";
import { requireAuth } from "../services/auth";
import { sendOperationsAlertEmail } from "../services/operations-alert-email";
import type { AppContext } from "../types";

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
}

function serialize(row: FeedbackRow) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    reproduction: row.reproduction ?? "",
    sourceUrl: row.source_url ?? "",
    status: row.status,
    resolvedReleaseTag: row.resolved_release_tag,
    attachments: JSON.parse(row.attachments_json) as Array<{
      name: string;
      mime: string;
      dataUrl: string;
    }>,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
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
    sendOperationsAlertEmail(context.env, {
      title: `站内反馈 ${id}: ${parsed.data.title}`,
      message: `${parsed.data.category}\n${parsed.data.description}\n用户: ${auth.user.displayName}`,
      occurredAt: now,
    }).catch((error: unknown) => console.error("feedback-email-failed", error)),
  );
  return ok(context, { id, status: "open" }, 201);
});
