import {
  CreatePartyRequestSchema,
  DEFAULT_PARTY_CONFIGURATION,
  JoinPartyRequestSchema,
  type PartyConfiguration,
} from "@fireflydle/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson, readOptionalJson } from "../lib/http";
import { requireAuth } from "../services/auth";
import { loadMultiplayerContentSnapshot } from "../services/multiplayer-content";
import { enforceRateLimit } from "../services/rate-limit";
import type { AppContext, AuthUser } from "../types";

/** 派对房 HTTP 路由：创建/加入/预览/WebSocket 升级，房间状态都在 PartyRoom DO 里 */

const PARTY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PARTY_TTL_MS = 24 * 60 * 60 * 1_000;
const PartyIdSchema = z.string().uuid();

interface PartyDirectoryRow {
  party_id: string;
  party_code: string;
  durable_object_name: string;
  expires_at: number;
}

function participant(user: AuthUser) {
  return { playerId: user.id, displayName: user.displayName };
}

function generatePartyCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (value) => PARTY_CODE_ALPHABET[value % PARTY_CODE_ALPHABET.length] ?? "A",
  ).join("");
}

async function insertPartyDirectory(
  db: D1Database,
  partyId: string,
  ownerUserId: string,
  now: number,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generatePartyCode();
    try {
      await db
        .prepare(
          `INSERT INTO party_directory
             (party_id, party_code, durable_object_name, owner_user_id, state, created_at, expires_at)
           VALUES (?, ?, ?, ?, 'lobby', ?, ?)`,
        )
        .bind(partyId, code, partyId, ownerUserId, now, now + PARTY_TTL_MS)
        .run();
      return code;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.toLocaleLowerCase("en-US").includes("unique")
      ) {
        throw error;
      }
    }
  }
  throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "party-code-exhausted" });
}

async function partyById(db: D1Database, partyId: string): Promise<PartyDirectoryRow> {
  const party = await db
    .prepare(
      `SELECT party_id, party_code, durable_object_name, expires_at
       FROM party_directory WHERE party_id = ?`,
    )
    .bind(partyId)
    .first<PartyDirectoryRow>();
  if (!party || party.expires_at <= Date.now()) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return party;
}

async function partyByCode(db: D1Database, code: string): Promise<PartyDirectoryRow> {
  const party = await db
    .prepare(
      `SELECT party_id, party_code, durable_object_name, expires_at
       FROM party_directory WHERE party_code = ?`,
    )
    .bind(code)
    .first<PartyDirectoryRow>();
  if (!party || party.expires_at <= Date.now()) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return party;
}

function validatedPartyId(value: string): string {
  const parsed = PartyIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return parsed.data;
}

export const partyRoutes = new Hono<AppContext>();

partyRoutes.post("/parties", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "parties:create:user", auth.user.id, {
    limit: 10,
    windowMs: 60 * 1_000,
  });
  // 顺手清理过期目录，避免房间码空间被僵尸行占用
  await context.env.DB.prepare("DELETE FROM party_directory WHERE expires_at <= ?")
    .bind(Date.now())
    .run();
  const raw = await readOptionalJson(context);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const parsed = CreatePartyRequestSchema.safeParse(body);
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  // 显式传 null 的 roundTimeSeconds 表示不限时，不能被缺省值覆盖
  const configuration: PartyConfiguration = {
    modeId: parsed.data.modeId ?? DEFAULT_PARTY_CONFIGURATION.modeId,
    rounds: parsed.data.rounds ?? DEFAULT_PARTY_CONFIGURATION.rounds,
    roundTimeSeconds:
      parsed.data.roundTimeSeconds === undefined
        ? DEFAULT_PARTY_CONFIGURATION.roundTimeSeconds
        : parsed.data.roundTimeSeconds,
    maxAttempts: parsed.data.maxAttempts ?? DEFAULT_PARTY_CONFIGURATION.maxAttempts,
  };
  const contentSnapshot = await loadMultiplayerContentSnapshot(
    context.env.DB,
    configuration.modeId,
  );
  if (!contentSnapshot) {
    throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  }

  const now = Date.now();
  const partyId = crypto.randomUUID();
  const code = await insertPartyDirectory(context.env.DB, partyId, auth.user.id, now);
  try {
    await context.env.PARTY_ROOM.getByName(partyId).initialize({
      partyId,
      code,
      configuration,
      host: participant(auth.user),
      contentSnapshot,
      now,
    });
    return ok(context, { partyId, code }, 201);
  } catch (error) {
    await context.env.DB.prepare("DELETE FROM party_directory WHERE party_id = ?")
      .bind(partyId)
      .run();
    throw error;
  }
});

partyRoutes.post("/parties/join", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "parties:join:user", auth.user.id, {
    limit: 20,
    windowMs: 60 * 1_000,
  });
  const parsed = JoinPartyRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const party = await partyByCode(context.env.DB, parsed.data.code);
  const result = await context.env.PARTY_ROOM.getByName(party.durable_object_name).join({
    player: participant(auth.user),
  });
  if (!result.ok) {
    throw new ApiProblem(
      result.code,
      result.code === "ROOM_FULL" ? 409 : result.code === "ROOM_NOT_FOUND" ? 404 : 403,
    );
  }
  await context.env.DB.prepare("UPDATE party_directory SET expires_at = ? WHERE party_id = ?")
    .bind(Date.now() + PARTY_TTL_MS, party.party_id)
    .run();
  return ok(context, { partyId: party.party_id, code: party.party_code });
});

partyRoutes.get("/parties/:partyId", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "parties:preview:user", auth.user.id, {
    limit: 20,
    windowMs: 60 * 1_000,
  });
  const party = await partyById(context.env.DB, validatedPartyId(context.req.param("partyId")));
  const preview = await context.env.PARTY_ROOM.getByName(party.durable_object_name).preview();
  // 房间已被回收（全员离开 60 秒后）视为不存在
  if (!preview) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return ok(context, {
    partyId: party.party_id,
    code: party.party_code,
    configuration: preview.configuration,
    state: preview.state,
    playerCount: preview.playerCount,
    hostDisplayName: preview.hostDisplayName,
  });
});

partyRoutes.get("/parties/:partyId/ws", async (context) => {
  const auth = requireAuth(context);
  const party = await partyById(context.env.DB, validatedPartyId(context.req.param("partyId")));
  const partyObject = context.env.PARTY_ROOM.getByName(party.durable_object_name);
  const headers = new Headers(context.req.raw.headers);
  headers.set("x-fireflydle-player-id", auth.user.id);
  // 成员校验交给 DO：404 = 不在房间内，403 = 已被踢出
  const response = await partyObject.fetch(new Request(context.req.raw, { headers }));
  if (response.status === 404) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  if (response.status === 403) throw new ApiProblem("FORBIDDEN", 403);
  return response;
});
