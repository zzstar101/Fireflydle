import { canMatchRatings } from "@fireflydle/game-engine";
import { DurableObject } from "cloudflare:workers";
import type {
  InitializeRoomInput,
  MatchmakingInput,
  MatchmakingResult,
} from "../domain/multiplayer";

const WAIT_TTL_MS = 10 * 60 * 1_000;
const RESERVATION_TTL_MS = 60_000;
const RESULT_TTL_MS = 60 * 60 * 1_000;
const MATCHED_RESULT_TTL_MS = 24 * 60 * 60 * 1_000;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface QueueRow extends Record<string, SqlStorageValue> {
  ticket_id: string;
  player_id: string;
  rating: number;
  status: "waiting" | "reserved" | "matched" | "cancelled" | "consumed";
  payload_json: string;
  enqueued_at: number;
  updated_at: number;
  room_id: string | null;
  room_code: string | null;
}

interface SocketAttachment {
  playerId: string;
  ticketId: string;
}

interface ReservedPair {
  left: QueueRow;
  right: QueueRow;
  roomId: string;
}

export class Matchmaker extends DurableObject<Env> {
  private readonly sql: SqlStorage;

  public constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS queue_entries (
          ticket_id TEXT PRIMARY KEY,
          player_id TEXT NOT NULL UNIQUE,
          rating INTEGER NOT NULL,
          status TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          enqueued_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          room_id TEXT,
          room_code TEXT
        ) STRICT;
        CREATE INDEX IF NOT EXISTS queue_status_idx
          ON queue_entries(status, enqueued_at);
      `);
    });
  }

  private rowForPlayer(playerId: string): QueueRow | null {
    return (
      this.sql
        .exec<QueueRow>("SELECT * FROM queue_entries WHERE player_id = ?", playerId)
        .toArray()[0] ?? null
    );
  }

  private rowForTicket(ticketId: string): QueueRow | null {
    return (
      this.sql
        .exec<QueueRow>("SELECT * FROM queue_entries WHERE ticket_id = ?", ticketId)
        .toArray()[0] ?? null
    );
  }

  private advanceSync(now: number): void {
    this.sql.exec(
      `UPDATE queue_entries SET status = 'cancelled', updated_at = ?
       WHERE status = 'waiting' AND enqueued_at + ? <= ?`,
      now,
      WAIT_TTL_MS,
      now,
    );
    this.sql.exec(
      `UPDATE queue_entries SET
         status = 'waiting', room_id = NULL, room_code = NULL, updated_at = ?
       WHERE status = 'reserved' AND updated_at + ? <= ?`,
      now,
      RESERVATION_TTL_MS,
      now,
    );
    this.sql.exec(
      `DELETE FROM queue_entries
       WHERE status IN ('cancelled', 'consumed') AND updated_at + ? <= ?`,
      RESULT_TTL_MS,
      now,
    );
    this.sql.exec(
      "DELETE FROM queue_entries WHERE status = 'matched' AND updated_at + ? <= ?",
      MATCHED_RESULT_TTL_MS,
      now,
    );
  }

  private findOpponent(player: QueueRow, now: number): QueueRow | null {
    const candidates = this.sql
      .exec<QueueRow>(
        `SELECT * FROM queue_entries
         WHERE status = 'waiting' AND player_id <> ?
         ORDER BY enqueued_at, ticket_id`,
        player.player_id,
      )
      .toArray();
    return (
      candidates.find((candidate) => {
        const longestWaiting = Math.max(now - player.enqueued_at, now - candidate.enqueued_at);
        return canMatchRatings(player.rating, candidate.rating, longestWaiting);
      }) ?? null
    );
  }

  private reservePair(left: QueueRow, right: QueueRow, now: number): ReservedPair {
    const roomId = crypto.randomUUID();
    this.sql.exec(
      `UPDATE queue_entries SET status = 'reserved', room_id = ?, updated_at = ?
       WHERE ticket_id IN (?, ?) AND status = 'waiting'`,
      roomId,
      now,
      left.ticket_id,
      right.ticket_id,
    );
    return {
      left: { ...left, status: "reserved", room_id: roomId, updated_at: now },
      right: { ...right, status: "reserved", room_id: roomId, updated_at: now },
      roomId,
    };
  }

  private generateRoomCode(): string {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    return Array.from(
      bytes,
      (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length] ?? "A",
    ).join("");
  }

  private async createRoomDirectory(
    roomId: string,
    ownerUserId: string,
    input: MatchmakingInput,
    now: number,
  ): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = this.generateRoomCode();
      try {
        await this.env.DB.prepare(
          `INSERT INTO room_directory
             (room_id, room_code, durable_object_name, owner_user_id, state,
              ranked, match_format, created_at, expires_at)
           VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
        )
          .bind(
            roomId,
            code,
            roomId,
            ownerUserId,
            input.ranked ? 1 : 0,
            input.format,
            now,
            now + 24 * 60 * 60 * 1_000,
          )
          .run();
        return code;
      } catch (error) {
        if (!(error instanceof Error) || !error.message.toLowerCase().includes("unique"))
          throw error;
      }
    }
    throw new Error("无法分配房间码");
  }

  private async materializePair(pair: ReservedPair, now: number): Promise<void> {
    const leftInput = JSON.parse(pair.left.payload_json) as MatchmakingInput;
    const rightInput = JSON.parse(pair.right.payload_json) as MatchmakingInput;
    let roomCode: string | null = null;
    try {
      roomCode = await this.createRoomDirectory(
        pair.roomId,
        leftInput.participant.userId,
        leftInput,
        now,
      );
      const roomInput: InitializeRoomInput = {
        roomId: pair.roomId,
        code: roomCode,
        format: leftInput.format,
        ranked: leftInput.ranked,
        owner: leftInput.participant,
        opponent: rightInput.participant,
        characters: leftInput.characters,
        targetIds: leftInput.targetIds,
        now,
      };
      await this.env.GAME_ROOM.getByName(pair.roomId).initialize(roomInput);
      this.ctx.storage.transactionSync(() => {
        this.sql.exec(
          `UPDATE queue_entries SET
             status = 'matched', room_code = ?, updated_at = ?
           WHERE ticket_id IN (?, ?) AND status = 'reserved' AND room_id = ?`,
          roomCode,
          now,
          pair.left.ticket_id,
          pair.right.ticket_id,
          pair.roomId,
        );
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "matchmaking-room-create-failed",
          roomId: pair.roomId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      if (roomCode) {
        await this.env.DB.prepare("DELETE FROM room_directory WHERE room_id = ?")
          .bind(pair.roomId)
          .run();
      }
      this.ctx.storage.transactionSync(() => {
        this.sql.exec(
          `UPDATE queue_entries SET
             status = 'waiting', room_id = NULL, room_code = NULL, updated_at = ?
           WHERE ticket_id IN (?, ?) AND status = 'reserved'`,
          now,
          pair.left.ticket_id,
          pair.right.ticket_id,
        );
      });
      throw error;
    }
  }

  private toResult(row: QueueRow): MatchmakingResult {
    if (row.status === "matched" && row.room_id && row.room_code) {
      return {
        status: "matched",
        ticketId: row.ticket_id,
        roomId: row.room_id,
        roomCode: row.room_code,
      };
    }
    return { status: "waiting", ticketId: row.ticket_id };
  }

  private async rearmAlarm(): Promise<void> {
    const next = this.sql
      .exec<{ due_at: number }>(
        `SELECT MIN(due_at) AS due_at FROM (
           SELECT enqueued_at + ? AS due_at FROM queue_entries WHERE status = 'waiting'
           UNION ALL
           SELECT updated_at + ? AS due_at FROM queue_entries WHERE status = 'reserved'
           UNION ALL
           SELECT updated_at + ? AS due_at FROM queue_entries
             WHERE status IN ('cancelled', 'consumed')
           UNION ALL
           SELECT updated_at + ? AS due_at FROM queue_entries WHERE status = 'matched'
         )`,
        WAIT_TTL_MS,
        RESERVATION_TTL_MS,
        RESULT_TTL_MS,
        MATCHED_RESULT_TTL_MS,
      )
      .toArray()[0];
    if (!next || next.due_at === null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(next.due_at);
  }

  private async reconcilePreviousMatch(playerId: string, now: number): Promise<void> {
    const existing = this.rowForPlayer(playerId);
    if (!existing || (existing.status !== "matched" && existing.status !== "consumed")) {
      return;
    }
    if (!existing.room_id) {
      this.sql.exec("DELETE FROM queue_entries WHERE ticket_id = ?", existing.ticket_id);
      return;
    }
    const room = await this.env.DB.prepare(
      "SELECT state, expires_at FROM room_directory WHERE room_id = ?",
    )
      .bind(existing.room_id)
      .first<{ state: "waiting" | "active" | "finished"; expires_at: number }>();
    if (room && room.state !== "finished" && room.expires_at > now) {
      this.ctx.storage.transactionSync(() => {
        this.sql.exec(
          `UPDATE queue_entries SET status = 'matched', updated_at = ?
           WHERE ticket_id = ? AND player_id = ? AND status IN ('matched', 'consumed')`,
          now,
          existing.ticket_id,
          playerId,
        );
      });
      return;
    }
    this.ctx.storage.transactionSync(() => {
      const current = this.rowForTicket(existing.ticket_id);
      if (
        current?.player_id === playerId &&
        (current.status === "matched" || current.status === "consumed")
      ) {
        this.sql.exec("DELETE FROM queue_entries WHERE ticket_id = ?", current.ticket_id);
      }
    });
  }

  public async enqueue(input: MatchmakingInput): Promise<MatchmakingResult> {
    const now = input.now ?? Date.now();
    await this.reconcilePreviousMatch(input.participant.userId, now);
    let pair: ReservedPair | null = null;
    let ticketId = "";
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const existing = this.rowForPlayer(input.participant.userId);
      if (existing && existing.status !== "cancelled" && existing.status !== "consumed") {
        ticketId = existing.ticket_id;
        return;
      }
      if (existing)
        this.sql.exec("DELETE FROM queue_entries WHERE ticket_id = ?", existing.ticket_id);
      ticketId = crypto.randomUUID();
      this.sql.exec(
        `INSERT INTO queue_entries
           (ticket_id, player_id, rating, status, payload_json, enqueued_at, updated_at)
         VALUES (?, ?, ?, 'waiting', ?, ?, ?)`,
        ticketId,
        input.participant.userId,
        input.participant.rating,
        JSON.stringify(input),
        now,
        now,
      );
      const own = this.rowForTicket(ticketId);
      if (!own) throw new Error("匹配票据写入失败");
      const opponent = this.findOpponent(own, now);
      if (opponent) pair = this.reservePair(opponent, own, now);
    });
    if (pair) await this.materializePair(pair, now);
    await this.rearmAlarm();
    await this.broadcastResults();
    const row = this.rowForTicket(ticketId);
    if (!row) throw new Error("匹配票据不存在");
    return this.toResult(row);
  }

  public async status(ticketId: string, playerId: string): Promise<MatchmakingResult | null> {
    const row = this.rowForTicket(ticketId);
    if (
      !row ||
      row.player_id !== playerId ||
      row.status === "cancelled" ||
      row.status === "consumed"
    ) {
      return null;
    }
    return this.toResult(row);
  }

  public getStats(now = Date.now()): { waiting: number; reserved: number } {
    this.ctx.storage.transactionSync(() => this.advanceSync(now));
    const rows = this.sql
      .exec<{ status: "waiting" | "reserved"; count: number }>(
        `SELECT status, COUNT(*) AS count FROM queue_entries
         WHERE status IN ('waiting', 'reserved') GROUP BY status`,
      )
      .toArray();
    return {
      waiting: rows.find((row) => row.status === "waiting")?.count ?? 0,
      reserved: rows.find((row) => row.status === "reserved")?.count ?? 0,
    };
  }

  public async cancel(ticketId: string, playerId: string, now = Date.now()): Promise<boolean> {
    let cancelled = false;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const row = this.rowForTicket(ticketId);
      if (!row || row.player_id !== playerId) return;
      if (row.status === "cancelled") {
        cancelled = true;
        return;
      }
      if (row.status !== "waiting") return;
      this.sql.exec(
        "UPDATE queue_entries SET status = 'cancelled', updated_at = ? WHERE ticket_id = ?",
        now,
        ticketId,
      );
      cancelled = true;
    });
    await this.rearmAlarm();
    await this.broadcastResults();
    return cancelled;
  }

  public async acknowledge(
    ticketId: string,
    playerId: string,
    now = Date.now(),
  ): Promise<"acknowledged" | "active" | null> {
    const existing = this.rowForTicket(ticketId);
    if (
      !existing ||
      existing.player_id !== playerId ||
      (existing.status !== "matched" && existing.status !== "consumed")
    ) {
      return null;
    }
    if (existing.room_id) {
      const room = await this.env.DB.prepare(
        "SELECT state, expires_at FROM room_directory WHERE room_id = ?",
      )
        .bind(existing.room_id)
        .first<{ state: "waiting" | "active" | "finished"; expires_at: number }>();
      if (room && room.state !== "finished" && room.expires_at > now) return "active";
    }
    let acknowledged: "acknowledged" | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const row = this.rowForTicket(ticketId);
      if (!row || row.player_id !== playerId) return;
      if (row.status === "consumed") {
        acknowledged = "acknowledged";
        return;
      }
      if (row.status !== "matched") return;
      this.sql.exec(
        "UPDATE queue_entries SET status = 'consumed', updated_at = ? WHERE ticket_id = ?",
        now,
        ticketId,
      );
      acknowledged = "acknowledged";
    });
    await this.rearmAlarm();
    await this.broadcastResults();
    return acknowledged;
  }

  public async release(
    ticketId: string,
    playerId: string,
    now = Date.now(),
  ): Promise<"cancelled" | "acknowledged" | "active" | null> {
    const row = this.rowForTicket(ticketId);
    if (!row || row.player_id !== playerId) return null;
    if (row.status === "matched" || row.status === "consumed") {
      return this.acknowledge(ticketId, playerId, now);
    }
    return (await this.cancel(ticketId, playerId, now)) ? "cancelled" : null;
  }

  public override async alarm(): Promise<void> {
    this.ctx.storage.transactionSync(() => this.advanceSync(Date.now()));
    await this.rearmAlarm();
    await this.broadcastResults();
  }

  private socketAttachment(socket: WebSocket): SocketAttachment | null {
    return socket.deserializeAttachment() as SocketAttachment | null;
  }

  private async broadcastResults(): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = this.socketAttachment(socket);
      if (!attachment) continue;
      const result = await this.status(attachment.ticketId, attachment.playerId);
      try {
        socket.send(JSON.stringify({ type: "matchmaking", result }));
      } catch {
        socket.close(1011, "status-failed");
      }
    }
  }

  public override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const playerId = request.headers.get("x-fireflydle-player-id");
    const ticketId = new URL(request.url).searchParams.get("ticketId");
    if (!playerId || !ticketId) return new Response("Forbidden", { status: 403 });
    const row = this.rowForTicket(ticketId);
    if (
      !row ||
      row.player_id !== playerId ||
      row.status === "cancelled" ||
      row.status === "consumed"
    ) {
      return new Response("Not Found", { status: 404 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ playerId, ticketId } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server, [playerId]);
    server.send(JSON.stringify({ type: "matchmaking", result: this.toResult(row) }));
    return new Response(null, { status: 101, webSocket: client });
  }

  public override async webSocketMessage(
    webSocket: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    const attachment = this.socketAttachment(webSocket);
    if (!attachment || typeof message !== "string") return;
    let payload: unknown;
    try {
      payload = JSON.parse(message);
    } catch {
      webSocket.send(JSON.stringify({ type: "error", code: "VALIDATION_FAILED" }));
      return;
    }
    if (typeof payload !== "object" || payload === null || !("type" in payload)) return;
    if (payload.type === "ping") {
      webSocket.send(JSON.stringify({ type: "pong", at: Date.now() }));
    } else if (payload.type === "cancel") {
      await this.release(attachment.ticketId, attachment.playerId);
    } else if (payload.type === "ack") {
      await this.acknowledge(attachment.ticketId, attachment.playerId);
    } else if (payload.type === "status") {
      const result = await this.status(attachment.ticketId, attachment.playerId);
      webSocket.send(JSON.stringify({ type: "matchmaking", result }));
    }
  }

  public override webSocketClose(
    _webSocket: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): void {
    // 断开状态订阅不会取消排队，客户端可以在有效期内重连。
  }

  public override webSocketError(webSocket: WebSocket): void {
    webSocket.close(1011, "socket-error");
  }
}
