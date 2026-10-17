import type {
  Character,
  ErrorCode,
  GameEntitySummary,
  GuessCell,
  GuessResult,
  PartyConfiguration,
  PartyPlayer,
  PartyReaction,
  PartyRoundResult,
  PartySnapshot,
  PartyState,
  ServerPartyMessage,
} from "@fireflydle/contracts";
import {
  ClientPartyMessageSchema,
  DEFAULT_PARTY_CONFIGURATION,
  PARTY_MAX_PLAYERS,
  partyRoundPoints,
} from "@fireflydle/contracts";
import {
  createAeonGuessResult,
  createCurrencyWarsGuessResult,
  createGuessResultWithRules,
  DEFAULT_SNAPSHOT_FIELD_RULES,
} from "@fireflydle/game-engine";
import { DurableObject } from "cloudflare:workers";
import type { MultiplayerContentSnapshot } from "../domain/multiplayer";
import { loadMultiplayerContentSnapshot } from "../services/multiplayer-content";

/** 派对房：2–8 人同一题同时猜，多回合累计积分，不计 Elo、不写入 games 表。 */

const COUNTDOWN_MS = 3_000;
const ROUND_ENDED_MS = 6_000;
/** 全员离线后等待多久回收房间（清理 SQLite 行，DO 可被后续 initialize 复用） */
const EMPTY_ROOM_GRACE_MS = 60_000;
const GUESS_RATE_WINDOW_MS = 60_000;
const GUESS_RATE_LIMIT = 60;
const REACTION_INTERVAL_MS = 1_000;
const PROCESSED_ACTION_LIMIT = 256;

type PartyTaskKind = "countdown" | "round-timeout" | "next-round" | "cleanup";

interface PartyMetaRow extends Record<string, SqlStorageValue> {
  singleton: number;
  party_id: string;
  code: string;
  state: PartyState;
  round_number: number;
  host_player_id: string;
  mode_id: PartyConfiguration["modeId"];
  rounds: PartyConfiguration["rounds"];
  round_time_seconds: number | null;
  max_attempts: PartyConfiguration["maxAttempts"];
  countdown_ends_at: number | null;
  round_starts_at: number | null;
  round_ends_at: number | null;
  next_round_at: number | null;
  target_json: string | null;
  pool_json: string;
  target_ids_json: string;
  field_rules_json: string;
  pool_rule_version: string;
  manifest_version: string;
  revision: number;
  created_at: number;
}

interface PartyPlayerRow extends Record<string, SqlStorageValue> {
  seat: number;
  player_id: string;
  display_name: string;
  is_host: number;
  connected: number;
  score: number;
  round_status: PartyPlayer["roundStatus"];
  guesses_used: number;
  solved_at_ms: number | null;
  solve_rank: number | null;
  round_points: number;
  joined_at: number;
  last_reaction_at: number;
}

interface PartyGuessRow extends Record<string, SqlStorageValue> {
  round_number: number;
  seat: number;
  ordinal: number;
  character_id: string;
  result_json: string;
  guessed_at: number;
}

interface PartyRoundRow extends Record<string, SqlStorageValue> {
  round_number: number;
  target_character_id: string;
  started_at: number;
  completed_at: number | null;
  result_json: string | null;
}

interface PartyTaskRow extends Record<string, SqlStorageValue> {
  task_key: string;
  kind: PartyTaskKind;
  due_at: number;
  generation: number;
  payload_json: string;
}

interface SocketAttachment {
  playerId: string;
}

export interface PartyParticipantInput {
  playerId: string;
  displayName: string;
}

export interface InitializePartyInput {
  partyId: string;
  code: string;
  configuration?: PartyConfiguration;
  host: PartyParticipantInput;
  contentSnapshot: MultiplayerContentSnapshot;
  now?: number;
}

export interface JoinPartyInput {
  player: PartyParticipantInput;
  now?: number;
}

export type PartyCommandResult =
  { ok: true; snapshot: PartySnapshot } | { ok: false; code: ErrorCode };

export interface PartyPreview {
  configuration: PartyConfiguration;
  state: PartyState;
  playerCount: number;
  hostDisplayName: string;
}

