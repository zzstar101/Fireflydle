import type {
  Character,
  ClientRoomMessage,
  ErrorCode,
  GuessResult,
  RoomPlayer,
  RoomSnapshot,
} from "@fireflydle/contracts";
import { ClientRoomMessageSchema } from "@fireflydle/contracts";
import {
  calculateElo,
  createGuessResult,
  MAX_CONSECUTIVE_DRAWS,
  MULTIPLAYER_ATTEMPTS,
  MULTIPLAYER_ROUND_MS,
  RECONNECT_GRACE_MS,
} from "@fireflydle/game-engine";
import { DurableObject } from "cloudflare:workers";
import type { InitializeRoomInput, JoinRoomInput, RoomCommandResult } from "../domain/multiplayer";

const INTERMISSION_MS = 3_000;
const ROOM_PURGE_DELAY_MS = 24 * 60 * 60 * 1_000;
const GUESS_RATE_WINDOW_MS = 60 * 1_000;
const GUESS_RATE_LIMIT = 60;
const PROCESSED_ACTION_LIMIT = 256;

type RoomState = RoomSnapshot["state"];

interface MetaRow extends Record<string, SqlStorageValue> {
  room_id: string;
  code: string;
  match_format: 1 | 3 | 5 | 7;
  ranked: number;
  state: RoomState;
  round_number: number;
  consecutive_draws: number;
  round_ends_at: number | null;
  reconnect_deadline: number | null;
  paused_seat: number | null;
  paused_remaining_ms: number | null;
  winner_id: string | null;
  finish_reason: "score" | "three-draws" | "disconnect" | "left" | "cancelled" | null;
  target_json: string | null;
  pool_json: string;
  target_ids_json: string;
  revision: number;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  archive_status: "none" | "pending" | "purge-pending" | "purged";
  archive_attempts: number;
  archive_next_at: number | null;
}

interface PlayerRow extends Record<string, SqlStorageValue> {
  seat: number;
  player_id: string;
  display_name: string;
  score: number;
  guesses_used: number;
  connected: number;
  reconnect_pause_used: number;
  rating: number;
  ranked_matches: number;
}

interface GuessRow extends Record<string, SqlStorageValue> {
  round_number: number;
  seat: number;
  ordinal: number;
  character_id: string;
  result_json: string;
  guessed_at: number;
}

interface RoundRow extends Record<string, SqlStorageValue> {
  round_number: number;
  target_character_id: string;
  winner_id: string | null;
  started_at: number;
  completed_at: number | null;
}

interface TaskRow extends Record<string, SqlStorageValue> {
  task_key: string;
  kind: "round-timeout" | "reconnect-timeout" | "next-round";
  due_at: number;
  generation: number;
  payload_json: string;
}

interface SocketAttachment {
  playerId: string;
}

export class GameRoom extends DurableObject<Env> {
  private readonly sql: SqlStorage;

