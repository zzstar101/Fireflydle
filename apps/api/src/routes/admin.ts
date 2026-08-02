import {
  CharacterSchema,
  FactionSchema,
  LocalizedTextSchema,
  UserRoleSchema,
  VersionSchema,
  type Character,
  type Faction,
  type LocalizedText,
  type UserRole,
  type Version,
} from "@fireflydle/contracts";
import { Hono, type Context } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson } from "../lib/http";
import { requireRole } from "../services/auth";
import {
  getOperationsOverview,
  type OperationsLatencyRange,
  type OperationsTrendDays,
} from "../services/operations-dashboard";
import type { AppContext, AuthContext } from "../types";

const CHARACTER_ROLES = ["data-editor", "admin", "owner"] as const;
const CONTENT_ROLES = ["data-editor", "admin", "owner"] as const;
const MODERATION_ROLES = ["moderator", "admin", "owner"] as const;
const ADMIN_ROLES = ["admin", "owner"] as const;
const OperationsQuerySchema = z.object({
  range: z.enum(["1h", "24h", "7d"]).optional().default("24h"),
  trend: z.coerce
    .number()
    .pipe(z.union([z.literal(7), z.literal(30)]))
    .optional()
    .default(7),
});
const UserListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  role: UserRoleSchema.optional(),
  status: z.enum(["active", "banned"]).optional(),
  email: z.enum(["verified", "unverified"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(10).max(100).optional().default(25),
});
const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);
const CharacterStateSchema = z
  .object({ enabled: z.boolean().optional(), targetEligible: z.boolean().optional() })
  .refine((value) => value.enabled !== undefined || value.targetEligible !== undefined);
