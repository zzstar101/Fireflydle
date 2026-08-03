import {
  LocalizedTextSchema,
  type Announcement,
  type AnnouncementStatus,
  type LocalizedText,
} from "@fireflydle/contracts";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  published: number;
  category: Announcement["category"];
  audience: Announcement["audience"];
  starts_at: number | null;
  ends_at: number | null;
  published_at: number | null;
  archived_at: number | null;
  source: Announcement["source"];
  source_ref: string | null;
  read_at?: number | null;
  created_at: number;
  updated_at: number;
}

export function localizedText(value: string): LocalizedText {
  try {
    return LocalizedTextSchema.parse(JSON.parse(value));
  } catch {
    return { "zh-CN": value, en: value, ja: value };
  }
}

export function fillLocalizedText(value: {
  "zh-CN": string;
  en?: string;
  ja?: string;
}): LocalizedText {
  const chinese = value["zh-CN"].trim();
  return {
    "zh-CN": chinese,
    en: value.en?.trim() || chinese,
    ja: value.ja?.trim() || chinese,
  };
}

export function announcementStatus(row: AnnouncementRow, now = Date.now()): AnnouncementStatus {
  if (row.archived_at !== null) return "archived";
  if (row.published_at === null) return "draft";
  if (row.starts_at !== null && row.starts_at > now) return "scheduled";
  if (row.ends_at !== null && row.ends_at <= now) return "ended";
  return row.published === 1 ? "active" : "archived";
}

export function serializeAnnouncement(row: AnnouncementRow, now = Date.now()): Announcement {
  return {
    id: row.id,
    title: localizedText(row.title),
    body: localizedText(row.body),
    category: row.category,
    audience: row.audience,
    status: announcementStatus(row, now),
    source: row.source,
    sourceRef: row.source_ref,
    publishedAt: row.published_at === null ? null : new Date(row.published_at).toISOString(),
    startsAt: row.starts_at === null ? null : new Date(row.starts_at).toISOString(),
    endsAt: row.ends_at === null ? null : new Date(row.ends_at).toISOString(),
    archivedAt: row.archived_at === null ? null : new Date(row.archived_at).toISOString(),
    readAt:
      row.read_at === undefined || row.read_at === null
        ? null
        : new Date(row.read_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function hasUnsupportedMarkdownImage(value: LocalizedText): boolean {
  return Object.values(value).some(
    (body) => /!\[[^\]]*\]\s*\([^)]*\)/u.test(body) || /<\s*img\b/iu.test(body),
  );
}