  public constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_meta (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          room_id TEXT NOT NULL,
          code TEXT NOT NULL,
          match_format INTEGER NOT NULL,
          ranked INTEGER NOT NULL,
          state TEXT NOT NULL,
          round_number INTEGER NOT NULL,
          consecutive_draws INTEGER NOT NULL,
          round_ends_at INTEGER,
          reconnect_deadline INTEGER,
          paused_seat INTEGER,
          paused_remaining_ms INTEGER,
          winner_id TEXT,
          finish_reason TEXT,
          target_json TEXT,
          pool_json TEXT NOT NULL,
          target_ids_json TEXT NOT NULL,
          revision INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          started_at INTEGER,
          completed_at INTEGER,
          archive_status TEXT NOT NULL,
          archive_attempts INTEGER NOT NULL,
          archive_next_at INTEGER
        ) STRICT;
        CREATE TABLE IF NOT EXISTS players (
          seat INTEGER PRIMARY KEY CHECK (seat IN (0, 1)),
          player_id TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          guesses_used INTEGER NOT NULL,
          connected INTEGER NOT NULL,
          reconnect_pause_used INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          ranked_matches INTEGER NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS rounds (
          round_number INTEGER PRIMARY KEY,
          target_character_id TEXT NOT NULL,
          winner_id TEXT,
          started_at INTEGER NOT NULL,
          completed_at INTEGER
        ) STRICT;
        CREATE TABLE IF NOT EXISTS guesses (
          round_number INTEGER NOT NULL,
          seat INTEGER NOT NULL,
          ordinal INTEGER NOT NULL,
          character_id TEXT NOT NULL,
          result_json TEXT NOT NULL,
          guessed_at INTEGER NOT NULL,
          PRIMARY KEY (round_number, seat, ordinal),
          UNIQUE (round_number, seat, character_id)
        ) STRICT;
        CREATE TABLE IF NOT EXISTS clock_tasks (
          task_key TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          due_at INTEGER NOT NULL,
          generation INTEGER NOT NULL,
          payload_json TEXT NOT NULL
        ) STRICT;
        CREATE INDEX IF NOT EXISTS clock_tasks_due_idx ON clock_tasks(due_at);
        CREATE TABLE IF NOT EXISTS processed_actions (
          player_id TEXT NOT NULL,
          action_id TEXT NOT NULL,
          response_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (player_id, action_id)
        ) STRICT;
        CREATE INDEX IF NOT EXISTS processed_actions_recent_idx
          ON processed_actions(player_id, created_at DESC, action_id DESC);
        CREATE TABLE IF NOT EXISTS guess_rate_events (
          event_id TEXT PRIMARY KEY,
          player_id TEXT NOT NULL,
          occurred_at INTEGER NOT NULL
        ) STRICT;
        CREATE INDEX IF NOT EXISTS guess_rate_events_player_idx
          ON guess_rate_events(player_id, occurred_at);
      `);
    });
  }

  private metaOrNull(): MetaRow | null {
    return (
      this.sql.exec<MetaRow>("SELECT * FROM room_meta WHERE singleton = 1").toArray()[0] ?? null
    );
  }

  private meta(): MetaRow {
    const meta = this.metaOrNull();
    if (!meta) throw new Error("房间尚未初始化");
    return meta;
  }

  private players(): PlayerRow[] {
    return this.sql.exec<PlayerRow>("SELECT * FROM players ORDER BY seat").toArray();
  }

  private player(playerId: string): PlayerRow | null {
    return (
      this.sql
        .exec<PlayerRow>("SELECT * FROM players WHERE player_id = ?", playerId)
        .toArray()[0] ?? null
    );
  }

  private enqueueTask(
    taskKey: string,
    kind: TaskRow["kind"],
    dueAt: number,
    generation: number,
    payload: Record<string, unknown> = {},
  ): void {
    this.sql.exec(
      `INSERT INTO clock_tasks (task_key, kind, due_at, generation, payload_json)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(task_key) DO UPDATE SET
         kind = excluded.kind, due_at = excluded.due_at,
         generation = excluded.generation, payload_json = excluded.payload_json`,
      taskKey,
      kind,
      dueAt,
      generation,
      JSON.stringify(payload),
    );
  }

  private deleteTask(taskKey: string): void {
    this.sql.exec("DELETE FROM clock_tasks WHERE task_key = ?", taskKey);
  }

  private selectTarget(meta: MetaRow): Character {
    const pool = JSON.parse(meta.pool_json) as Character[];
    const targetIds = JSON.parse(meta.target_ids_json) as string[];
    const used = new Set(
      this.sql
        .exec<{ target_character_id: string }>("SELECT target_character_id FROM rounds")
        .toArray()
        .map((row) => row.target_character_id),
    );
    const available = targetIds.filter((id) => !used.has(id));
    const ids = available.length > 0 ? available : targetIds;
    if (ids.length === 0) throw new Error("多人题库不能为空");
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const id = ids[(random[0] ?? 0) % ids.length];
    const target = pool.find((character) => character.id === id);
    if (!target) throw new Error("多人目标不在角色池中");
    return target;
  }

  private startRound(now: number): void {
    let meta = this.meta();
    if (meta.state === "finished") return;
    const disconnected = this.players().find((player) => player.connected === 0);
    if (disconnected && disconnected.reconnect_pause_used === 1) {
      const opponent = this.players().find((player) => player.seat !== disconnected.seat);
      this.finish(opponent?.player_id ?? null, "disconnect", now);
      return;
    }

    const target = this.selectTarget(meta);
    const roundNumber = meta.round_number + 1;
    const revision = meta.revision + 1;
    const endsAt = now + MULTIPLAYER_ROUND_MS;
    this.sql.exec(
      `UPDATE room_meta SET
         state = 'playing', round_number = ?, round_ends_at = ?, reconnect_deadline = NULL,
         paused_seat = NULL, paused_remaining_ms = NULL, target_json = ?, revision = ?,
         started_at = COALESCE(started_at, ?)
       WHERE singleton = 1`,
      roundNumber,
      endsAt,
      JSON.stringify(target),
      revision,
      now,
    );
    this.sql.exec("UPDATE players SET guesses_used = 0");
    this.sql.exec(
      "INSERT INTO rounds (round_number, target_character_id, started_at) VALUES (?, ?, ?)",
      roundNumber,
      target.id,
      now,
    );
    this.enqueueTask("round", "round-timeout", endsAt, revision, { roundNumber });
    this.deleteTask("next-round");
    meta = this.meta();
    if (disconnected) this.pauseForSeat(disconnected.seat, now, MULTIPLAYER_ROUND_MS, meta);
  }

  private finish(
    winnerId: string | null,
    reason: NonNullable<MetaRow["finish_reason"]>,
    now: number,
  ): void {
    this.sql.exec(
      `UPDATE room_meta SET
         state = 'finished', winner_id = ?, finish_reason = ?, round_ends_at = NULL,
         reconnect_deadline = NULL, paused_seat = NULL, paused_remaining_ms = NULL,
         completed_at = ?, archive_status = 'pending', archive_next_at = ?, revision = revision + 1
       WHERE singleton = 1`,
      winnerId,
      reason,
      now,
      now,
    );
    this.sql.exec("DELETE FROM clock_tasks");
  }

  private settleRound(winnerSeat: number | null, now: number): void {
    const meta = this.meta();
    if (meta.state !== "playing") return;
    const winner =
      winnerSeat === null ? null : this.players().find((row) => row.seat === winnerSeat);
    this.sql.exec(
      "UPDATE rounds SET winner_id = ?, completed_at = ? WHERE round_number = ?",
      winner?.player_id ?? null,
      now,
      meta.round_number,
    );
    this.deleteTask("round");
    if (winner) {
      this.sql.exec("UPDATE players SET score = score + 1 WHERE seat = ?", winner.seat);
      this.sql.exec("UPDATE room_meta SET consecutive_draws = 0 WHERE singleton = 1");
    } else {
      this.sql.exec(
        "UPDATE room_meta SET consecutive_draws = consecutive_draws + 1 WHERE singleton = 1",
      );
    }

    const updated = this.meta();
    const winsNeeded = Math.floor(updated.match_format / 2) + 1;
    const winnerAfter = winner ? this.player(winner.player_id) : null;
    if (winnerAfter && winnerAfter.score >= winsNeeded) {
      this.finish(winnerAfter.player_id, "score", now);
      return;
    }
    if (!winner && updated.consecutive_draws >= MAX_CONSECUTIVE_DRAWS) {
      this.finish(null, "three-draws", now);
      return;
    }
    const revision = updated.revision + 1;
    this.sql.exec(
      `UPDATE room_meta SET
         state = 'round-ended', round_ends_at = NULL, reconnect_deadline = NULL,
         paused_seat = NULL, paused_remaining_ms = NULL, revision = ?
       WHERE singleton = 1`,
      revision,
    );
    this.enqueueTask("next-round", "next-round", now + INTERMISSION_MS, revision);
  }

  private pauseForSeat(seat: number, now: number, remainingMs: number, meta = this.meta()): void {
    const deadline = now + RECONNECT_GRACE_MS;
    const revision = meta.revision + 1;
    this.sql.exec(
      `UPDATE room_meta SET
         state = 'paused', round_ends_at = NULL, reconnect_deadline = ?, paused_seat = ?,
         paused_remaining_ms = ?, revision = ?
       WHERE singleton = 1`,
      deadline,
      seat,
      Math.max(0, remainingMs),
      revision,
    );
    this.sql.exec("UPDATE players SET reconnect_pause_used = 1 WHERE seat = ?", seat);
    this.deleteTask("round");
    this.enqueueTask("reconnect", "reconnect-timeout", deadline, revision, { seat });
  }

  private advanceSync(now: number): boolean {
    let changed = false;
    for (;;) {
      const task = this.sql
        .exec<TaskRow>(
          "SELECT * FROM clock_tasks WHERE due_at <= ? ORDER BY due_at, task_key LIMIT 1",
          now,
        )
        .toArray()[0];
      if (!task) break;
      this.deleteTask(task.task_key);
      const meta = this.meta();
      if (task.generation !== meta.revision) continue;
      changed = true;
      if (task.kind === "round-timeout" && meta.state === "playing") {
        this.settleRound(null, now);
      } else if (task.kind === "next-round" && meta.state === "round-ended") {
        this.startRound(now);
      } else if (task.kind === "reconnect-timeout" && meta.state === "paused") {
        const payload = JSON.parse(task.payload_json) as { seat?: number };
        const disconnected = this.players().find((player) => player.seat === payload.seat);
        if (disconnected?.connected === 0) {
          const opponent = this.players().find((player) => player.seat !== disconnected.seat);
          this.finish(opponent?.player_id ?? null, "disconnect", now);
        }
      }
    }
    return changed;
  }

  private snapshotSync(playerId: string): RoomSnapshot {
    const meta = this.meta();
    const players = this.players();
    const own = players.find((player) => player.player_id === playerId);
    if (!own) throw new Error("玩家不在房间中");
    const currentGuesses = this.sql
      .exec<GuessRow>(
        "SELECT * FROM guesses WHERE round_number = ? ORDER BY seat, ordinal",
        meta.round_number,
      )
      .toArray();
    const ownGuesses = currentGuesses
      .filter((guess) => guess.seat === own.seat)
      .map((guess) => JSON.parse(guess.result_json) as GuessResult);
    const opponentFeedback = currentGuesses
      .filter((guess) => guess.seat !== own.seat)
      .map((guess) => (JSON.parse(guess.result_json) as GuessResult).cells);
    return {
      roomId: meta.room_id,
      code: meta.code,
      format: meta.match_format,
      ranked: meta.ranked === 1,
      state: meta.state,
      round: Math.max(1, meta.round_number),
      consecutiveDraws: meta.consecutive_draws,
      roundEndsAt: meta.round_ends_at,
      reconnectDeadline: meta.reconnect_deadline,
      players: players.map<RoomPlayer>((player) => ({
        playerId: player.player_id,
        displayName: player.display_name,
        score: player.score,
        guessesUsed: player.guesses_used,
        connected: player.connected === 1,
        reconnectPauseUsed: player.reconnect_pause_used === 1,
      })),
      ownGuesses,
      opponentFeedback,
      winnerId: meta.winner_id,
    };
  }

  private async rearmAlarm(): Promise<void> {
    const task = this.sql
      .exec<{ due_at: number }>("SELECT due_at FROM clock_tasks ORDER BY due_at LIMIT 1")
      .toArray()[0];
    const meta = this.metaOrNull();
    const archiveAt =
      meta?.archive_status === "pending" || meta?.archive_status === "purge-pending"
        ? meta.archive_next_at
        : null;
    const dueAt = task
      ? archiveAt === null || archiveAt === undefined
        ? task.due_at
        : Math.min(task.due_at, archiveAt)
      : archiveAt;
    if (dueAt === null || dueAt === undefined) {
      await this.ctx.storage.deleteAlarm();
    } else {
      await this.ctx.storage.setAlarm(dueAt);
    }
  }

  public async initialize(input: InitializeRoomInput): Promise<RoomSnapshot> {
    const now = input.now ?? Date.now();
    if (input.characters.length === 0 || input.targetIds.length === 0) {
      throw new Error("题库不能为空");
    }
    this.ctx.storage.transactionSync(() => {
      if (this.metaOrNull()) return;
      this.sql.exec(
        `INSERT INTO room_meta
           (singleton, room_id, code, match_format, ranked, state, round_number,
            consecutive_draws, pool_json, target_ids_json, revision, created_at,
            archive_status, archive_attempts)
         VALUES (1, ?, ?, ?, ?, 'waiting', 0, 0, ?, ?, 0, ?, 'none', 0)`,
        input.roomId,
        input.code,
        input.format,
        input.ranked ? 1 : 0,
        JSON.stringify(input.characters),
        JSON.stringify(input.targetIds),
        now,
      );
      this.insertPlayer(0, input.owner);
      if (input.opponent) {
        this.insertPlayer(1, input.opponent);
        this.startRound(now);
      }
    });
    await this.rearmAlarm();
    return this.snapshotSync(input.owner.userId);
  }

  private insertPlayer(seat: number, participant: InitializeRoomInput["owner"]): void {
    this.sql.exec(
      `INSERT INTO players
         (seat, player_id, display_name, score, guesses_used, connected,
          reconnect_pause_used, rating, ranked_matches)
       VALUES (?, ?, ?, 0, 0, 1, 0, ?, ?)`,
      seat,
      participant.userId,
      participant.displayName,
      participant.rating,
      participant.rankedMatches,
    );
  }

  public async join(input: JoinRoomInput): Promise<RoomCommandResult> {
    const now = input.now ?? Date.now();
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const existing = this.player(input.participant.userId);
      if (existing) {
        this.sql.exec("UPDATE players SET connected = 1 WHERE player_id = ?", existing.player_id);
        return;
      }
      const meta = this.meta();
      if (meta.state !== "waiting") {
        code = "ROOM_FULL";
        return;
      }
      const players = this.players();
      if (players.length >= 2) {
        code = "ROOM_FULL";
        return;
      }
      this.insertPlayer(1, input.participant);
      this.startRound(now);
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(input.participant.userId) };
  }

  public async snapshot(playerId: string, now = Date.now()): Promise<RoomCommandResult> {
    let isMember = false;
    const changed = this.ctx.storage.transactionSync(() => {
      const advanced = this.advanceSync(now);
      isMember = this.player(playerId) !== null;
      return advanced;
    });
    await this.rearmAlarm();
    if (changed) await this.broadcastSnapshots();
    if (!isMember) return { ok: false, code: "ROOM_NOT_FOUND" };
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  public async guess(
    playerId: string,
    characterId: string,
    actionId: string = crypto.randomUUID(),
    now = Date.now(),
  ): Promise<RoomCommandResult> {
    if (actionId.length === 0 || actionId.length > 128) {
      return { ok: false, code: "VALIDATION_FAILED" };
    }
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player) {
        code = "FORBIDDEN";
        return;
      }
      this.sql.exec(
        "DELETE FROM guess_rate_events WHERE player_id = ? AND occurred_at <= ?",
        playerId,
        now - GUESS_RATE_WINDOW_MS,
      );
      const recentAttempts =
        this.sql
          .exec<{ count: number }>(
            "SELECT COUNT(*) AS count FROM guess_rate_events WHERE player_id = ?",
            playerId,
          )
          .toArray()[0]?.count ?? 0;
      if (recentAttempts >= GUESS_RATE_LIMIT) {
        code = "RATE_LIMITED";
        return;
      }
      this.sql.exec(
        "INSERT INTO guess_rate_events (event_id, player_id, occurred_at) VALUES (?, ?, ?)",
        crypto.randomUUID(),
        playerId,
        now,
      );

      const cached = this.sql
        .exec<{ response_json: string }>(
          "SELECT response_json FROM processed_actions WHERE player_id = ? AND action_id = ?",
          playerId,
          actionId,
        )
        .toArray()[0];
      if (cached) {
        const response = JSON.parse(cached.response_json) as { code?: ErrorCode };
        code = response.code ?? null;
        return;
      }

      const meta = this.meta();
      if (meta.state !== "playing") {
        code = "ROOM_NOT_PLAYING";
      } else if (player.guesses_used >= MULTIPLAYER_ATTEMPTS) {
        code = "GAME_ATTEMPTS_EXHAUSTED";
      } else {
        const duplicate = this.sql
          .exec<{ value: number }>(
            `SELECT 1 AS value FROM guesses
             WHERE round_number = ? AND seat = ? AND character_id = ?`,
            meta.round_number,
            player.seat,
            characterId,
          )
          .toArray()[0];
        if (duplicate) {
          code = "GAME_DUPLICATE_GUESS";
        } else {
          const pool = JSON.parse(meta.pool_json) as Character[];
          const character = pool.find((entry) => entry.id === characterId);
          const target = meta.target_json ? (JSON.parse(meta.target_json) as Character) : null;
          if (!character || !target) {
            code = "NOT_FOUND";
          } else {
            const ordinal = player.guesses_used + 1;
            const result = createGuessResult(target, character, new Date(now));
            this.sql.exec(
              `INSERT INTO guesses
                 (round_number, seat, ordinal, character_id, result_json, guessed_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              meta.round_number,
              player.seat,
              ordinal,
              characterId,
              JSON.stringify(result),
              now,
            );
            this.sql.exec(
              "UPDATE players SET guesses_used = ? WHERE seat = ?",
              ordinal,
              player.seat,
            );
            if (result.isCorrect) {
              this.settleRound(player.seat, now);
            } else if (ordinal >= MULTIPLAYER_ATTEMPTS) {
              const opponent = this.players().find((entry) => entry.seat !== player.seat);
              if (opponent && opponent.guesses_used >= MULTIPLAYER_ATTEMPTS) {
                this.settleRound(null, now);
              }
            }
          }
        }
      }
      this.sql.exec(
        `INSERT INTO processed_actions (player_id, action_id, response_json, created_at)
         VALUES (?, ?, ?, ?)`,
        playerId,
        actionId,
        JSON.stringify(code ? { code } : { ok: true }),
        now,
      );
      this.sql.exec(
        "DELETE FROM processed_actions WHERE created_at < ?",
        now - 24 * 60 * 60 * 1_000,
      );
      this.sql.exec(
        `DELETE FROM processed_actions
         WHERE player_id = ? AND action_id IN (
           SELECT action_id FROM processed_actions
           WHERE player_id = ?
           ORDER BY created_at DESC, action_id DESC
           LIMIT -1 OFFSET ?
         )`,
        playerId,
        playerId,
        PROCESSED_ACTION_LIMIT,
      );
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  public async disconnect(playerId: string, now = Date.now()): Promise<void> {
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player || player.connected === 0) return;
      this.sql.exec("UPDATE players SET connected = 0 WHERE player_id = ?", playerId);
      const meta = this.meta();
      if (meta.state !== "playing") return;
      if (player.reconnect_pause_used === 1) {
        const opponent = this.players().find((entry) => entry.seat !== player.seat);
        this.finish(opponent?.player_id ?? null, "disconnect", now);
        return;
      }
      this.pauseForSeat(player.seat, now, Math.max(0, (meta.round_ends_at ?? now) - now), meta);
    });
    await this.rearmAlarm();
    await this.broadcastSnapshots();
  }

  public async reconnect(playerId: string, now = Date.now()): Promise<RoomCommandResult> {
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player) {
        code = "FORBIDDEN";
        return;
      }
      const meta = this.meta();
      if (meta.state === "finished" && meta.finish_reason === "disconnect") {
        code = "ROOM_RECONNECT_EXPIRED";
        return;
      }
      this.sql.exec("UPDATE players SET connected = 1 WHERE player_id = ?", playerId);
      if (meta.state === "paused" && meta.paused_seat === player.seat) {
        const endsAt = now + (meta.paused_remaining_ms ?? 0);
        const revision = meta.revision + 1;
        this.sql.exec(
          `UPDATE room_meta SET
             state = 'playing', round_ends_at = ?, reconnect_deadline = NULL,
             paused_seat = NULL, paused_remaining_ms = NULL, revision = ?
           WHERE singleton = 1`,
          endsAt,
          revision,
        );
        this.deleteTask("reconnect");
        this.enqueueTask("round", "round-timeout", endsAt, revision, {
          roundNumber: meta.round_number,
        });
        const otherDisconnected = this.players().find(
          (entry) => entry.player_id !== playerId && entry.connected === 0,
        );
        if (otherDisconnected) {
          const resumed = this.meta();
          if (otherDisconnected.reconnect_pause_used === 1) {
            this.finish(playerId, "disconnect", now);
          } else {
            this.pauseForSeat(
              otherDisconnected.seat,
              now,
              Math.max(0, (resumed.round_ends_at ?? now) - now),
              resumed,
            );
          }
        }
      }
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  public async leave(playerId: string, now = Date.now()): Promise<boolean> {
    let left = false;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player) return;
      left = true;
      const meta = this.meta();
      if (meta.state === "waiting") {
        this.finish(null, "cancelled", now);
      } else if (meta.state !== "finished") {
        const opponent = this.players().find((entry) => entry.seat !== player.seat);
        this.finish(opponent?.player_id ?? null, "left", now);
      }
      this.sql.exec("UPDATE players SET connected = 0 WHERE player_id = ?", playerId);
    });
    await this.rearmAlarm();
    await this.broadcastSnapshots();
    return left;
  }

  private async archiveIfDue(now: number): Promise<void> {
    const meta = this.meta();
    if (
      meta.archive_status === "purge-pending" &&
      meta.archive_next_at !== null &&
      meta.archive_next_at <= now
    ) {
      for (const socket of this.ctx.getWebSockets()) socket.close(1000, "room-expired");
      this.ctx.storage.transactionSync(() => {
        this.sql.exec("DELETE FROM guesses");
        this.sql.exec("DELETE FROM rounds");
        this.sql.exec("DELETE FROM players");
        this.sql.exec("DELETE FROM processed_actions");
        this.sql.exec("DELETE FROM guess_rate_events");
        this.sql.exec("DELETE FROM clock_tasks");
        this.sql.exec(
          `UPDATE room_meta SET
             target_json = NULL, pool_json = '[]', target_ids_json = '[]',
             archive_status = 'purged', archive_next_at = NULL
           WHERE singleton = 1`,
        );
      });
      return;
    }
    if (
      meta.archive_status !== "pending" ||
      meta.archive_next_at === null ||
      meta.archive_next_at > now
    ) {
      return;
    }
    const players = this.players();
    const rounds = this.sql.exec<RoundRow>("SELECT * FROM rounds ORDER BY round_number").toArray();
    const guesses = this.sql
      .exec<GuessRow>("SELECT * FROM guesses ORDER BY round_number, seat, ordinal")
      .toArray();
    const ratingAfter = new Map(players.map((player) => [player.player_id, player.rating]));
    if (meta.ranked === 1 && meta.winner_id && players.length === 2) {
      const winner = players.find((player) => player.player_id === meta.winner_id);
      const loser = players.find((player) => player.player_id !== meta.winner_id);
      if (winner && loser) {
        const rating = calculateElo(
          winner.rating,
          loser.rating,
          winner.ranked_matches,
          loser.ranked_matches,
        );
        ratingAfter.set(winner.player_id, rating.winnerRating);
        ratingAfter.set(loser.player_id, rating.loserRating);
      }
    }
    const completedAt = meta.completed_at ?? now;
    const statements: D1PreparedStatement[] = [
      this.env.DB.prepare(
        `INSERT OR IGNORE INTO matches
           (id, room_code, match_format, ranked, winner_user_id, finish_reason,
            created_at, started_at, completed_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        meta.room_id,
        meta.code,
        meta.match_format,
        meta.ranked,
        meta.winner_id,
        meta.finish_reason ?? "cancelled",
        meta.created_at,
        meta.started_at ?? meta.created_at,
        completedAt,
        now,
      ),
    ];
    for (const player of players) {
      const after = ratingAfter.get(player.player_id) ?? player.rating;
      statements.push(
        this.env.DB.prepare(
          `INSERT OR IGNORE INTO match_players
             (match_id, user_id, seat, display_name, score, rating_before, rating_after)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          meta.room_id,
          player.player_id,
          player.seat,
          player.display_name,
          player.score,
          player.rating,
          after,
        ),
      );
      if (meta.ranked === 1 && players.length === 2) {
        statements.push(
          this.env.DB.prepare(
            `INSERT OR IGNORE INTO rating_events
               (id, match_id, user_id, rating_before, rating_after, delta, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            crypto.randomUUID(),
            meta.room_id,
            player.player_id,
            player.rating,
            after,
            after - player.rating,
            completedAt,
          ),
        );
      }
    }
    for (const round of rounds) {
      statements.push(
        this.env.DB.prepare(
          `INSERT OR IGNORE INTO match_rounds
             (match_id, round_number, target_character_id, winner_user_id, started_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(
          meta.room_id,
          round.round_number,
          round.target_character_id,
          round.winner_id,
          round.started_at,
          round.completed_at ?? completedAt,
        ),
      );
    }
    for (const guess of guesses) {
      const player = players.find((entry) => entry.seat === guess.seat);
      if (!player) continue;
      statements.push(
        this.env.DB.prepare(
          `INSERT OR IGNORE INTO match_guesses
             (match_id, round_number, user_id, ordinal, character_id, result_json, guessed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          meta.room_id,
          guess.round_number,
          player.player_id,
          guess.ordinal,
          guess.character_id,
          guess.result_json,
          guess.guessed_at,
        ),
      );
    }
    statements.push(
      this.env.DB.prepare(
        "UPDATE room_directory SET state = 'finished', expires_at = ? WHERE room_id = ?",
      ).bind(now + ROOM_PURGE_DELAY_MS, meta.room_id),
    );
    try {
      await this.env.DB.batch(statements);
      this.sql.exec(
        `UPDATE room_meta SET
           archive_status = 'purge-pending', archive_next_at = ?
         WHERE singleton = 1`,
        now + ROOM_PURGE_DELAY_MS,
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "room-archive-failed",
          roomId: meta.room_id,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      const attempts = meta.archive_attempts + 1;
      const delay = Math.min(60 * 60 * 1_000, 2 ** Math.min(attempts, 10) * 1_000);
      this.sql.exec(
        `UPDATE room_meta SET
           archive_attempts = ?, archive_next_at = ?
         WHERE singleton = 1`,
        attempts,
        now + delay,
      );
    }
  }

  public override async alarm(): Promise<void> {
    const now = Date.now();
    const changed = this.ctx.storage.transactionSync(() => this.advanceSync(now));
    await this.archiveIfDue(now);
    await this.rearmAlarm();
    if (changed) await this.broadcastSnapshots();
  }

  private socketPlayer(webSocket: WebSocket): string | null {
    const attachment = webSocket.deserializeAttachment() as SocketAttachment | null;
    return attachment?.playerId ?? null;
  }

  private sendSocketError(webSocket: WebSocket, code: string): void {
    webSocket.send(JSON.stringify({ type: "error", code, requestId: crypto.randomUUID() }));
  }

  private async broadcastSnapshots(): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      const playerId = this.socketPlayer(socket);
      if (!playerId) continue;
      try {
        socket.send(JSON.stringify({ type: "snapshot", snapshot: this.snapshotSync(playerId) }));
      } catch {
        socket.close(1011, "snapshot-failed");
      }
    }
  }

  public override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const playerId = request.headers.get("x-fireflydle-player-id");
    if (!playerId || !this.player(playerId)) return new Response("Not Found", { status: 404 });
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ playerId } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server, [playerId]);
    const result = await this.reconnect(playerId);
    if (result.ok) {
      server.send(JSON.stringify({ type: "snapshot", snapshot: result.snapshot }));
    } else {
      this.sendSocketError(server, result.code);
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  public override async webSocketMessage(
    webSocket: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    const playerId = this.socketPlayer(webSocket);
    if (!playerId || typeof message !== "string") {
      this.sendSocketError(webSocket, "VALIDATION_FAILED");
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(message);
    } catch {
      this.sendSocketError(webSocket, "VALIDATION_FAILED");
      return;
    }
    const parsed = ClientRoomMessageSchema.safeParse(raw);
    if (!parsed.success) {
      this.sendSocketError(webSocket, "VALIDATION_FAILED");
      return;
    }
    const clientMessage: ClientRoomMessage = parsed.data;
    if (clientMessage.type === "ping") {
      webSocket.send(JSON.stringify({ type: "pong", sentAt: clientMessage.sentAt }));
    } else if (clientMessage.type === "guess") {
      const actionId =
        typeof raw === "object" && raw && "actionId" in raw && typeof raw.actionId === "string"
          ? raw.actionId
          : crypto.randomUUID();
      const result = await this.guess(playerId, clientMessage.characterId, actionId);
      if (!result.ok) this.sendSocketError(webSocket, result.code);
    } else if (clientMessage.type === "leave") {
      await this.leave(playerId);
      webSocket.close(1000, "left");
    } else {
      webSocket.send(JSON.stringify({ type: "snapshot", snapshot: this.snapshotSync(playerId) }));
    }
  }

  public override async webSocketClose(
    webSocket: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    const playerId = this.socketPlayer(webSocket);
    if (!playerId) return;
    const stillConnected = this.ctx
      .getWebSockets(playerId)
      .some((socket) => socket !== webSocket && socket.readyState === WebSocket.OPEN);
    if (!stillConnected) await this.disconnect(playerId);
  }

  public override webSocketError(webSocket: WebSocket): void {
    webSocket.close(1011, "socket-error");
  }
}