const DailyOverrideSchema = z.object({ characterId: z.string().min(1) });
const CharacterImportSchema = z.object({
  characters: z.array(CharacterSchema).min(1).max(100),
});
const FactionPutSchema = z.union([
  FactionSchema,
  z.array(FactionSchema).min(1).max(100),
  z.object({ factions: z.array(FactionSchema).min(1).max(100) }),
]);
const VersionAdminSchema = VersionSchema.extend({ enabled: z.boolean().optional().default(true) });
const VersionPutSchema = z.union([
  VersionAdminSchema,
  z.array(VersionAdminSchema).min(1).max(100),
  z.object({ versions: z.array(VersionAdminSchema).min(1).max(100) }),
]);
const AnnouncementSchema = z.object({
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  published: z.boolean().optional().default(false),
  startsAt: z.string().datetime().nullable().optional().default(null),
  endsAt: z.string().datetime().nullable().optional().default(null),
});
const AnnouncementPatchSchema = z
  .object({
    title: LocalizedTextSchema.optional(),
    body: LocalizedTextSchema.optional(),
    published: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
const UserPatchSchema = z
  .object({
    role: UserRoleSchema.optional(),
    leaderboardEligible: z.boolean().optional(),
    bannedUntil: z.string().datetime().nullable().optional(),
    banReason: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.leaderboardEligible !== undefined ||
      value.bannedUntil !== undefined ||
      value.banReason !== undefined,
  );

interface StoredCharacterRow {
  payload_json: string;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  published: number;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
  updated_at: number;
}

interface DailyScheduleRow {
  date_key: string;
  character_id: string;
  cycle: number;
  source: "auto" | "override";
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

async function audit(
  context: Context<AppContext>,
  auth: AuthContext,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await context.env.DB.prepare(
    `INSERT INTO audit_logs
       (id, actor_user_id, action, target_type, target_id, request_id, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      auth.user.id,
      action,
      targetType,
      targetId,
      context.get("requestId"),
      JSON.stringify(metadata),
      Date.now(),
    )
    .run();
}

async function storedCharacter(db: D1Database, characterId: string): Promise<Character> {
  const row = await db
    .prepare("SELECT payload_json FROM characters WHERE id = ?")
    .bind(characterId)
    .first<StoredCharacterRow>();
  if (!row) throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
  return CharacterSchema.parse(JSON.parse(row.payload_json));
}

async function saveCharacter(db: D1Database, character: Character, now: number): Promise<void> {
  await db
    .prepare(
      `INSERT INTO characters
         (id, official_id, base_character_id, element, path, rarity, faction_id,
          faction_group_id, release_version_id, release_order, enabled, target_eligible,
          source_revision, payload_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         official_id = excluded.official_id,
         base_character_id = excluded.base_character_id,
         element = excluded.element,
         path = excluded.path,
         rarity = excluded.rarity,
         faction_id = excluded.faction_id,
         faction_group_id = excluded.faction_group_id,
         release_version_id = excluded.release_version_id,
         release_order = excluded.release_order,
         enabled = excluded.enabled,
         target_eligible = excluded.target_eligible,
         source_revision = excluded.source_revision,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
    )
    .bind(
      character.id,
      character.officialId,
      character.baseCharacterId,
      character.element,
      character.path,
      character.rarity,
      character.factionId,
      character.factionGroupId,
      character.releaseVersionId,
      character.releaseOrder,
      character.enabled ? 1 : 0,
      character.targetEligible ? 1 : 0,
      character.sourceRevision,
      JSON.stringify(character),
      now,
      now,
    )
    .run();
}

async function saveFaction(db: D1Database, faction: Faction, now: number): Promise<void> {
  await db
    .prepare(
      `INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         group_id = excluded.group_id,
         names_json = excluded.names_json,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at`,
    )
    .bind(
      faction.id,
      faction.groupId,
      JSON.stringify(faction.names),
      faction.enabled ? 1 : 0,
      now,
      now,
    )
    .run();
}

async function saveVersion(
  db: D1Database,
  version: Version & { enabled?: boolean },
  now: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO versions
         (id, sort_order, released_at, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         sort_order = excluded.sort_order,
         released_at = excluded.released_at,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at`,
    )
    .bind(
      version.id,
      version.order,
      version.releasedAt,
      version.enabled === false ? 0 : 1,
      now,
      now,
    )
    .run();
}

function announcement(row: AnnouncementRow) {
  return {
    id: row.id,
    title: localizedText(row.title),
    body: localizedText(row.body),
    published: row.published === 1,
    startsAt: row.starts_at === null ? null : new Date(row.starts_at).toISOString(),
    endsAt: row.ends_at === null ? null : new Date(row.ends_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const adminRoutes = new Hono<AppContext>();

adminRoutes.get("/admin/characters", async (context) => {
  requireRole(context, CHARACTER_ROLES);
  const query = context.req.query("q")?.trim() ?? "";
  const rows = await context.env.DB.prepare(
    `SELECT payload_json FROM characters
     WHERE ? = '' OR id LIKE ? OR payload_json LIKE ?
     ORDER BY release_order, id LIMIT 500`,
  )
    .bind(query, `%${query}%`, `%${query}%`)
    .all<StoredCharacterRow>();
  return ok(
    context,
    rows.results.map((row) => CharacterSchema.parse(JSON.parse(row.payload_json))),
  );
});

adminRoutes.post("/admin/characters/import", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const parsed = CharacterImportSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const now = Date.now();
  for (const character of parsed.data.characters) {
    await saveCharacter(context.env.DB, character, now);
  }
  await audit(context, auth, "character.import", "character-batch", null, {
    count: parsed.data.characters.length,
    ids: parsed.data.characters.map((character) => character.id),
  });
  return ok(context, { imported: parsed.data.characters.length });
});

adminRoutes.put("/admin/characters/:characterId", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const parsed = CharacterSchema.safeParse(await readJson(context));
  if (!parsed.success || parsed.data.id !== context.req.param("characterId")) {
    throw new ApiProblem("VALIDATION_FAILED", 400, {
      reason: parsed.success ? "id-mismatch" : "schema",
    });
  }
  const existed = await context.env.DB.prepare("SELECT 1 AS value FROM characters WHERE id = ?")
    .bind(parsed.data.id)
    .first<{ value: number }>();
  await saveCharacter(context.env.DB, parsed.data, Date.now());
  await audit(
    context,
    auth,
    existed ? "character.update" : "character.create",
    "character",
    parsed.data.id,
  );
  return ok(context, parsed.data, existed ? 200 : 201);
});

adminRoutes.patch("/admin/characters/:characterId", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const parsed = CharacterStateSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const current = await storedCharacter(context.env.DB, context.req.param("characterId"));
  const updated = CharacterSchema.parse({
    ...current,
    enabled: parsed.data.enabled ?? current.enabled,
    targetEligible: parsed.data.targetEligible ?? current.targetEligible,
  });
  await saveCharacter(context.env.DB, updated, Date.now());
  await audit(context, auth, "character.state.update", "character", current.id, {
    before: { enabled: current.enabled, targetEligible: current.targetEligible },
    after: { enabled: updated.enabled, targetEligible: updated.targetEligible },
  });
  return ok(context, updated);
});

adminRoutes.delete("/admin/characters/:characterId", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const current = await storedCharacter(context.env.DB, context.req.param("characterId"));
  const updated = CharacterSchema.parse({ ...current, enabled: false, targetEligible: false });
  await saveCharacter(context.env.DB, updated, Date.now());
  await audit(context, auth, "character.disable", "character", current.id);
  return ok(context, updated);
});

adminRoutes.get("/admin/factions", async (context) => {
  requireRole(context, CHARACTER_ROLES);
  const rows = await context.env.DB.prepare(
    "SELECT id, group_id, names_json, enabled FROM factions ORDER BY id",
  ).all<{ id: string; group_id: string; names_json: string; enabled: number }>();
  return ok(
    context,
    rows.results.map((row) =>
      FactionSchema.parse({
        id: row.id,
        groupId: row.group_id,
        names: JSON.parse(row.names_json) as unknown,
        enabled: row.enabled === 1,
      }),
    ),
  );
});

adminRoutes.put("/admin/factions", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const parsed = FactionPutSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const factions = Array.isArray(parsed.data)
    ? parsed.data
    : "factions" in parsed.data
      ? parsed.data.factions
      : [parsed.data];
  const now = Date.now();
  for (const faction of factions) await saveFaction(context.env.DB, faction, now);
  await audit(context, auth, "faction.upsert", "faction-batch", null, {
    ids: factions.map((faction) => faction.id),
  });
  return ok(context, { updated: factions.length });
});

adminRoutes.get("/admin/versions", async (context) => {
  requireRole(context, CHARACTER_ROLES);
  const rows = await context.env.DB.prepare(
    "SELECT id, sort_order, released_at, enabled FROM versions ORDER BY sort_order, id",
  ).all<{ id: string; sort_order: number; released_at: string; enabled: number }>();
  return ok(
    context,
    rows.results.map((row) => ({
      id: row.id,
      order: row.sort_order,
      releasedAt: row.released_at,
      enabled: row.enabled === 1,
    })),
  );
});

adminRoutes.put("/admin/versions", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const parsed = VersionPutSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const versions = Array.isArray(parsed.data)
    ? parsed.data
    : "versions" in parsed.data
      ? parsed.data.versions
      : [parsed.data];
  const now = Date.now();
  for (const version of versions) await saveVersion(context.env.DB, version, now);
  await audit(context, auth, "version.upsert", "version-batch", null, {
    ids: versions.map((version) => version.id),
  });
  return ok(context, { updated: versions.length });
});

adminRoutes.get("/admin/daily-targets", async (context) => {
  requireRole(context, CHARACTER_ROLES);
  const rows = await context.env.DB.prepare(
    `SELECT date_key, character_id, cycle, source, created_at, updated_at
     FROM daily_target_schedule ORDER BY date_key DESC LIMIT 100`,
  ).all<DailyScheduleRow>();
  return ok(
    context,
    rows.results.map((row) => ({
      dateKey: row.date_key,
      characterId: row.character_id,
      cycle: row.cycle,
      source: row.source,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
  );
});

adminRoutes.put("/admin/daily-targets/:dateKey", async (context) => {
  const auth = requireRole(context, CHARACTER_ROLES);
  const dateKey = DateKeySchema.safeParse(context.req.param("dateKey"));
  const body = DailyOverrideSchema.safeParse(await readJson(context));
  if (!dateKey.success || !body.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const target = await storedCharacter(context.env.DB, body.data.characterId);
  if (!target.enabled || !target.targetEligible) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "ineligible-target" });
  }
  const previous = await context.env.DB.prepare(
    `SELECT date_key, character_id, cycle, source, created_at, updated_at
     FROM daily_target_schedule WHERE date_key = ?`,
  )
    .bind(dateKey.data)
    .first<DailyScheduleRow>();
  const maximum = await context.env.DB.prepare(
    "SELECT MAX(cycle) AS cycle FROM daily_target_schedule",
  ).first<{ cycle: number | null }>();
  let cycle = previous?.cycle ?? maximum?.cycle ?? 0;
  if (!previous) {
    const poolCount = await context.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM characters WHERE enabled = 1 AND target_eligible = 1",
    ).first<{ count: number }>();
    const usedCount = await context.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM daily_target_schedule WHERE cycle = ?",
    )
      .bind(cycle)
      .first<{ count: number }>();
    if ((usedCount?.count ?? 0) >= (poolCount?.count ?? 0)) cycle += 1;
  }
  const now = Date.now();
  try {
    await context.env.DB.prepare(
      `INSERT INTO daily_target_schedule
         (date_key, character_id, cycle, source, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, 'override', ?, ?, ?)
       ON CONFLICT(date_key) DO UPDATE SET
         character_id = excluded.character_id,
         cycle = excluded.cycle,
         source = 'override',
         created_by_user_id = excluded.created_by_user_id,
         updated_at = excluded.updated_at`,
    )
      .bind(dateKey.data, target.id, cycle, auth.user.id, now, now)
      .run();
  } catch (error) {
    if (error instanceof Error && error.message.toLocaleLowerCase("en-US").includes("unique")) {
      throw new ApiProblem("VALIDATION_FAILED", 409, {
        reason: "target-already-used-in-cycle",
        cycle,
      });
    }
    throw error;
  }
  await audit(context, auth, "daily-target.override", "daily-target", dateKey.data, {
    before: previous
      ? { characterId: previous.character_id, cycle: previous.cycle, source: previous.source }
      : null,
    after: { characterId: target.id, cycle, source: "override" },
  });
  return ok(context, { dateKey: dateKey.data, characterId: target.id, cycle, source: "override" });
});

adminRoutes.get("/admin/announcements", async (context) => {
  requireRole(context, CONTENT_ROLES);
  const rows = await context.env.DB.prepare(
    "SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100",
  ).all<AnnouncementRow>();
  return ok(context, rows.results.map(announcement));
});

adminRoutes.post("/admin/announcements", async (context) => {
  const auth = requireRole(context, CONTENT_ROLES);
  const parsed = AnnouncementSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const id = crypto.randomUUID();
  const now = Date.now();
  await context.env.DB.prepare(
    `INSERT INTO announcements
       (id, title, body, published, starts_at, ends_at, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      JSON.stringify(parsed.data.title),
      JSON.stringify(parsed.data.body),
      parsed.data.published ? 1 : 0,
      parsed.data.startsAt ? Date.parse(parsed.data.startsAt) : null,
      parsed.data.endsAt ? Date.parse(parsed.data.endsAt) : null,
      auth.user.id,
      now,
      now,
    )
    .run();
  await audit(context, auth, "announcement.create", "announcement", id);
  return ok(context, { id, ...parsed.data, createdAt: new Date(now).toISOString() }, 201);
});

adminRoutes.patch("/admin/announcements/:announcementId", async (context) => {
  const auth = requireRole(context, CONTENT_ROLES);
  const parsed = AnnouncementPatchSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const current = await context.env.DB.prepare("SELECT * FROM announcements WHERE id = ?")
    .bind(context.req.param("announcementId"))
    .first<AnnouncementRow>();
  if (!current) throw new ApiProblem("NOT_FOUND", 404);
  const next = {
    title: parsed.data.title ?? localizedText(current.title),
    body: parsed.data.body ?? localizedText(current.body),
    published: parsed.data.published ?? current.published === 1,
    startsAt:
      parsed.data.startsAt === undefined
        ? current.starts_at
        : parsed.data.startsAt === null
          ? null
          : Date.parse(parsed.data.startsAt),
    endsAt:
      parsed.data.endsAt === undefined
        ? current.ends_at
        : parsed.data.endsAt === null
          ? null
          : Date.parse(parsed.data.endsAt),
  };
  const now = Date.now();
  await context.env.DB.prepare(
    `UPDATE announcements SET
       title = ?, body = ?, published = ?, starts_at = ?, ends_at = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      JSON.stringify(next.title),
      JSON.stringify(next.body),
      next.published ? 1 : 0,
      next.startsAt,
      next.endsAt,
      now,
      current.id,
    )
    .run();
  await audit(context, auth, "announcement.update", "announcement", current.id);
  return ok(context, { id: current.id, ...next, updatedAt: new Date(now).toISOString() });
});

adminRoutes.get("/admin/operations", async (context) => {
  requireRole(context, ADMIN_ROLES);
  const parsed = OperationsQuerySchema.safeParse(context.req.query());
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  return ok(
    context,
    await getOperationsOverview(
      context.env,
      parsed.data.range satisfies OperationsLatencyRange,
      parsed.data.trend satisfies OperationsTrendDays,
    ),
  );
});

adminRoutes.get("/admin/users", async (context) => {
  requireRole(context, MODERATION_ROLES);
  const parsed = UserListQuerySchema.safeParse(context.req.query());
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const now = Date.now();
  const conditions = ["is_guest = 0", "merged_into_user_id IS NULL"];
  const bindings: Array<string | number> = [];
  if (parsed.data.q) {
    conditions.push("(display_name LIKE ? OR login_name LIKE ? OR email LIKE ?)");
    const like = `%${parsed.data.q}%`;
    bindings.push(like, like, like);
  }
  if (parsed.data.role) {
    conditions.push("role = ?");
    bindings.push(parsed.data.role);
  }
  if (parsed.data.status === "banned") {
    conditions.push("banned_until IS NOT NULL AND banned_until > ?");
    bindings.push(now);
  } else if (parsed.data.status === "active") {
    conditions.push("(banned_until IS NULL OR banned_until <= ?)");
    bindings.push(now);
  }
  if (parsed.data.email === "verified") conditions.push("email_verified = 1");
  if (parsed.data.email === "unverified") conditions.push("email_verified = 0");
  const where = conditions.join(" AND ");
  const offset = (parsed.data.page - 1) * parsed.data.pageSize;
  const [rows, totalRow] = await Promise.all([
    context.env.DB.prepare(
      `SELECT id, display_name, role, email_verified, elo, ranked_matches,
              leaderboard_eligible, banned_until, ban_reason, created_at
       FROM users
       WHERE ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, parsed.data.pageSize, offset)
      .all<{
        id: string;
        display_name: string;
        role: UserRole;
        email_verified: number;
        elo: number;
        ranked_matches: number;
        leaderboard_eligible: number;
        banned_until: number | null;
        ban_reason: string | null;
        created_at: number;
      }>(),
    context.env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE ${where}`)
      .bind(...bindings)
      .first<{ count: number }>(),
  ]);
  const total = totalRow?.count ?? 0;
  return ok(context, {
    items: rows.results.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      role: row.role,
      emailVerified: row.email_verified === 1,
      elo: row.elo,
      rankedMatches: row.ranked_matches,
      leaderboardEligible: row.leaderboard_eligible === 1,
      bannedUntil: row.banned_until === null ? null : new Date(row.banned_until).toISOString(),
      banReason: row.ban_reason,
      createdAt: new Date(row.created_at).toISOString(),
    })),
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / parsed.data.pageSize)),
  });
});

adminRoutes.patch("/admin/users/:userId", async (context) => {
  const auth = requireRole(context, MODERATION_ROLES);
  const parsed = UserPatchSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const target = await context.env.DB.prepare(
    `SELECT role, is_guest, ranked_matches, banned_until, ban_reason
     FROM users WHERE id = ? AND is_guest = 0 AND merged_into_user_id IS NULL`,
  )
    .bind(context.req.param("userId"))
    .first<{
      role: UserRole;
      is_guest: number;
      ranked_matches: number;
      banned_until: number | null;
      ban_reason: string | null;
    }>();
  if (!target) throw new ApiProblem("NOT_FOUND", 404);
  if (parsed.data.role && auth.user.role !== "admin" && auth.user.role !== "owner") {
    throw new ApiProblem("FORBIDDEN", 403);
  }
  if (
    parsed.data.role &&
    auth.user.role !== "owner" &&
    (target.role === "owner" || parsed.data.role === "owner" || parsed.data.role === "admin")
  ) {
    throw new ApiProblem("FORBIDDEN", 403);
  }
  const role = parsed.data.role ?? target.role;
  const eligible =
    parsed.data.leaderboardEligible === undefined
      ? null
      : parsed.data.leaderboardEligible && target.is_guest === 0 && target.ranked_matches >= 10
        ? 1
        : 0;
  const bannedUntil =
    parsed.data.bannedUntil === undefined
      ? target.banned_until
      : parsed.data.bannedUntil === null
        ? null
        : Date.parse(parsed.data.bannedUntil);
  const banReason = parsed.data.banReason === undefined ? target.ban_reason : parsed.data.banReason;
  const now = Date.now();
  const statements: D1PreparedStatement[] = [
    context.env.DB.prepare(
      `UPDATE users SET
         role = ?, leaderboard_eligible = COALESCE(?, leaderboard_eligible),
         banned_until = ?, ban_reason = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(
      role,
      eligible,
      bannedUntil,
      bannedUntil === null ? null : banReason,
      now,
      context.req.param("userId"),
    ),
  ];
  if (bannedUntil !== null && bannedUntil > now) {
    statements.push(
      context.env.DB.prepare(
        "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
      ).bind(now, context.req.param("userId")),
    );
  }
  await context.env.DB.batch(statements);
  await audit(context, auth, "user.update", "user", context.req.param("userId"), {
    role,
    leaderboardEligible: eligible,
    bannedUntil,
    banReason: bannedUntil === null ? null : banReason,
  });
  return ok(context, { updated: true });
});

adminRoutes.delete("/admin/leaderboards/daily/:resultId", async (context) => {
  const auth = requireRole(context, MODERATION_ROLES);
  const now = Date.now();
  const reason = context.req.query("reason")?.trim().slice(0, 500) || "moderated";
  const result = await context.env.DB.prepare(
    `UPDATE game_results SET
       leaderboard_hidden_at = ?, leaderboard_hidden_by_user_id = ?,
       leaderboard_hidden_reason = ?
     WHERE game_id = ? AND mode = 'daily' AND leaderboard_hidden_at IS NULL`,
  )
    .bind(now, auth.user.id, reason, context.req.param("resultId"))
    .run();
  if ((result.meta.changes ?? 0) === 0) throw new ApiProblem("NOT_FOUND", 404);
  await audit(
    context,
    auth,
    "leaderboard.daily.hide",
    "game-result",
    context.req.param("resultId"),
    { reason },
  );
  return ok(context, { hidden: true });
});

adminRoutes.get("/admin/audit-logs", async (context) => {
  requireRole(context, ADMIN_ROLES);
  const rows = await context.env.DB.prepare(
    `SELECT id, actor_user_id, action, target_type, target_id, request_id,
            metadata_json, created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT 200`,
  ).all<{
    id: string;
    actor_user_id: string;
    action: string;
    target_type: string;
    target_id: string | null;
    request_id: string;
    metadata_json: string;
    created_at: number;
  }>();
  return ok(
    context,
    rows.results.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      requestId: row.request_id,
      metadata: JSON.parse(row.metadata_json) as unknown,
      createdAt: new Date(row.created_at).toISOString(),
    })),
  );
});
