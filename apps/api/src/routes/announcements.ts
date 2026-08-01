import { LocalizedTextSchema, type LocalizedText } from "@fireflydle/contracts";
import { Hono } from "hono";
import { ok } from "../lib/http";
import type { AppContext } from "../types";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
  updated_at: number;
}

function localizedText(value: string): LocalizedText {
  try {
    return LocalizedTextSchema.parse(JSON.parse(value));
  } catch {
    return { "zh-CN": value, en: value, ja: value };
  }
}

export const announcementRoutes = new Hono<AppContext>();

announcementRoutes.get("/announcements", async (context) => {
  const now = Date.now();
  const rows = await context.env.DB.prepare(
    `SELECT id, title, body, starts_at, ends_at, created_at, updated_at
     FROM announcements
     WHERE published = 1
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at IS NULL OR ends_at > ?)
     ORDER BY COALESCE(starts_at, created_at) DESC
     LIMIT 20`,
  )
    .bind(now, now)
    .all<AnnouncementRow>();
  return ok(
    context,
    rows.results.map((row) => ({
      id: row.id,
      title: localizedText(row.title),
      body: localizedText(row.body),
      published: true,
      startsAt: row.starts_at === null ? null : new Date(row.starts_at).toISOString(),
      endsAt: row.ends_at === null ? null : new Date(row.ends_at).toISOString(),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
  );
});