export class PartyRoom extends DurableObject<Env> {
  private readonly sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS party_meta (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          party_id TEXT NOT NULL,
          code TEXT NOT NULL,
          state TEXT NOT NULL,
          round_number INTEGER NOT NULL,
          host_player_id TEXT NOT NULL,
          mode_id TEXT NOT NULL,
          rounds INTEGER NOT NULL,
          round_time_seconds INTEGER,
          max_attempts INTEGER NOT NULL,
          countdown_ends_at INTEGER,
          round_starts_at INTEGER,
          round_ends_at INTEGER,
          next_round_at INTEGER,
          target_json TEXT,
          pool_json TEXT NOT NULL,
          target_ids_json TEXT NOT NULL,
          field_rules_json TEXT NOT NULL,
          pool_rule_version TEXT NOT NULL,
          manifest_version TEXT NOT NULL,
          revision INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS party_players (
          seat INTEGER PRIMARY KEY,
          player_id TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          is_host INTEGER NOT NULL DEFAULT 0,
          connected INTEGER NOT NULL DEFAULT 1,
          score INTEGER NOT NULL DEFAULT 0,
          round_status TEXT NOT NULL DEFAULT 'spectating',
          guesses_used INTEGER NOT NULL DEFAULT 0,
          solved_at_ms INTEGER,
          solve_rank INTEGER,
          round_points INTEGER NOT NULL DEFAULT 0,
          joined_at INTEGER NOT NULL,
          last_reaction_at INTEGER NOT NULL DEFAULT 0
        ) STRICT;
        CREATE TABLE IF NOT EXISTS party_rounds (
          round_number INTEGER PRIMARY KEY,
          target_character_id TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          completed_at INTEGER,
          result_json TEXT
        ) STRICT;
        CREATE TABLE IF NOT EXISTS party_guesses (
          round_number INTEGER NOT NULL,
          seat INTEGER NOT NULL,
          ordinal INTEGER NOT NULL,
          character_id TEXT NOT NULL,
          result_json TEXT NOT NULL,
          guessed_at INTEGER NOT NULL,
          PRIMARY KEY (round_number, seat, ordinal),
          UNIQUE (round_number, seat, character_id)
        ) STRICT;
        CREATE TABLE IF NOT EXISTS party_kicked (
          player_id TEXT PRIMARY KEY,
          kicked_at INTEGER NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS party_tasks (
          task_key TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          due_at INTEGER NOT NULL,
          generation INTEGER NOT NULL,
          payload_json TEXT NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS party_processed_actions (
          player_id TEXT NOT NULL,
          action_id TEXT NOT NULL,
          response_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (player_id, action_id)
        ) STRICT;
        CREATE INDEX IF NOT EXISTS party_players_seat_idx ON party_players (seat);
        CREATE INDEX IF NOT EXISTS party_guesses_round_idx ON party_guesses (round_number, seat);
        CREATE INDEX IF NOT EXISTS party_tasks_due_idx ON party_tasks (due_at);
        CREATE INDEX IF NOT EXISTS party_processed_actions_created_idx ON party_processed_actions (created_at);
      `);
    });
  }

  /** 创建派对（幂等，重复调用返回既有快照），创建者为主持人 */
  public async initialize(input: InitializePartyInput): Promise<PartySnapshot> {
    const now = input.now ?? Date.now();
    const configuration = input.configuration ?? DEFAULT_PARTY_CONFIGURATION;
    if (configuration.modeId !== input.contentSnapshot.modeId) {
      throw new Error("派对配置的模式与内容快照不一致");
    }
    if (
      input.contentSnapshot.targetIds.length === 0 ||
      Object.keys(input.contentSnapshot.candidateSnapshots).length === 0
    ) {
      throw new Error("派对题库不能为空");
    }
    this.ctx.storage.transactionSync(() => {
      if (this.metaOrNull()) return;
      this.sql.exec(
        `INSERT INTO party_meta (
           singleton, party_id, code, state, round_number, host_player_id, mode_id, rounds,
           round_time_seconds, max_attempts, countdown_ends_at, round_starts_at, round_ends_at,
           next_round_at, target_json, pool_json, target_ids_json, field_rules_json,
           pool_rule_version, manifest_version, revision, created_at
         ) VALUES (1, ?, ?, 'lobby', 0, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, 0, ?)`,
        input.partyId,
        input.code,
        input.host.playerId,
        configuration.modeId,
        configuration.rounds,
        configuration.roundTimeSeconds,
        configuration.maxAttempts,
        JSON.stringify(input.contentSnapshot.candidateSnapshots),
        JSON.stringify(input.contentSnapshot.targetIds),
        JSON.stringify(input.contentSnapshot.fieldRules),
        input.contentSnapshot.poolRuleVersion,
        input.contentSnapshot.manifestVersion,
        now,
      );
      this.insertPlayer(input.host, now, true);
    });
    return this.snapshotSync(input.host.playerId);
  }

  /** 按玩家加入（HTTP 入房入口）；老成员视为重连 */
  public async join(input: JoinPartyInput): Promise<PartyCommandResult> {
    const now = input.now ?? Date.now();
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const meta = this.metaOrNull();
      if (!meta) {
        code = "ROOM_NOT_FOUND";
        return;
      }
      if (this.isKicked(input.player.playerId)) {
        code = "FORBIDDEN";
        return;
      }
      const existing = this.player(input.player.playerId);
      if (existing) {
        if (existing.connected === 0) {
          this.sql.exec(
            "UPDATE party_players SET connected = 1 WHERE player_id = ?",
            existing.player_id,
          );
          this.deleteTask("cleanup");
          this.ensureHost();
        }
        return;
      }
      const count = this.sql
        .exec<{ count: number }>("SELECT COUNT(*) AS count FROM party_players")
        .toArray()[0]?.count;
      if ((count ?? 0) >= PARTY_MAX_PLAYERS) {
        code = "ROOM_FULL";
        return;
      }
      this.insertPlayer(input.player, now, false);
      this.deleteTask("cleanup");
      this.ensureHost();
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(input.player.playerId) };
  }

  /** 房间预览（大厅展示房主、人数、配置）；房间已被回收时返回 null */
  public async preview(now = Date.now()): Promise<PartyPreview | null> {
    const changed = this.ctx.storage.transactionSync(() => this.advanceSync(now));
    await this.rearmAlarm();
    if (changed) await this.broadcastSnapshots();
    const meta = this.metaOrNull();
    if (!meta) return null;
    const players = this.players();
    const host = players.find((player) => player.is_host === 1);
    return {
      configuration: this.configuration(meta),
      state: meta.state,
      playerCount: players.length,
      hostDisplayName: host?.display_name ?? "",
    };
  }

  /** 成员校验 + 快照；非成员返回 ROOM_NOT_FOUND（WS 升级路由用它鉴权） */
  public async snapshot(playerId: string, now = Date.now()): Promise<PartyCommandResult> {
    const changed = this.ctx.storage.transactionSync(() => this.advanceSync(now));
    await this.rearmAlarm();
    if (changed) await this.broadcastSnapshots();
    if (!this.metaOrNull() || !this.player(playerId)) {
      return { ok: false, code: "ROOM_NOT_FOUND" };
    }
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** 提交一次猜测；同一 actionId 重复提交直接返回缓存结果 */
  public async guess(
    playerId: string,
    characterId: string,
    actionId: string = crypto.randomUUID(),
    now = Date.now(),
  ): Promise<PartyCommandResult> {
    if (actionId.length === 0 || actionId.length > 128) {
      return { ok: false, code: "VALIDATION_FAILED" };
    }
    let code: ErrorCode | null = null;
    let cached: PartyCommandResult | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const meta = this.metaOrNull();
      const player = this.player(playerId);
      if (!meta || !player) {
        code = "ROOM_NOT_FOUND";
        return;
      }
      const cachedRow = this.sql
        .exec<{ response_json: string }>(
          "SELECT response_json FROM party_processed_actions WHERE player_id = ? AND action_id = ?",
          playerId,
          actionId,
        )
        .toArray()[0];
      if (cachedRow) {
        cached = JSON.parse(cachedRow.response_json) as PartyCommandResult;
        return;
      }
      // 猜测限流：同一玩家一分钟内最多 GUESS_RATE_LIMIT 次（复用 party_guesses 时间戳）
      const recent = this.sql
        .exec<{ count: number }>(
          "SELECT COUNT(*) AS count FROM party_guesses WHERE seat = ? AND guessed_at > ?",
          player.seat,
          now - GUESS_RATE_WINDOW_MS,
        )
        .toArray()[0]?.count;
      if ((recent ?? 0) >= GUESS_RATE_LIMIT) {
        code = "RATE_LIMITED";
        return;
      }
      if (meta.state !== "playing") {
        code = "ROOM_NOT_PLAYING";
        return;
      }
      // 次数用尽（含已 failed）优先返回，比“不在猜测中”更精确
      if (player.guesses_used >= meta.max_attempts) {
        code = "GAME_ATTEMPTS_EXHAUSTED";
        return;
      }
      if (player.round_status !== "guessing") {
        code = "ROOM_NOT_PLAYING";
        return;
      }
      const duplicate = this.sql
        .exec<{ value: number }>(
          "SELECT 1 AS value FROM party_guesses WHERE round_number = ? AND seat = ? AND character_id = ?",
          meta.round_number,
          player.seat,
          characterId,
        )
        .toArray()[0];
      if (duplicate) {
        code = "GAME_DUPLICATE_GUESS";
        return;
      }
      const pool = this.pool(meta);
      const character = pool[characterId];
      const target = meta.target_json
        ? (JSON.parse(meta.target_json) as GameEntitySummary & Record<string, unknown>)
        : null;
      if (!character || !target) {
        code = "NOT_FOUND";
        return;
      }
      const ordinal = player.guesses_used + 1;
      const result = this.buildGuessResult(meta, target, character, now);
      this.sql.exec(
        `INSERT INTO party_guesses (round_number, seat, ordinal, character_id, result_json, guessed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        meta.round_number,
        player.seat,
        ordinal,
        characterId,
        JSON.stringify(result),
        now,
      );
      this.sql.exec(
        "UPDATE party_players SET guesses_used = ? WHERE player_id = ?",
        ordinal,
        playerId,
      );
      if (result.isCorrect) {
        // 名次按服务器收到正确猜测的先后，本轮已猜中人数 + 1
        const solvedBefore = this.sql
          .exec<{ count: number }>(
            "SELECT COUNT(*) AS count FROM party_players WHERE round_status = 'solved'",
          )
          .toArray()[0]?.count;
        const solveRank = (solvedBefore ?? 0) + 1;
        const solvedAtMs = Math.max(0, now - (meta.round_starts_at ?? now));
        const points = partyRoundPoints({
          solved: true,
          guessesUsed: ordinal,
          maxAttempts: meta.max_attempts,
          solveRank,
        });
        this.sql.exec(
          `UPDATE party_players
             SET round_status = 'solved', solved_at_ms = ?, solve_rank = ?, round_points = ?, score = score + ?
           WHERE player_id = ?`,
          solvedAtMs,
          solveRank,
          points,
          points,
          playerId,
        );
      } else if (ordinal >= meta.max_attempts) {
        this.sql.exec(
          "UPDATE party_players SET round_status = 'failed' WHERE player_id = ?",
          playerId,
        );
      }
      this.rememberAction(
        playerId,
        actionId,
        { ok: true, snapshot: this.snapshotSync(playerId) },
        now,
      );
      this.maybeSettleRound(now);
    });
    await this.rearmAlarm();
    if (cached) return cached;
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** 主持人踢人：被踢者断开连接且不能再进入本房间 */
  public async kick(
    playerId: string,
    targetPlayerId: string,
    now = Date.now(),
  ): Promise<PartyCommandResult> {
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const host = this.player(playerId);
      const target = this.player(targetPlayerId);
      if (!host || host.is_host !== 1 || !target || target.is_host === 1) {
        code = "FORBIDDEN";
        return;
      }
      // 先通知再断开，避免被踢玩家还留在房间里
      for (const socket of this.ctx.getWebSockets(targetPlayerId)) {
        try {
          socket.send(JSON.stringify({ type: "kicked" } satisfies ServerPartyMessage));
        } catch {
          // 连接已断开，忽略
        }
        try {
          socket.close(1000, "kicked");
        } catch {
          // 连接已断开，忽略
        }
      }
      this.sql.exec("DELETE FROM party_players WHERE player_id = ?", targetPlayerId);
      this.sql.exec(
        "INSERT OR REPLACE INTO party_kicked (player_id, kicked_at) VALUES (?, ?)",
        targetPlayerId,
        now,
      );
      this.ensureHost();
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** 表情广播：每人每秒最多 1 次，超限静默丢弃 */
  public async react(playerId: string, reaction: PartyReaction, now = Date.now()): Promise<void> {
    let allowed = false;
    this.ctx.storage.transactionSync(() => {
      const player = this.player(playerId);
      if (!player) return;
      if (now - player.last_reaction_at < REACTION_INTERVAL_MS) return;
      this.sql.exec(
        "UPDATE party_players SET last_reaction_at = ? WHERE player_id = ?",
        now,
        playerId,
      );
      allowed = true;
    });
    if (!allowed) return;
    const message = JSON.stringify({
      type: "reaction",
      playerId,
      reaction,
      at: now,
    } satisfies ServerPartyMessage);
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        // 连接已断开，忽略
      }
    }
  }

