import { FactionSchema, VersionSchema } from "@fireflydle/contracts";
import { Hono } from "hono";
import { getCharacter, getEnabledCharacters } from "../lib/db";
import { ApiProblem, ok } from "../lib/http";
import type { AppContext } from "../types";

export const characterRoutes = new Hono<AppContext>();

characterRoutes.get("/characters", async (context) => {
  return ok(context, await getEnabledCharacters(context.env.DB));
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
