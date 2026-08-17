import { JoinRoomRequestSchema, MatchFormatSchema } from "@fireflydle/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { ApiProblem, ok, readJson, readOptionalJson } from "../lib/http";
import { requireAuth } from "../services/auth";
import { loadPlayableMultiplayerContentSnapshot } from "../services/multiplayer-content";
import { enforceRateLimit } from "../services/rate-limit";
import type { AppContext, AuthUser } from "../types";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_TTL_MS = 24 * 60 * 60 * 1_000;
const RoomIdSchema = z.string().uuid();
const CreatePrivateRoomSchema = z.object({
  format: MatchFormatSchema.optional().default(3),
});

interface RoomDirectoryRow {
  room_id: string;
  room_code: string;
  durable_object_name: string;
  state: "waiting" | "active" | "finished";
  expires_at: number;
}

function participant(user: AuthUser) {
  return {
    userId: user.id,
    displayName: user.displayName,
    isGuest: user.isGuest,
    rating: user.elo,
    rankedMatches: user.rankedMatches,
  };
}

function generateRoomCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length] ?? "A",
  ).join("");
}

async function insertRoomDirectory(
  db: D1Database,
  roomId: string,
  ownerUserId: string,
  format: 1 | 3 | 5 | 7,
  now: number,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();
    try {
      await db
        .prepare(
          `INSERT INTO room_directory
             (room_id, room_code, durable_object_name, owner_user_id, state,
              ranked, match_format, created_at, expires_at)
           VALUES (?, ?, ?, ?, 'waiting', 0, ?, ?, ?)`,
        )
        .bind(roomId, code, roomId, ownerUserId, format, now, now + ROOM_TTL_MS)
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
  throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "room-code-exhausted" });
}

async function roomById(db: D1Database, roomId: string): Promise<RoomDirectoryRow> {
  const room = await db
    .prepare(
      `SELECT room_id, room_code, durable_object_name, state, expires_at
       FROM room_directory WHERE room_id = ?`,
    )
    .bind(roomId)
    .first<RoomDirectoryRow>();
  if (!room || room.expires_at <= Date.now()) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return room;
}

async function roomByCode(db: D1Database, code: string): Promise<RoomDirectoryRow> {
  const room = await db
    .prepare(
      `SELECT room_id, room_code, durable_object_name, state, expires_at
       FROM room_directory WHERE room_code = ?`,
    )
    .bind(code)
    .first<RoomDirectoryRow>();
  if (!room || room.expires_at <= Date.now()) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return room;
}

function validatedRoomId(value: string): string {
  const parsed = RoomIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return parsed.data;
}

export const roomRoutes = new Hono<AppContext>();

roomRoutes.post("/rooms", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "rooms:create:user", auth.user.id, {
    limit: 10,
    windowMs: 60 * 1_000,
  });
  const parsed = CreatePrivateRoomSchema.safeParse(await readOptionalJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const contentSnapshot = await loadPlayableMultiplayerContentSnapshot(context.env.DB);
  if (!contentSnapshot) {
    throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  }

  const now = Date.now();
  const roomId = crypto.randomUUID();
  const code = await insertRoomDirectory(
    context.env.DB,
    roomId,
    auth.user.id,
    parsed.data.format,
    now,
  );
  try {
    const snapshot = await context.env.GAME_ROOM.getByName(roomId).initialize({
      roomId,
      code,
      format: parsed.data.format,
      ranked: false,
      owner: participant(auth.user),
      contentSnapshot,
      now,
    });
    return ok(context, { roomId, code, snapshot }, 201);
  } catch (error) {
    await context.env.DB.prepare("DELETE FROM room_directory WHERE room_id = ?").bind(roomId).run();
    throw error;
  }
});

roomRoutes.post("/rooms/join", async (context) => {
  const auth = requireAuth(context);
  await enforceRateLimit(context.env.DB, "rooms:join:user", auth.user.id, {
    limit: 20,
    windowMs: 60 * 1_000,
  });
  const parsed = JoinRoomRequestSchema.safeParse(await readJson(context));
  if (!parsed.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const room = await roomByCode(context.env.DB, parsed.data.code);
  const result = await context.env.GAME_ROOM.getByName(room.durable_object_name).join({
    participant: participant(auth.user),
  });
  if (!result.ok) {
    throw new ApiProblem(result.code, result.code === "ROOM_FULL" ? 409 : 403);
  }
  await context.env.DB.prepare(
    "UPDATE room_directory SET state = 'active', expires_at = ? WHERE room_id = ?",
  )
    .bind(Date.now() + ROOM_TTL_MS, room.room_id)
    .run();
  return ok(context, { roomId: room.room_id, code: room.room_code, snapshot: result.snapshot });
});

roomRoutes.get("/rooms/:roomId", async (context) => {
  const auth = requireAuth(context);
  const room = await roomById(context.env.DB, validatedRoomId(context.req.param("roomId")));
  const result = await context.env.GAME_ROOM.getByName(room.durable_object_name).snapshot(
    auth.user.id,
  );
  if (!result.ok) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return ok(context, { roomId: room.room_id, code: room.room_code, snapshot: result.snapshot });
});

roomRoutes.post("/rooms/:roomId/leave", async (context) => {
  const auth = requireAuth(context);
  const room = await roomById(context.env.DB, validatedRoomId(context.req.param("roomId")));
  const left = await context.env.GAME_ROOM.getByName(room.durable_object_name).leave(auth.user.id);
  if (!left) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return ok(context, { left: true });
});

roomRoutes.get("/rooms/:roomId/socket", async (context) => {
  const auth = requireAuth(context);
  const room = await roomById(context.env.DB, validatedRoomId(context.req.param("roomId")));
  const roomObject = context.env.GAME_ROOM.getByName(room.durable_object_name);
  const membership = await roomObject.snapshot(auth.user.id);
  if (!membership.ok) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  const headers = new Headers(context.req.raw.headers);
  headers.set("x-fireflydle-player-id", auth.user.id);
  const response = await roomObject.fetch(new Request(context.req.raw, { headers }));
  if (response.status === 404) throw new ApiProblem("ROOM_NOT_FOUND", 404);
  return response;
});