  /** 主动离开：删除玩家行，房间空了进入回收倒计时 */
  public async leave(playerId: string, now = Date.now()): Promise<boolean> {
    let left = false;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player) return;
      left = true;
      this.sql.exec("DELETE FROM party_players WHERE player_id = ?", playerId);
      this.ensureHost();
      this.scheduleCleanupIfEmpty(now);
    });
    await this.rearmAlarm();
    if (left) await this.broadcastSnapshots();
    return left;
  }

  /** 房主开始游戏：进入 3 秒倒计时 */
  public async start(playerId: string, now = Date.now()): Promise<PartyCommandResult> {
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const meta = this.metaOrNull();
      const player = this.player(playerId);
      if (!meta || !player) {
        code = "ROOM_NOT_FOUND";
        return;
      }
      if (player.is_host !== 1) {
        code = "FORBIDDEN";
        return;
      }
      if (meta.state !== "lobby") {
        code = "FORBIDDEN";
        return;
      }
      const endsAt = now + COUNTDOWN_MS;
      const revision = meta.revision + 1;
      this.sql.exec(
        `UPDATE party_meta
           SET state = 'countdown', countdown_ends_at = ?, round_starts_at = NULL, round_ends_at = NULL,
               next_round_at = NULL, target_json = NULL, revision = ?
         WHERE singleton = 1`,
        endsAt,
        revision,
      );
      this.deleteTask("round");
      this.deleteTask("next-round");
      this.enqueueTask("countdown", "countdown", endsAt, revision, {});
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** 房主跳过 round-ended 的等待，立即进入下一回合或结束 */
  public async next(playerId: string, now = Date.now()): Promise<PartyCommandResult> {
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const meta = this.metaOrNull();
      const player = this.player(playerId);
      if (!meta || !player) {
        code = "ROOM_NOT_FOUND";
        return;
      }
      if (player.is_host !== 1 || meta.state !== "round-ended") {
        code = "FORBIDDEN";
        return;
      }
      this.advanceRound(now);
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** 房主再来一局：回大厅，分数与历史清空 */
  public async rematch(playerId: string, now = Date.now()): Promise<PartyCommandResult> {
    let code: ErrorCode | null = null;
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const meta = this.metaOrNull();
      const player = this.player(playerId);
      if (!meta || !player) {
        code = "ROOM_NOT_FOUND";
        return;
      }
      if (player.is_host !== 1 || meta.state !== "finished") {
        code = "FORBIDDEN";
        return;
      }
      this.resetToLobby(meta.revision + 1);
    });
    await this.rearmAlarm();
    if (code) return { ok: false, code };
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** 房主在大厅调整配置；切换模式时重新加载题库 */
  public async configure(
    playerId: string,
    configuration: PartyConfiguration,
  ): Promise<PartyCommandResult> {
    const meta = this.metaOrNull();
    if (!meta) return { ok: false, code: "ROOM_NOT_FOUND" };
    const player = this.player(playerId);
    if (!player) return { ok: false, code: "FORBIDDEN" };
    if (player.is_host !== 1) return { ok: false, code: "FORBIDDEN" };
    if (meta.state !== "lobby") return { ok: false, code: "FORBIDDEN" };
    let contentSnapshot: MultiplayerContentSnapshot | null = null;
    if (configuration.modeId !== meta.mode_id) {
      contentSnapshot = await loadMultiplayerContentSnapshot(this.env.DB, configuration.modeId);
      if (!contentSnapshot) return { ok: false, code: "INTERNAL_ERROR" };
    }
    this.ctx.storage.transactionSync(() => {
      if (contentSnapshot) {
        this.sql.exec(
          `UPDATE party_meta
             SET mode_id = ?, pool_json = ?, target_ids_json = ?, field_rules_json = ?,
                 pool_rule_version = ?, manifest_version = ?
           WHERE singleton = 1`,
          configuration.modeId,
          JSON.stringify(contentSnapshot.candidateSnapshots),
          JSON.stringify(contentSnapshot.targetIds),
          JSON.stringify(contentSnapshot.fieldRules),
          contentSnapshot.poolRuleVersion,
          contentSnapshot.manifestVersion,
        );
      }
      this.sql.exec(
        "UPDATE party_meta SET rounds = ?, round_time_seconds = ?, max_attempts = ?, revision = revision + 1 WHERE singleton = 1",
        configuration.rounds,
        configuration.roundTimeSeconds,
        configuration.maxAttempts,
      );
    });
    await this.rearmAlarm();
    await this.broadcastSnapshots();
    return { ok: true, snapshot: this.snapshotSync(playerId) };
  }

  /** WebSocket 升级：身份由路由通过 x-fireflydle-player-id 头透传 */
  public override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const playerId = request.headers.get("x-fireflydle-player-id");
    if (!playerId) return new Response("Not Found", { status: 404 });
    if (!this.metaOrNull()) return new Response("Not Found", { status: 404 });
    if (this.isKicked(playerId)) return new Response("Forbidden", { status: 403 });
    if (!this.player(playerId)) return new Response("Not Found", { status: 404 });
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ playerId } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server, [playerId]);
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      if (this.player(playerId)?.connected === 0) {
        this.sql.exec("UPDATE party_players SET connected = 1 WHERE player_id = ?", playerId);
      }
      this.deleteTask("cleanup");
      this.ensureHost();
    });
    await this.rearmAlarm();
    try {
      await this.broadcastSnapshots();
    } catch {
      // 快照构造失败时断开新连接，不影响其他玩家
      try {
        server.close(1011, "snapshot-failed");
      } catch {
        // 连接已断开，忽略
      }
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
    const parsed = ClientPartyMessageSchema.safeParse(raw);
    if (!parsed.success) {
      this.sendSocketError(webSocket, "VALIDATION_FAILED");
      return;
    }
    const clientMessage = parsed.data;
    switch (clientMessage.type) {
      case "ping":
        webSocket.send(
          JSON.stringify({
            type: "pong",
            sentAt: clientMessage.sentAt,
          } satisfies ServerPartyMessage),
        );
        return;
      case "react":
        await this.react(playerId, clientMessage.reaction);
        return;
      case "leave":
        await this.leave(playerId);
        webSocket.close(1000, "left");
        return;
      case "configure": {
        const result = await this.configure(playerId, clientMessage.configuration);
        if (!result.ok) this.sendSocketError(webSocket, result.code);
        return;
      }
      case "start": {
        const result = await this.start(playerId);
        if (!result.ok) this.sendSocketError(webSocket, result.code);
        return;
      }
      case "guess": {
        const actionId =
          raw &&
          typeof raw === "object" &&
          "actionId" in raw &&
          typeof (raw as { actionId?: unknown }).actionId === "string"
            ? (raw as { actionId: string }).actionId
            : crypto.randomUUID();
        const result = await this.guess(playerId, clientMessage.characterId, actionId);
        if (!result.ok) this.sendSocketError(webSocket, result.code);
        return;
      }
      case "next": {
        const result = await this.next(playerId);
        if (!result.ok) this.sendSocketError(webSocket, result.code);
        return;
      }
      case "rematch": {
        const result = await this.rematch(playerId);
        if (!result.ok) this.sendSocketError(webSocket, result.code);
        return;
      }
      case "kick": {
        const result = await this.kick(playerId, clientMessage.playerId);
        if (!result.ok) this.sendSocketError(webSocket, result.code);
        return;
      }
      default:
        this.sendSocketError(webSocket, "VALIDATION_FAILED");
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
    // 同一玩家可能开了多个标签页，只有全部关闭才视为离线
    for (const socket of this.ctx.getWebSockets(playerId)) {
      if (socket.readyState === WebSocket.OPEN) return;
    }
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player || player.connected === 0) return;
      this.sql.exec("UPDATE party_players SET connected = 0 WHERE player_id = ?", playerId);
      this.ensureHost();
      this.scheduleCleanupIfEmpty(now);
    });
    await this.rearmAlarm();
    await this.broadcastSnapshots();
  }

  public override async webSocketError(webSocket: WebSocket): Promise<void> {
    // 出错与关闭走同一套离线逻辑
    const playerId = this.socketPlayer(webSocket);
    if (!playerId) return;
    for (const socket of this.ctx.getWebSockets(playerId)) {
      if (socket !== webSocket && socket.readyState === WebSocket.OPEN) return;
    }
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.advanceSync(now);
      const player = this.player(playerId);
      if (!player || player.connected === 0) return;
      this.sql.exec("UPDATE party_players SET connected = 0 WHERE player_id = ?", playerId);
      this.ensureHost();
      this.scheduleCleanupIfEmpty(now);
    });
    await this.rearmAlarm();
    await this.broadcastSnapshots();
  }

  public override async alarm(): Promise<void> {
    const now = Date.now();
    const changed = this.ctx.storage.transactionSync(() => this.advanceSync(now));
    await this.rearmAlarm();
    if (changed) await this.broadcastSnapshots();
  }

  // ---------- 内部工具 ----------

  private socketPlayer(webSocket: WebSocket): string | null {
    try {
      const attachment = webSocket.deserializeAttachment() as SocketAttachment | null;
      return attachment?.playerId ?? null;
    } catch {
      return null;
    }
  }

  private sendSocketError(webSocket: WebSocket, code: string): void {
    try {
      webSocket.send(
        JSON.stringify({
          type: "error",
          code,
          requestId: crypto.randomUUID(),
        } satisfies ServerPartyMessage),
      );
    } catch {
      // 连接已断开，忽略
    }
  }

  private metaOrNull(): PartyMetaRow | null {
    return (
      this.sql.exec<PartyMetaRow>("SELECT * FROM party_meta WHERE singleton = 1").toArray()[0] ??
      null
    );
  }

  private meta(): PartyMetaRow {
    const meta = this.metaOrNull();
    if (!meta) throw new Error("派对不存在或已被回收");
    return meta;
  }

  private players(): PartyPlayerRow[] {
    return this.sql.exec<PartyPlayerRow>("SELECT * FROM party_players ORDER BY seat").toArray();
  }

  private player(playerId: string): PartyPlayerRow | null {
    return (
      this.sql
        .exec<PartyPlayerRow>("SELECT * FROM party_players WHERE player_id = ?", playerId)
        .toArray()[0] ?? null
    );
  }

  private isKicked(playerId: string): boolean {
    return Boolean(
      this.sql
        .exec<{ value: number }>(
          "SELECT 1 AS value FROM party_kicked WHERE player_id = ?",
          playerId,
        )
        .toArray()[0],
    );
  }

  private configuration(meta: PartyMetaRow): PartyConfiguration {
    return {
      modeId: meta.mode_id,
      rounds: meta.rounds,
      roundTimeSeconds: meta.round_time_seconds as PartyConfiguration["roundTimeSeconds"],
      maxAttempts: meta.max_attempts,
    };
  }

  private pool(meta: PartyMetaRow): Record<string, GameEntitySummary & Record<string, unknown>> {
    return JSON.parse(meta.pool_json) as Record<
      string,
      GameEntitySummary & Record<string, unknown>
    >;
  }

  private fieldRules(meta: PartyMetaRow) {
    const encoded = JSON.parse(meta.field_rules_json) as { rules?: unknown };
    if (!Array.isArray(encoded.rules) || encoded.rules.length === 0) {
      return DEFAULT_SNAPSHOT_FIELD_RULES;
    }
    return encoded.rules as typeof DEFAULT_SNAPSHOT_FIELD_RULES;
  }

  private buildGuessResult(
    meta: PartyMetaRow,
    target: GameEntitySummary & Record<string, unknown>,
    character: GameEntitySummary & Record<string, unknown>,
    now: number,
  ): GuessResult {
    const guessedAt = new Date(now);
    if (meta.mode_id === "currency-wars") {
      return createCurrencyWarsGuessResult(target as never, character as never, guessedAt);
    }
    if (meta.mode_id === "aeon") {
      return createAeonGuessResult(target as never, character as never, guessedAt);
    }
    return createGuessResultWithRules(
      target as Character,
      character as Character,
      this.fieldRules(meta),
      guessedAt,
    );
  }

  private insertPlayer(participant: PartyParticipantInput, now: number, isHost: boolean): void {
    const seat =
      this.sql
        .exec<{ next: number }>("SELECT COALESCE(MAX(seat), -1) + 1 AS next FROM party_players")
        .toArray()[0]?.next ?? 0;
    this.sql.exec(
      `INSERT INTO party_players (seat, player_id, display_name, is_host, connected, score,
         round_status, guesses_used, round_points, joined_at, last_reaction_at)
       VALUES (?, ?, ?, ?, 1, 0, 'spectating', 0, 0, ?, 0)`,
      seat,
      participant.playerId,
      participant.displayName,
      isHost ? 1 : 0,
      now,
    );
  }

  /** 从本局还没出过的答案里随机抽一个（同局不重复，题目做完才允许重复） */
  private selectTarget(meta: PartyMetaRow): GameEntitySummary & Record<string, unknown> {
    const pool = this.pool(meta);
    const used = new Set(
      this.sql
        .exec<{ target_character_id: string }>("SELECT target_character_id FROM party_rounds")
        .toArray()
        .map((row) => row.target_character_id),
    );
    const available = meta.target_ids_json
      ? (JSON.parse(meta.target_ids_json) as string[]).filter(
          (id) => !used.has(id) && Boolean(pool[id]),
        )
      : [];
    if (available.length === 0) throw new Error("题库答案已用尽");
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const targetId = available[(random[0] ?? 0) % available.length];
    const target = targetId ? pool[targetId] : undefined;
    if (!target) throw new Error("题库答案缺失");
    return target;
  }

  private enqueueTask(
    taskKey: string,
    kind: PartyTaskKind,
    dueAt: number,
    generation: number,
    payload: Record<string, unknown> = {},
  ): void {
    this.sql.exec(
      `INSERT INTO party_tasks (task_key, kind, due_at, generation, payload_json) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (task_key) DO UPDATE SET kind = excluded.kind, due_at = excluded.due_at,
         generation = excluded.generation, payload_json = excluded.payload_json`,
      taskKey,
      kind,
      dueAt,
      generation,
      JSON.stringify(payload),
    );
  }

  private deleteTask(taskKey: string): void {
    this.sql.exec("DELETE FROM party_tasks WHERE task_key = ?", taskKey);
  }

  /** 推进到期的时钟任务；返回是否有状态变化（决定是否广播快照） */
  private advanceSync(now: number): boolean {
    let changed = false;
    for (;;) {
      const task = this.sql
        .exec<PartyTaskRow>(
          "SELECT * FROM party_tasks WHERE due_at <= ? ORDER BY due_at LIMIT 1",
          now,
        )
        .toArray()[0];
      if (!task) break;
      this.deleteTask(task.task_key);
      const meta = this.metaOrNull();
      if (!meta) continue;
      // 任务入队后发生过的状态转换会让旧任务失效
      if (task.generation !== meta.revision) continue;
      if (task.kind === "round-timeout") {
        this.settleRound(now);
      } else if (task.kind === "next-round") {
        this.advanceRound(now);
      } else if (task.kind === "countdown") {
        this.startRound(now);
      } else if (task.kind === "cleanup") {
        this.purgeRoom();
      }
      changed = true;
    }
    return changed;
  }

  private startRound(now: number): void {
    const meta = this.meta();
    if (meta.state !== "countdown" && meta.state !== "round-ended") return;
    const target = this.selectTarget(meta);
    const roundNumber = meta.round_number + 1;
    const endsAt = meta.round_time_seconds === null ? null : now + meta.round_time_seconds * 1_000;
    const revision = meta.revision + 1;
    this.sql.exec(
      `UPDATE party_meta
         SET state = 'playing', round_number = ?, round_starts_at = ?, round_ends_at = ?,
             next_round_at = NULL, countdown_ends_at = NULL, target_json = ?, revision = ?
       WHERE singleton = 1`,
      roundNumber,
      now,
      endsAt,
      JSON.stringify(target),
      revision,
    );
    // 所有在场玩家都参与本回合（含中途加入后重新开始的回合）
    this.sql.exec(
      `UPDATE party_players
         SET round_status = 'guessing', guesses_used = 0, solved_at_ms = NULL, solve_rank = NULL, round_points = 0`,
    );
    this.sql.exec("DELETE FROM party_guesses WHERE round_number = ?", roundNumber);
    this.sql.exec(
      "INSERT INTO party_rounds (round_number, target_character_id, started_at) VALUES (?, ?, ?)",
      roundNumber,
      target.id,
      now,
    );
    this.deleteTask("next-round");
    this.deleteTask("countdown");
    if (endsAt === null) {
      this.deleteTask("round");
    } else {
      this.enqueueTask("round", "round-timeout", endsAt, revision, { round: roundNumber });
    }
  }

  private settleRound(now: number): void {
    const meta = this.meta();
    if (meta.state !== "playing") return;
    // 超时未猜中的玩家记 failed
    this.sql.exec(
      "UPDATE party_players SET round_status = 'failed' WHERE round_status = 'guessing'",
    );
    const target = meta.target_json ? (JSON.parse(meta.target_json) as GameEntitySummary) : null;
    if (!target) throw new Error("回合缺少答案");
    const placements = this.players()
      .filter((player) => player.round_status !== "spectating")
      .map((player) => ({
        playerId: player.player_id,
        solved: player.round_status === "solved",
        guessesUsed: player.guesses_used,
        solvedAtMs: player.solved_at_ms,
        points: player.round_points,
      }));
    const result: PartyRoundResult = { round: meta.round_number, answer: target, placements };
    this.sql.exec(
      "UPDATE party_rounds SET completed_at = ?, result_json = ? WHERE round_number = ?",
      now,
      JSON.stringify(result),
      meta.round_number,
    );
    this.deleteTask("round");
    const revision = meta.revision + 1;
    const nextRoundAt = now + ROUND_ENDED_MS;
    this.sql.exec(
      `UPDATE party_meta
         SET state = 'round-ended', round_ends_at = NULL, next_round_at = ?, revision = ?
       WHERE singleton = 1`,
      nextRoundAt,
      revision,
    );
    this.enqueueTask("next-round", "next-round", nextRoundAt, revision, {
      round: meta.round_number,
    });
  }

  /** 参与本回合且仍在猜的玩家全都结束了才提前结算 */
  private maybeSettleRound(now: number): void {
    const meta = this.meta();
    if (meta.state !== "playing") return;
    const pending = this.players().some(
      (player) => player.connected === 1 && player.round_status === "guessing",
    );
    if (pending) return;
    this.settleRound(now);
  }

  private advanceRound(now: number): void {
    const meta = this.meta();
    if (meta.state !== "round-ended") return;
    this.deleteTask("next-round");
    if (meta.round_number >= meta.rounds) {
      this.finish();
      return;
    }
    this.startRound(now);
  }

  private finish(): void {
    const meta = this.meta();
    if (meta.state === "finished") return;
    this.sql.exec(
      `UPDATE party_meta
         SET state = 'finished', round_ends_at = NULL, next_round_at = NULL, round_starts_at = NULL,
             countdown_ends_at = NULL, revision = revision + 1
       WHERE singleton = 1`,
    );
    this.deleteTask("round");
    this.deleteTask("next-round");
    this.deleteTask("countdown");
  }

  private resetToLobby(revision: number): void {
    this.sql.exec(
      `UPDATE party_meta
         SET state = 'lobby', round_number = 0, round_starts_at = NULL, round_ends_at = NULL,
             next_round_at = NULL, countdown_ends_at = NULL, target_json = NULL, revision = ?
       WHERE singleton = 1`,
      revision,
    );
    this.sql.exec(
      `UPDATE party_players
         SET score = 0, round_status = 'spectating', guesses_used = 0, solved_at_ms = NULL,
             solve_rank = NULL, round_points = 0`,
    );
    this.sql.exec("DELETE FROM party_rounds");
    this.sql.exec("DELETE FROM party_guesses");
    this.deleteTask("round");
    this.deleteTask("next-round");
    this.deleteTask("countdown");
  }

  private scheduleCleanupIfEmpty(now: number): void {
    const hasConnected = this.players().some((player) => player.connected === 1);
    if (hasConnected) {
      this.deleteTask("cleanup");
      return;
    }
    this.enqueueTask("cleanup", "cleanup", now + EMPTY_ROOM_GRACE_MS, this.meta().revision);
  }

  /** 房间空了：断开残留连接并清空数据，DO 之后可被重新 initialize 复用 */
  private purgeRoom(): void {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.close(1000, "party-expired");
      } catch {
        // 连接已断开，忽略
      }
    }
    this.sql.exec("DELETE FROM party_guesses");
    this.sql.exec("DELETE FROM party_rounds");
    this.sql.exec("DELETE FROM party_players");
    this.sql.exec("DELETE FROM party_kicked");
    this.sql.exec("DELETE FROM party_processed_actions");
    this.sql.exec("DELETE FROM party_tasks");
    this.sql.exec("DELETE FROM party_meta");
  }

  /** 主持人掉线/离开时转交给最早加入且仍在线的玩家 */
  private ensureHost(): void {
    const players = this.players();
    const host = players.find((player) => player.is_host === 1);
    if (host && host.connected === 1) return;
    const successor = players.find((player) => player.connected === 1);
    if (!successor) return;
    this.sql.exec("UPDATE party_players SET is_host = 0 WHERE is_host = 1");
    this.sql.exec("UPDATE party_players SET is_host = 1 WHERE player_id = ?", successor.player_id);
    this.sql.exec(
      "UPDATE party_meta SET host_player_id = ? WHERE singleton = 1",
      successor.player_id,
    );
  }

  private rememberAction(
    playerId: string,
    actionId: string,
    response: PartyCommandResult,
    now: number,
  ): void {
    this.sql.exec(
      `INSERT OR REPLACE INTO party_processed_actions (player_id, action_id, response_json, created_at)
       VALUES (?, ?, ?, ?)`,
      playerId,
      actionId,
      JSON.stringify(response),
      now,
    );
    // 只保留最近 PROCESSED_ACTION_LIMIT 条幂等记录
    const overflow = this.sql
      .exec<{ created_at: number }>(
        "SELECT created_at FROM party_processed_actions ORDER BY created_at DESC LIMIT 1 OFFSET ?",
        PROCESSED_ACTION_LIMIT,
      )
      .toArray()[0];
    if (overflow) {
      this.sql.exec(
        "DELETE FROM party_processed_actions WHERE created_at <= ?",
        overflow.created_at,
      );
    }
  }

  private async rearmAlarm(): Promise<void> {
    const dueAt = this.sql
      .exec<{ due_at: number }>("SELECT MIN(due_at) AS due_at FROM party_tasks")
      .toArray()[0]?.due_at;
    if (typeof dueAt === "number") {
      await this.ctx.storage.setAlarm(dueAt);
      return;
    }
    await this.ctx.storage.deleteAlarm();
  }

  private async broadcastSnapshots(): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      const playerId = this.socketPlayer(socket);
      if (!playerId || !this.player(playerId)) continue;
      try {
        socket.send(
          JSON.stringify({
            type: "snapshot",
            snapshot: this.snapshotSync(playerId),
          } satisfies ServerPartyMessage),
        );
      } catch {
        // 连接已断开，忽略
      }
    }
  }

  /** 按接收者定制的快照：ownGuesses 只给自己，其他玩家只见反馈颜色 */
  private snapshotSync(playerId: string): PartySnapshot {
    const meta = this.meta();
    const players = this.players();
    const self = players.find((player) => player.player_id === playerId);
    if (!self) throw new Error("玩家不在派对中");
    const guesses = this.sql
      .exec<PartyGuessRow>(
        "SELECT * FROM party_guesses WHERE round_number = ? ORDER BY seat, ordinal",
        meta.round_number,
      )
      .toArray();
    const feedbackBySeat = new Map<number, GuessCell[][]>();
    const ownGuesses: GuessResult[] = [];
    for (const guess of guesses) {
      const result = JSON.parse(guess.result_json) as GuessResult;
      if (guess.seat === self.seat) {
        ownGuesses.push(result);
        continue;
      }
      const feedback = feedbackBySeat.get(guess.seat) ?? [];
      feedback.push(result.cells);
      feedbackBySeat.set(guess.seat, feedback);
    }
    const history = this.sql
      .exec<PartyRoundRow>(
        "SELECT * FROM party_rounds WHERE result_json IS NOT NULL ORDER BY round_number",
      )
      .toArray()
      .map((row) => JSON.parse(row.result_json as string) as PartyRoundResult);
    const host = players.find((player) => player.is_host === 1);
    const roundStartsAt =
      meta.state === "countdown"
        ? meta.countdown_ends_at
        : meta.state === "playing" || meta.state === "round-ended"
          ? meta.round_starts_at
          : null;
    return {
      partyId: meta.party_id,
      code: meta.code,
      selfPlayerId: playerId,
      hostPlayerId: host?.player_id ?? meta.host_player_id,
      configuration: this.configuration(meta),
      state: meta.state,
      round: meta.round_number,
      roundStartsAt,
      roundEndsAt: meta.state === "playing" ? meta.round_ends_at : null,
      nextRoundAt: meta.state === "round-ended" ? meta.next_round_at : null,
      players: players.map<PartyPlayer>((player) => ({
        playerId: player.player_id,
        displayName: player.display_name,
        isHost: player.is_host === 1,
        connected: player.connected === 1,
        score: player.score,
        roundStatus: player.round_status,
        guessesUsed: player.guesses_used,
        solvedAtMs: player.solved_at_ms,
        solveRank: player.solve_rank,
        roundPoints: player.round_points,
        feedback: feedbackBySeat.get(player.seat) ?? [],
      })),
      ownGuesses,
      roundAnswer:
        (meta.state === "round-ended" || meta.state === "finished") && meta.target_json
          ? (JSON.parse(meta.target_json) as GameEntitySummary)
          : null,
      history,
    };
  }
}
