import { AnnouncementReadRequestSchema } from "@fireflydle/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson } from "../lib/http";
import {
  hasUnsupportedMarkdownImage,
  serializeAnnouncement,
  type AnnouncementRow,
} from "../services/announcements";
import { requireAuth } from "../services/auth";
import type { AppContext } from "../types";

const ReleaseAnnouncementSchema = z.object({
  tagName: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(30_000),
});

function audienceCondition(isGuest: boolean): string {
  return isGuest ? "a.audience IN ('all', 'guest')" : "a.audience IN ('all', 'registered')";
}

function releaseToken(env: Env): string | null {
  if (!("RELEASE_ANNOUNCEMENT_TOKEN" in env)) return null;
  const value = env.RELEASE_ANNOUNCEMENT_TOKEN;
  return typeof value === "string" && value.length >= 32 ? value : null;
}

export const announcementRoutes = new Hono<AppContext>();

announcementRoutes.get("/announcements", async (context) => {
  const auth = requireAuth(context);
  const now = Date.now();
  const isAdministrator = auth.user.role === "admin" || auth.user.role === "owner";
  const rows = await context.env.DB.prepare(
    `SELECT a.*, ar.read_at
     FROM announcements a
     LEFT JOIN announcement_reads ar
       ON ar.announcement_id = a.id AND ar.user_id = ?
     WHERE a.published_at IS NOT NULL
       AND (a.starts_at IS NULL OR a.starts_at <= ?)
       AND (${isAdministrator ? "1 = 1" : audienceCondition(auth.user.isGuest)})
     ORDER BY a.published_at DESC, a.created_at DESC
     LIMIT 100`,
  )
    .bind(auth.user.id, now)
    .all<AnnouncementRow>();
  return ok(
    context,
    rows.results.map((row) =>
      serializeAnnouncement(isAdministrator ? { ...row, read_at: null } : row, now),
    ),
  );
});

announcementRoutes.post("/announcements/read", async (context) => {
  const auth = requireAuth(context);
  const parsed = AnnouncementReadRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  if (auth.user.role === "admin" || auth.user.role === "owner") {
    return ok(context, { read: 0 });
  }
  const now = Date.now();
  const placeholders = parsed.data.ids.map(() => "?").join(", ");
  const result = await context.env.DB.prepare(
    `INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id, read_at)
     SELECT a.id, ?, ?
     FROM announcements a
     WHERE a.id IN (${placeholders})
       AND a.published = 1
       AND a.archived_at IS NULL
       AND a.published_at IS NOT NULL
       AND (a.starts_at IS NULL OR a.starts_at <= ?)
       AND (a.ends_at IS NULL OR a.ends_at > ?)
       AND ${audienceCondition(auth.user.isGuest)}`,
  )
    .bind(auth.user.id, now, ...parsed.data.ids, now, now)
    .run();
  return ok(context, { read: result.meta.changes ?? 0 });
});

announcementRoutes.post("/announcements/releases", async (context) => {
  const configuredToken = releaseToken(context.env);
  const suppliedToken = context.req.header("authorization")?.replace(/^Bearer\s+/iu, "") ?? "";
  if (!configuredToken || suppliedToken !== configuredToken) throw new ApiProblem("FORBIDDEN", 403);
  const parsed = ReleaseAnnouncementSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const localizedBody = {
    "zh-CN": parsed.data.body,
    en: parsed.data.body,
    ja: parsed.data.body,
  };
  if (hasUnsupportedMarkdownImage(localizedBody)) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "announcement-images-disabled" });
  }
  const existing = await context.env.DB.prepare(
    "SELECT * FROM announcements WHERE source = 'release' AND source_ref = ?",
  )
    .bind(parsed.data.tagName)
    .first<AnnouncementRow>();
  if (existing) return ok(context, serializeAnnouncement(existing));
  const creator = await context.env.DB.prepare(
    `SELECT id FROM users
     WHERE role IN ('owner', 'admin') AND is_guest = 0 AND merged_into_user_id IS NULL
     ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
  ).first<{ id: string }>();
  if (!creator)
    throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "announcement-owner-missing" });
  const id = crypto.randomUUID();
  const now = Date.now();
  const localizedTitle = {
    "zh-CN": parsed.data.name,
    en: parsed.data.name,
    ja: parsed.data.name,
  };
  await context.env.DB.prepare(
    `INSERT INTO announcements
       (id, title, body, published, starts_at, ends_at, created_by_user_id,
        created_at, updated_at, category, audience, published_at, archived_at, source, source_ref)
     VALUES (?, ?, ?, 1, ?, NULL, ?, ?, ?, 'update', 'all', ?, NULL, 'release', ?)`,
  )
    .bind(
      id,
      JSON.stringify(localizedTitle),
      JSON.stringify(localizedBody),
      now,
      creator.id,
      now,
      now,
      now,
      parsed.data.tagName,
    )
    .run();
  const created = await context.env.DB.prepare("SELECT * FROM announcements WHERE id = ?")
    .bind(id)
    .first<AnnouncementRow>();
  if (!created) throw new ApiProblem("INTERNAL_ERROR", 500);
  return ok(context, serializeAnnouncement(created), 201);
});
