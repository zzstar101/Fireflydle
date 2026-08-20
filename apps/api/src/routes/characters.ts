import { FactionSchema, VersionSchema } from "@fireflydle/contracts";
import { Hono, type Context } from "hono";
import { getCharacter, getEnabledCharacters } from "../lib/db";
import { ApiProblem, ok } from "../lib/http";
import type { AppContext } from "../types";
import { requireAuth } from "../services/auth";
import {
  contentManifest,
  currencyWarsManifest,
  currencyWarsUnitSummaries,
  npcEntities,
  npcManifest,
  npcSummary,
  characterSkins,
} from "@fireflydle/game-data";

export const characterRoutes = new Hono<AppContext>();

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function requireCurrentManifest(context: Context<AppContext>, currentVersion: string): void {
  const requestedVersion = context.req.query("manifestVersion");
  if (!requestedVersion) return;
  if (requestedVersion !== currentVersion) {
    throw new ApiProblem("VALIDATION_FAILED", 409, {
      reason: "manifest-version-unavailable",
      manifestVersion: requestedVersion,
    });
  }
  context.header("Cache-Control", "public, max-age=31536000, immutable");
}

characterRoutes.get("/characters", async (context) => {
  requireCurrentManifest(context, contentManifest.manifestVersion);
  return ok(context, await getEnabledCharacters(context.env.DB));
});

characterRoutes.get("/portrait-roster", async (context) => {
  const characters = await getEnabledCharacters(context.env.DB);
  const allowed = new Set(characters.map((character) => character.id));
  return ok(context, {
    characters,
    skins: characterSkins.filter((skin) => allowed.has(skin.characterId)),
  });
});

characterRoutes.get("/collection", async (context) => {
  const auth = requireAuth(context);
  const requestUrl = new URL(context.req.url);
  const localUnlockAll =
    requestUrl.searchParams.get("unlockAll") === "1" &&
    LOCAL_HOSTNAMES.has(requestUrl.hostname.toLocaleLowerCase("en-US"));
  const [available, unlockedRows] = await Promise.all([
    getEnabledCharacters(context.env.DB),
    context.env.DB.prepare(
      `SELECT DISTINCT g.target_character_id
       FROM games g
       JOIN game_results r ON r.game_id = g.id
       WHERE (g.user_id = ? OR EXISTS (
         SELECT 1 FROM users merged
         WHERE merged.id = g.user_id AND merged.merged_into_user_id = ?
       ))
         AND g.mode_id = 'playable' AND r.result = 'won'`,
    )
      .bind(auth.user.id, auth.user.id)
      .all<{ target_character_id: string }>(),
  ]);
  const unlocked = localUnlockAll
    ? new Set(available.map((character) => character.id))
    : new Set(unlockedRows.results.map((row) => row.target_character_id));
  const unlockedCharacters = available.filter((character) => unlocked.has(character.id));
  const pathProgress = new Map<string, { unlocked: number; total: number }>();
  const factionProgress = new Map<string, { unlocked: number; total: number }>();
  for (const character of available) {
    for (const [map, key] of [
      [pathProgress, character.path],
      [factionProgress, character.factionId],
    ] as const) {
      const current = map.get(key) ?? { unlocked: 0, total: 0 };
      current.total += 1;
      if (unlocked.has(character.id)) current.unlocked += 1;
      map.set(key, current);
    }
  }
  return ok(context, {
    unlockedIds: [...unlocked],
    characters: available.map((character) => ({
      ...character,
      unlocked: unlocked.has(character.id),
    })),
    skins: characterSkins.filter((skin) => unlocked.has(skin.characterId)),
    pathProgress: Object.fromEntries(pathProgress),
    factionProgress: Object.fromEntries(factionProgress),
    total: available.length,
    unlockedCount: unlockedCharacters.length,
  });
});

characterRoutes.get("/npcs", (context) => {
  requireCurrentManifest(context, npcManifest.manifestVersion);
  const mode = npcManifest.modes.find((entry) => entry.id === "npc");
  const pool = npcManifest.pools.find((entry) => entry.id === mode?.candidatePoolId);
  const allowed = new Set(pool?.candidateIds ?? []);
  return ok(context, npcEntities.filter((entity) => allowed.has(entity.id)).map(npcSummary));
});

characterRoutes.get("/currency-wars/units", (context) => {
  requireCurrentManifest(context, currencyWarsManifest.manifestVersion);
  const mode = currencyWarsManifest.modes.find((entry) => entry.id === "currency-wars");
  const pool = currencyWarsManifest.pools.find((entry) => entry.id === mode?.candidatePoolId);
  const allowed = new Set(pool?.candidateIds ?? []);
  return ok(
    context,
    currencyWarsUnitSummaries.filter((unit) => allowed.has(unit.id)),
  );
});

characterRoutes.get("/characters/:characterId", async (context) => {
  const character = await getCharacter(context.env.DB, context.req.param("characterId"));
  if (!character) throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
  return ok(context, character);
});

characterRoutes.get("/factions", async (context) => {
  const rows = await context.env.DB.prepare(
    "SELECT id, group_id, names_json, enabled FROM factions WHERE enabled = 1 ORDER BY id",
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

characterRoutes.get("/versions", async (context) => {
  const rows = await context.env.DB.prepare(
    `SELECT id, sort_order, released_at FROM versions
     WHERE enabled = 1 ORDER BY sort_order, id`,
  ).all<{ id: string; sort_order: number; released_at: string }>();
  return ok(
    context,
    rows.results.map((row) =>
      VersionSchema.parse({ id: row.id, order: row.sort_order, releasedAt: row.released_at }),
    ),
  );
});
