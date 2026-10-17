import {
  DEFAULT_PARTY_CONFIGURATION,
  PARTY_MAX_PLAYERS,
  PARTY_REACTIONS,
  ServerPartyMessageSchema,
  type Character,
  type PartyApiResponse,
  type PartyConfiguration,
  type PartyPreviewResponse,
  type PartySnapshot,
  type ServerPartyMessage,
} from "@fireflydle/contracts";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { aeonEntities } from "@fireflydle/game-data";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayableMultiplayerContentSnapshot } from "../src/services/multiplayer-content";

const COUNTDOWN_MS = 3_000;
const ROUND_ENDED_MS = 6_000;

/** 派对 DO 桩类型：RPC 返回值会被 workerd 包一层，直接用推断类型最稳 */
type PartyStub = ReturnType<typeof env.PARTY_ROOM.getByName>;
type PartyOutcome = Awaited<ReturnType<PartyStub["guess"]>>;

/** aeon 静态题库按清单顺序出题，配合下面的随机数 mock 后答案恒定 */
const AEON_ANSWER_ID = aeonEntities[0]?.id ?? "aeon-aha";
const AEON_SECOND_ANSWER_ID = aeonEntities[1]?.id ?? "aeon-ena";
const AEON_THIRD_ANSWER_ID = aeonEntities[2]?.id ?? "aeon-fuli";
/** 前三回合答案之外的角色，猜它一定是错的 */
const AEON_WRONG_ID = aeonEntities[3]?.id ?? "aeon-hooh";

function makeCharacter(
  id: string,
  element: Character["element"],
  path: Character["path"],
): Character {
  return {
    id,
    officialId: `${id}-official`,
    baseCharacterId: id,
    names: { "zh-CN": `角色${id}`, en: `Character ${id}`, ja: `キャラ${id}` },
    aliases: { "zh-CN": [], en: [], ja: [] },
    element,
    path,
    rarity: 5,
    factionId: "stellaron-hunters",
    factionGroupId: "stellaron-hunters",
    releaseVersionId: "2.3",
    releaseOrder: 10,
    assets: {
      avatarPath: `/assets/characters/${id}-avatar.webp`,
      portraitPath: `/assets/characters/${id}-portrait.webp`,
      sourceUrl: "https://hsr.hoyoverse.com/",
      sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
      sha256: "0".repeat(64),
      rightsNotice: "测试数据",
    },
    enabled: true,
    targetEligible: true,
    sourceRevision: "test",
  };
}

const answerOne = makeCharacter("party-answer-one", "fire", "destruction");
const answerTwo = makeCharacter("party-answer-two", "ice", "preservation");
const decoyOne = makeCharacter("party-decoy-one", "lightning", "harmony");
const decoyTwo = makeCharacter("party-decoy-two", "wind", "abundance");
const decoyThree = makeCharacter("party-decoy-three", "imaginary", "erudition");
const decoyFour = makeCharacter("party-decoy-four", "quantum", "nihility");
const decoyFive = makeCharacter("party-decoy-five", "physical", "remembrance");
const decoySix = makeCharacter("party-decoy-six", "fire", "abundance");

/** 给普通模式题库塞两个角色，供走 HTTP 创建派对使用 */
async function seedPlayablePool(): Promise<void> {
  const now = Date.now();
  for (const target of [answerOne, answerTwo]) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO characters
         (id, official_id, base_character_id, element, path, rarity, faction_id,
          faction_group_id, release_version_id, release_order, enabled, target_eligible,
          source_revision, payload_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`,
    )
      .bind(
        target.id,
        target.officialId,
        target.baseCharacterId,
        target.element,
        target.path,
        target.rarity,
        target.factionId,
        target.factionGroupId,
        target.releaseVersionId,
        target.releaseOrder,
        target.sourceRevision,
        JSON.stringify(target),
        now,
        now,
      )
      .run();
  }
}

/** 让抽题恒定取题库第一个未用答案，同时不影响 uuid / 房间码的随机性 */
function mockDeterministicDraw(): void {
  let fill = 1;
  vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
    if (array instanceof Uint32Array) {
      array[0] = 0;
      return array;
    }
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = fill % 256;
      fill += 1;
    }
    return array;
  });
}

interface SessionData {
  expiresAt: string;
  user: { id: string; displayName: string; hasEmail: boolean; emailVerified: boolean };
}

async function dataOf<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) throw new Error("非法 API 响应");
  const record = payload as Record<string, unknown>;
  if (record.ok !== true || !("data" in record)) throw new Error("非成功 API 响应");
  return record.data as T;
}

async function createSession(suffix: string): Promise<{ cookie: string; data: SessionData }> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", {
    method: "POST",
    headers: { "cf-connecting-ip": `test:party:${suffix}` },
  });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少 session cookie");
  return { cookie, data: await dataOf<SessionData>(response) };
}

/** 缓冲式 WebSocket 侦听器：避免漏掉广播中的中间消息 */
class SocketTap {
  private readonly queue: unknown[] = [];
  private readonly waiters: ((value: unknown) => void)[] = [];

  public constructor(public readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const parsed: unknown = JSON.parse(String(event.data));
      const waiter = this.waiters.shift();
      if (waiter) waiter(parsed);
      else this.queue.push(parsed);
    });
  }

  public next(): Promise<unknown> {
    const queued = this.queue.shift();
    if (queued !== undefined) return Promise.resolve(queued);
    return new Promise((resolve, reject) => {
      this.waiters.push(resolve);
      this.socket.addEventListener("error", () => reject(new Error("WebSocket 接收失败")), {
        once: true,
      });
    });
  }

  public drain(): unknown[] {
    return this.queue.splice(0, this.queue.length);
  }

  public async nextMessage(): Promise<ServerPartyMessage> {
    return ServerPartyMessageSchema.parse(await this.next());
  }

  public async nextSnapshot(
    predicate: (snapshot: PartySnapshot) => boolean,
  ): Promise<PartySnapshot> {
    for (;;) {
      const message = await this.nextMessage();
      if (message.type === "snapshot" && predicate(message.snapshot)) return message.snapshot;
    }
  }

  public async nextOfType<TType extends ServerPartyMessage["type"]>(
    type: TType,
  ): Promise<Extract<ServerPartyMessage, { type: TType }>> {
    for (;;) {
      const message = await this.nextMessage();
      if (message.type === type) return message as Extract<ServerPartyMessage, { type: TType }>;
    }
  }
}

async function connectPartySocket(cookie: string, partyId: string): Promise<SocketTap> {
  const response = await SELF.fetch(`https://fireflydle.games/api/parties/${partyId}/ws`, {
    headers: { cookie, upgrade: "websocket" },
  });
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  if (!socket) throw new Error("缺少 WebSocket");
  socket.accept();
  return new SocketTap(socket);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createParty(
  cookie: string,
  body: Record<string, unknown> = {},
): Promise<{ status: number; payload: PartyApiResponse }> {
  const response = await SELF.fetch("https://fireflydle.games/api/parties", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ ok: false }));
  const record = payload as Record<string, unknown>;
  return { status: response.status, payload: record.data as PartyApiResponse };
}

async function joinParty(
  cookie: string,
  code: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await SELF.fetch("https://fireflydle.games/api/parties/join", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** 直接把派对 DO 拉起来，用自定义题库和显式时间驱动状态机 */
async function bootstrapParty(options: {
  now: number;
  rounds?: PartyConfiguration["rounds"];
  roundTimeSeconds?: PartyConfiguration["roundTimeSeconds"];
  maxAttempts?: PartyConfiguration["maxAttempts"];
}) {
  const partyId = crypto.randomUUID();
  const room = env.PARTY_ROOM.getByName(partyId);
  const hostId = crypto.randomUUID();
  const contentSnapshot = createPlayableMultiplayerContentSnapshot(
    [answerOne, answerTwo, decoyOne, decoyTwo, decoyThree, decoyFour, decoyFive, decoySix],
    [answerOne, answerTwo, decoyOne, decoyTwo],
  );
  await room.initialize({
    partyId,
    code: "PARTY",
    configuration: {
      modeId: "playable",
      rounds: options.rounds ?? 3,
      // 注意：null 表示不限时，不能用 ?? 合并
      roundTimeSeconds: options.roundTimeSeconds === undefined ? 90 : options.roundTimeSeconds,
      maxAttempts: options.maxAttempts ?? 6,
    },
    host: { playerId: hostId, displayName: "房主" },
    contentSnapshot,
    now: options.now,
  });
  return { partyId, room, hostId, contentSnapshot };
}

async function joinRigPlayer(
  room: PartyStub,
  displayName: string,
  now: number,
): Promise<{ playerId: string; result: PartyOutcome }> {
  const playerId = crypto.randomUUID();
  const result = await room.join({ player: { playerId, displayName }, now });
  return { playerId, result };
}

async function snapshotOf(room: PartyStub, playerId: string, now: number): Promise<PartySnapshot> {
  const result = await room.snapshot(playerId, now);
  if (!result.ok) throw new Error(`快照失败：${result.code}`);
  // workerd 的 RPC 返回类型会把 aeon 的 focus 元组放宽成 number[]，
  // 这里只是把桩推断类型对齐回契约类型，运行期数据一致（快照都过 zod 校验）
  return result.snapshot as PartySnapshot;
}

function playerById(snapshot: PartySnapshot, playerId: string) {
  const player = snapshot.players.find((entry) => entry.playerId === playerId);
  if (!player) throw new Error("快照缺少玩家");
  return player;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("派对房 Durable Object 状态机", () => {
  it("多回合计分、名次、提前结束、自动推进、结束与再来一局", async () => {
    mockDeterministicDraw();
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now, rounds: 3 });
    const second = await joinRigPlayer(room, "乙", now);
    const third = await joinRigPlayer(room, "丙", now);
    expect(second.result.ok).toBe(true);
    expect(third.result.ok).toBe(true);

    const lobby = await snapshotOf(room, hostId, now);
    expect(lobby.state).toBe("lobby");
    expect(lobby.round).toBe(0);
    expect(lobby.roundStartsAt).toBeNull();
    expect(lobby.roundEndsAt).toBeNull();
    expect(lobby.nextRoundAt).toBeNull();
    expect(lobby.players).toHaveLength(3);
    expect(lobby.players.every((player) => player.roundStatus === "spectating")).toBe(true);
    expect(lobby.history).toEqual([]);

    const started = await room.start(hostId, now);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.snapshot.state).toBe("countdown");
    expect(started.snapshot.roundStartsAt).toBe(now + COUNTDOWN_MS);

    // 倒计时任务到点后进入 playing
    const playing = await snapshotOf(room, hostId, now + COUNTDOWN_MS);
    expect(playing.state).toBe("playing");
    expect(playing.round).toBe(1);
    expect(playing.roundEndsAt).toBe(now + COUNTDOWN_MS + 90_000);
    expect(playing.roundAnswer).toBeNull();
    expect(playing.players.every((player) => player.roundStatus === "guessing")).toBe(true);

    // 乙第 1 个猜中：100 + 15×(6-1) + 50 = 225
    const secondSolved = await room.guess(second.playerId, answerOne.id, undefined, now + 3_500);
    expect(secondSolved.ok).toBe(true);
    // 丙先猜错再猜中：100 + 15×(6-2) + 30 = 190
    await room.guess(third.playerId, decoyOne.id, undefined, now + 4_000);
    await room.guess(third.playerId, answerOne.id, undefined, now + 4_500);
    // 房主最后猜中：100 + 15×(6-1) + 15 = 190
    const hostSolved = await room.guess(hostId, answerOne.id, undefined, now + 5_000);
    expect(hostSolved.ok).toBe(true);

    // 全员猜中 → 立即结算，无需等 roundEndsAt
    const ended = await snapshotOf(room, hostId, now + 5_100);
    expect(ended.state).toBe("round-ended");
    expect(ended.round).toBe(1);
    expect(ended.roundAnswer?.id).toBe(answerOne.id);
    expect(ended.nextRoundAt).toBe(now + 5_000 + ROUND_ENDED_MS);
    expect(ended.history).toHaveLength(1);
    expect(ended.history[0]?.round).toBe(1);
    expect(ended.history[0]?.answer.id).toBe(answerOne.id);
    const placements = ended.history[0]?.placements ?? [];
    expect(placements).toHaveLength(3);
    expect(placements.find((entry) => entry.playerId === second.playerId)).toMatchObject({
      solved: true,
      guessesUsed: 1,
      points: 225,
    });
    expect(placements.find((entry) => entry.playerId === third.playerId)).toMatchObject({
      solved: true,
      guessesUsed: 2,
      points: 190,
    });
    expect(placements.find((entry) => entry.playerId === hostId)).toMatchObject({
      solved: true,
      guessesUsed: 1,
      points: 190,
    });
    expect(playerById(ended, second.playerId).score).toBe(225);
    expect(playerById(ended, second.playerId).solveRank).toBe(1);

    // 6 秒后自动进入第 2 回合，答案不重复
    const roundTwoStart = now + 5_000 + ROUND_ENDED_MS;
    const roundTwo = await snapshotOf(room, hostId, roundTwoStart);
    expect(roundTwo.state).toBe("playing");
    expect(roundTwo.round).toBe(2);
    expect(roundTwo.roundAnswer).toBeNull();
    expect(roundTwo.players.every((player) => player.guessesUsed === 0)).toBe(true);

    // 第 2 回合超时结束：仍在猜的玩家全部记 failed
    const roundTwoEnd = roundTwoStart + 90_000 + 1;
    const roundTwoEnded = await snapshotOf(room, hostId, roundTwoEnd);
    expect(roundTwoEnded.state).toBe("round-ended");
    expect(roundTwoEnded.history).toHaveLength(2);
    expect(
      (roundTwoEnded.history[1]?.placements ?? []).every(
        (entry) => !entry.solved && entry.points === 0,
      ),
    ).toBe(true);
    expect(roundTwoEnded.players.every((player) => player.roundStatus === "failed")).toBe(true);
    expect(roundTwoEnded.roundAnswer?.id).toBe(answerTwo.id);

    // 第 3 回合：先自动开始，再超时结束
    const roundThreeStart = roundTwoEnd + ROUND_ENDED_MS;
    const roundThree = await snapshotOf(room, hostId, roundThreeStart);
    expect(roundThree.state).toBe("playing");
    expect(roundThree.round).toBe(3);
    const roundThreeEnd = roundThreeStart + 90_000 + 1;
    const roundThreeEnded = await snapshotOf(room, hostId, roundThreeEnd);
    expect(roundThreeEnded.state).toBe("round-ended");
    expect(roundThreeEnded.round).toBe(3);
    expect(roundThreeEnded.roundAnswer?.id).toBe(decoyOne.id);

    // rounds 用尽 → finished，答案仍然公开
    const finished = await snapshotOf(room, hostId, roundThreeEnd + ROUND_ENDED_MS);
    expect(finished.state).toBe("finished");
    expect(finished.roundAnswer?.id).toBe(decoyOne.id);
    expect(finished.history).toHaveLength(3);
    expect(finished.nextRoundAt).toBeNull();

    // 房主 rematch：回大厅、分数与历史清空
    const rematch = await room.rematch(hostId, roundThreeEnd + ROUND_ENDED_MS);
    expect(rematch.ok).toBe(true);
    if (!rematch.ok) return;
    expect(rematch.snapshot.state).toBe("lobby");
    expect(rematch.snapshot.round).toBe(0);
    expect(rematch.snapshot.history).toEqual([]);
    expect(rematch.snapshot.roundAnswer).toBeNull();
    expect(rematch.snapshot.players.every((player) => player.score === 0)).toBe(true);
  });

  it("不限时的回合只能等所有人猜中才结束", async () => {
    mockDeterministicDraw();
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({
      now,
      rounds: 3,
      roundTimeSeconds: null,
    });
    const second = await joinRigPlayer(room, "乙", now);
    await room.start(hostId, now);
    const playing = await snapshotOf(room, hostId, now + COUNTDOWN_MS);
    expect(playing.state).toBe("playing");
    expect(playing.roundEndsAt).toBeNull();

    // 只猜中一个，另一个还在猜 → 不结算
    await room.guess(second.playerId, answerOne.id, undefined, now + COUNTDOWN_MS + 1_000);
    const stillPlaying = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 2_000);
    expect(stillPlaying.state).toBe("playing");
    expect(stillPlaying.roundEndsAt).toBeNull();

    await room.guess(hostId, answerOne.id, undefined, now + COUNTDOWN_MS + 3_000);
    const ended = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 4_000);
    expect(ended.state).toBe("round-ended");
    expect(ended.nextRoundAt).toBe(now + COUNTDOWN_MS + 3_000 + ROUND_ENDED_MS);
  });

  it("回合进行中加入的玩家只能观战，下一回合才参加", async () => {
    mockDeterministicDraw();
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now, rounds: 3 });
    const second = await joinRigPlayer(room, "乙", now);
    await room.start(hostId, now);
    await snapshotOf(room, hostId, now + COUNTDOWN_MS);

    const late = await joinRigPlayer(room, "迟到的丙", now + COUNTDOWN_MS + 500);
    expect(late.result.ok).toBe(true);
    const withLate = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 600);
    expect(playerById(withLate, late.playerId).roundStatus).toBe("spectating");

    const rejected = await room.guess(
      late.playerId,
      answerOne.id,
      undefined,
      now + COUNTDOWN_MS + 700,
    );
    expect(rejected).toEqual({ ok: false, code: "ROOM_NOT_PLAYING" });

    await room.guess(second.playerId, answerOne.id, undefined, now + COUNTDOWN_MS + 800);
    await room.guess(hostId, answerOne.id, undefined, now + COUNTDOWN_MS + 900);
    const ended = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 1_000);
    expect(ended.state).toBe("round-ended");
    // 观战玩家不计入名次，也不拿分
    expect(ended.history[0]?.placements.map((entry) => entry.playerId)).not.toContain(
      late.playerId,
    );
    expect(playerById(ended, late.playerId).roundPoints).toBe(0);

    // 下一回合自动参加
    const roundTwo = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 1_000 + ROUND_ENDED_MS);
    expect(roundTwo.round).toBe(2);
    expect(playerById(roundTwo, late.playerId).roundStatus).toBe("guessing");
  });

  it("满 8 人后拒绝加入", async () => {
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now });
    for (let index = 0; index < PARTY_MAX_PLAYERS - 1; index += 1) {
      const joined = await joinRigPlayer(room, `玩家${index}`, now);
      expect(joined.result.ok).toBe(true);
    }
    const full = await snapshotOf(room, hostId, now);
    expect(full.players).toHaveLength(PARTY_MAX_PLAYERS);
    const overflow = await joinRigPlayer(room, "挤不进去的人", now);
    expect(overflow.result).toEqual({ ok: false, code: "ROOM_FULL" });
  });

  it("房主离开后转交给最早加入的在线玩家", async () => {
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now });
    const second = await joinRigPlayer(room, "乙", now);
    const third = await joinRigPlayer(room, "丙", now);

    const left = await room.leave(hostId, now);
    expect(left).toBe(true);
    const afterLeave = await snapshotOf(room, second.playerId, now);
    expect(afterLeave.players.map((player) => player.playerId)).not.toContain(hostId);
    expect(afterLeave.hostPlayerId).toBe(second.playerId);
    expect(playerById(afterLeave, second.playerId).isHost).toBe(true);
    expect(playerById(afterLeave, third.playerId).isHost).toBe(false);

    // 新房主可以开始游戏
    const started = await room.start(second.playerId, now);
    expect(started.ok).toBe(true);
    // 老房主已不在房间里
    expect(await room.start(hostId, now)).toEqual({ ok: false, code: "ROOM_NOT_FOUND" });
  });

  it("踢人后对方不能再进入本房间", async () => {
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now });
    const second = await joinRigPlayer(room, "乙", now);
    const third = await joinRigPlayer(room, "丙", now);

    // 不能踢房主自己，非房主也不能踢人
    expect(await room.kick(hostId, hostId, now)).toEqual({ ok: false, code: "FORBIDDEN" });
    expect(await room.kick(second.playerId, third.playerId, now)).toEqual({
      ok: false,
      code: "FORBIDDEN",
    });

    const kicked = await room.kick(hostId, second.playerId, now);
    expect(kicked.ok).toBe(true);
    if (!kicked.ok) return;
    expect(kicked.snapshot.players.map((player) => player.playerId)).not.toContain(second.playerId);
    expect(
      await room.join({ player: { playerId: second.playerId, displayName: "乙" }, now }),
    ).toEqual({ ok: false, code: "FORBIDDEN" });
    // 被踢玩家也不能再建 WebSocket
    expect(await room.snapshot(second.playerId, now)).toEqual({
      ok: false,
      code: "ROOM_NOT_FOUND",
    });
  });

  it("所有人离开后房间被回收，Durable Object 可重新初始化", async () => {
    const now = Date.now();
    const { partyId, room, hostId } = await bootstrapParty({ now });
    const second = await joinRigPlayer(room, "乙", now);
    expect(await room.leave(hostId, now)).toBe(true);
    expect(await room.leave(second.playerId, now)).toBe(true);

    // 超过回收宽限期后房间数据被清空
    expect(await room.snapshot(hostId, now + 60_001)).toEqual({
      ok: false,
      code: "ROOM_NOT_FOUND",
    });
    expect(await room.preview(now + 60_001)).toBeNull();

    // 同一个 DO 名可以重新 initialize（证明只是清数据而非删库）
    const contentSnapshot = createPlayableMultiplayerContentSnapshot([answerOne], [answerOne]);
    const freshHostId = crypto.randomUUID();
    const revived = await room.initialize({
      partyId,
      code: "PARTY",
      host: { playerId: freshHostId, displayName: "新房主" },
      contentSnapshot,
      now: now + 60_002,
    });
    expect(revived.state).toBe("lobby");
    expect(revived.players).toHaveLength(1);
    expect(revived.players[0]?.playerId).toBe(freshHostId);
  });

  it("只有房主能开始/跳过/再来一局，配置只能在大厅修改", async () => {
    mockDeterministicDraw();
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now, rounds: 3, roundTimeSeconds: 60 });
    const second = await joinRigPlayer(room, "乙", now);

    expect(await room.start(second.playerId, now)).toEqual({ ok: false, code: "FORBIDDEN" });
    expect(await room.next(hostId, now)).toEqual({ ok: false, code: "FORBIDDEN" });
    expect(await room.rematch(hostId, now)).toEqual({ ok: false, code: "FORBIDDEN" });
    expect(await room.guess(hostId, answerOne.id, undefined, now)).toEqual({
      ok: false,
      code: "ROOM_NOT_PLAYING",
    });

    // 大厅里可以改配置
    const configured = await room.configure(hostId, {
      modeId: "playable",
      rounds: 3,
      roundTimeSeconds: 60,
      maxAttempts: 6,
    });
    expect(configured.ok).toBe(true);
    if (!configured.ok) return;
    expect(configured.snapshot.configuration).toEqual({
      modeId: "playable",
      rounds: 3,
      roundTimeSeconds: 60,
      maxAttempts: 6,
    });
    // 非房主不能改配置
    expect(
      await room.configure(second.playerId, {
        modeId: "playable",
        rounds: 3,
        roundTimeSeconds: 60,
        maxAttempts: 6,
      }),
    ).toEqual({ ok: false, code: "FORBIDDEN" });

    await room.start(hostId, now);
    const playing = await snapshotOf(room, hostId, now + COUNTDOWN_MS);
    expect(playing.configuration.maxAttempts).toBe(6);
    expect(playing.roundEndsAt).toBe(now + COUNTDOWN_MS + 60_000);
    // 对局中不能改配置
    expect(
      await room.configure(hostId, {
        modeId: "playable",
        rounds: 3,
        roundTimeSeconds: 60,
        maxAttempts: 6,
      }),
    ).toEqual({ ok: false, code: "FORBIDDEN" });

    // 6 次错误猜测用尽次数 → failed，再猜被拒绝
    const wrongIds = [
      decoyOne.id,
      decoyTwo.id,
      decoyThree.id,
      decoyFour.id,
      decoyFive.id,
      decoySix.id,
    ];
    for (const [index, id] of wrongIds.entries()) {
      await room.guess(hostId, id, undefined, now + COUNTDOWN_MS + 1_000 + index * 10);
    }
    const failed = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 2_000);
    expect(playerById(failed, hostId).roundStatus).toBe("failed");
    expect(playerById(failed, hostId).guessesUsed).toBe(6);
    expect(await room.guess(hostId, answerOne.id, undefined, now + COUNTDOWN_MS + 3_000)).toEqual({
      ok: false,
      code: "GAME_ATTEMPTS_EXHAUSTED",
    });
  });

  it("猜测错误码与幂等重发", async () => {
    mockDeterministicDraw();
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now, rounds: 3 });
    const second = await joinRigPlayer(room, "乙", now);
    await room.start(hostId, now);
    await snapshotOf(room, hostId, now + COUNTDOWN_MS);

    expect(
      await room.guess(second.playerId, "不存在的角色", undefined, now + COUNTDOWN_MS),
    ).toEqual({
      ok: false,
      code: "NOT_FOUND",
    });
    const first = await room.guess(
      second.playerId,
      decoyOne.id,
      "action-1",
      now + COUNTDOWN_MS + 100,
    );
    expect(first.ok).toBe(true);
    // 同一 actionId 重发直接返回缓存结果，不重复计数
    const replayed = await room.guess(
      second.playerId,
      decoyOne.id,
      "action-1",
      now + COUNTDOWN_MS + 200,
    );
    expect(replayed).toEqual(first);
    // 换 actionId 再猜同一角色 → 重复猜测
    expect(
      await room.guess(second.playerId, decoyOne.id, "action-2", now + COUNTDOWN_MS + 300),
    ).toEqual({ ok: false, code: "GAME_DUPLICATE_GUESS" });
    const after = await snapshotOf(room, second.playerId, now + COUNTDOWN_MS + 400);
    expect(playerById(after, second.playerId).guessesUsed).toBe(1);
    expect(after.ownGuesses).toHaveLength(1);
    expect(after.ownGuesses[0]?.character.id).toBe(decoyOne.id);
  });

  it("切换模式时重新加载题库", async () => {
    const now = Date.now();
    const { room, hostId } = await bootstrapParty({ now, rounds: 3, roundTimeSeconds: 60 });
    const switched = await room.configure(hostId, {
      modeId: "aeon",
      rounds: 3,
      roundTimeSeconds: 60,
      maxAttempts: 6,
    });
    expect(switched.ok).toBe(true);
    if (!switched.ok) return;
    expect(switched.snapshot.configuration.modeId).toBe("aeon");

    await room.start(hostId, now);
    await snapshotOf(room, hostId, now + COUNTDOWN_MS);
    const ended = await snapshotOf(room, hostId, now + COUNTDOWN_MS + 60_001);
    expect(ended.state).toBe("round-ended");
    // 答案来自 aeon 静态题库
    expect(aeonEntities.some((entity) => entity.id === ended.roundAnswer?.id)).toBe(true);
    expect(ended.history[0]?.answer.id).toBe(ended.roundAnswer?.id);
  });
});

describe("派对房 HTTP 接口", () => {
  it("创建、加入、预览与默认配置", async () => {
    await seedPlayablePool();
    const host = await createSession("http-host");
    const guest = await createSession("http-guest");
    const created = await createParty(host.cookie);
    expect(created.status).toBe(201);
    expect(created.payload.partyId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(created.payload.code).toMatch(/^[A-HJ-NP-Z2-9]{5}$/u);

    const preview = await dataOf<PartyPreviewResponse>(
      await SELF.fetch(`https://fireflydle.games/api/parties/${created.payload.partyId}`, {
        headers: { cookie: guest.cookie },
      }),
    );
    expect(preview).toEqual({
      partyId: created.payload.partyId,
      code: created.payload.code,
      configuration: DEFAULT_PARTY_CONFIGURATION,
      state: "lobby",
      playerCount: 1,
      hostDisplayName: host.data.user.displayName,
    });

    const joined = await joinParty(guest.cookie, created.payload.code);
    expect(joined.status).toBe(200);
    expect(joined.body).toEqual({ ok: true, data: created.payload });
    const previewAfterJoin = await dataOf<PartyPreviewResponse>(
      await SELF.fetch(`https://fireflydle.games/api/parties/${created.payload.partyId}`, {
        headers: { cookie: guest.cookie },
      }),
    );
    expect(previewAfterJoin.playerCount).toBe(2);
  });

  it("拒绝非法请求、未登录与不存在的房间", async () => {
    const host = await createSession("http-validation");
    const anonymous = await SELF.fetch("https://fireflydle.games/api/parties", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(anonymous.status).toBe(401);

    const invalidBody = await SELF.fetch("https://fireflydle.games/api/parties", {
      method: "POST",
      headers: { cookie: host.cookie, "content-type": "application/json" },
      body: JSON.stringify({ rounds: 4 }),
    });
    expect(invalidBody.status).toBe(400);

    const invalidCode = await joinParty(host.cookie, "ABC");
    expect(invalidCode.status).toBe(400);

    const missing = await joinParty(host.cookie, "ZZZZZ");
    expect(missing.status).toBe(404);

    const missingPreview = await SELF.fetch(
      `https://fireflydle.games/api/parties/${crypto.randomUUID()}`,
      { headers: { cookie: host.cookie } },
    );
    expect(missingPreview.status).toBe(404);
  });

  it("满员后返回 ROOM_FULL，非成员无法建立 WebSocket", async () => {
    const host = await createSession("http-full-host");
    const created = await createParty(host.cookie, { modeId: "aeon", rounds: 3 });
    expect(created.status).toBe(201);
    const joiners = [];
    for (let index = 0; index < PARTY_MAX_PLAYERS - 1; index += 1) {
      joiners.push(await createSession(`http-full-${index}`));
    }
    for (const joiner of joiners) {
      expect((await joinParty(joiner.cookie, created.payload.code)).status).toBe(200);
    }
    const outsider = await createSession("http-full-outsider");
    const overflow = await joinParty(outsider.cookie, created.payload.code);
    expect(overflow.status).toBe(409);
    expect(overflow.body).toMatchObject({ ok: false, error: { code: "ROOM_FULL" } });

    // 未加入的用户连 WS 被拒
    const rejected = await SELF.fetch(
      `https://fireflydle.games/api/parties/${created.payload.partyId}/ws`,
      { headers: { cookie: outsider.cookie, upgrade: "websocket" } },
    );
    expect(rejected.status).toBe(404);
    // 已加入的用户可以连
    const firstJoiner = joiners[0];
    if (!firstJoiner) throw new Error("缺少加入者");
    const accepted = await connectPartySocket(firstJoiner.cookie, created.payload.partyId);
    accepted.socket.close(1000, "test-complete");
  });
});

describe("派对房 WebSocket 对局", () => {
  it("完整流程：开始→倒计时→同题猜测→结算→结束→再来一局，且不泄露他人猜测", async () => {
    // 固定随机数，让 aeon 题库答案按清单顺序恒定
    mockDeterministicDraw();
    const host = await createSession("ws-flow-host");
    const second = await createSession("ws-flow-second");
    const third = await createSession("ws-flow-third");
    const created = await createParty(host.cookie, {
      modeId: "aeon",
      rounds: 3,
      roundTimeSeconds: 90,
      maxAttempts: 6,
    });
    expect(created.status).toBe(201);
    expect((await joinParty(second.cookie, created.payload.code)).status).toBe(200);
    expect((await joinParty(third.cookie, created.payload.code)).status).toBe(200);
    const hostTap = await connectPartySocket(host.cookie, created.payload.partyId);
    const secondTap = await connectPartySocket(second.cookie, created.payload.partyId);
    const thirdTap = await connectPartySocket(third.cookie, created.payload.partyId);
    await hostTap.nextSnapshot((snapshot) => snapshot.players.length === 3);
    await secondTap.nextSnapshot((snapshot) => snapshot.players.length === 3);
    await thirdTap.nextSnapshot((snapshot) => snapshot.players.length === 3);

    // 房主开始 → 3 秒倒计时
    const countdownWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.state === "countdown"),
      secondTap.nextSnapshot((snapshot) => snapshot.state === "countdown"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "countdown"),
    ]);
    hostTap.socket.send(JSON.stringify({ type: "start" }));
    const [countdown] = await countdownWait;
    expect(countdown?.round).toBe(0);
    expect(countdown?.roundStartsAt).toBeGreaterThan(Date.now() - 1);
    expect(countdown?.players.every((player) => player.roundStatus === "spectating")).toBe(true);

    // 倒计时结束 → 同一题同时猜
    const [hostPlaying] = await Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
      secondTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
    ]);
    expect(hostPlaying?.round).toBe(1);
    expect(hostPlaying.roundAnswer).toBeNull();
    expect(hostPlaying.roundEndsAt).not.toBeNull();
    expect(hostPlaying.players).toHaveLength(3);
    expect(hostPlaying.players.every((player) => player.roundStatus === "guessing")).toBe(true);
    expect(JSON.stringify(hostPlaying)).not.toContain(`"id":"${AEON_ANSWER_ID}"`);

    // 乙第 1 个猜中：225 分
    const secondSolvedWait = Promise.all([
      secondTap.nextSnapshot((snapshot) => playerById(snapshot, second.data.user.id).score > 0),
      thirdTap.nextSnapshot((snapshot) => playerById(snapshot, second.data.user.id).score > 0),
    ]);
    secondTap.socket.send(
      JSON.stringify({
        type: "guess",
        characterId: AEON_ANSWER_ID,
        actionId: crypto.randomUUID(),
      }),
    );
    const [secondSolved] = await secondSolvedWait;
    expect(secondSolved).toBeDefined();
    if (!secondSolved) return;
    expect(playerById(secondSolved, second.data.user.id).solveRank).toBe(1);
    expect(playerById(secondSolved, second.data.user.id).score).toBe(225);
    expect(secondSolved.ownGuesses[0]?.character.id).toBe(AEON_ANSWER_ID);

    // 丙猜一个错误角色：其他人只能看到反馈颜色，看不到角色本身
    const thirdWrongWait = Promise.all([
      hostTap.nextSnapshot(
        (snapshot) => playerById(snapshot, third.data.user.id).feedback.length === 1,
      ),
      secondTap.nextSnapshot(
        (snapshot) => playerById(snapshot, third.data.user.id).feedback.length === 1,
      ),
    ]);
    thirdTap.socket.send(
      JSON.stringify({
        type: "guess",
        characterId: AEON_WRONG_ID,
        actionId: crypto.randomUUID(),
      }),
    );
    const [hostAfterWrong, secondAfterWrong] = await thirdWrongWait;
    // 房主这一回合什么都没猜：快照里既不能出现答案，也不能出现别人猜的角色
    expect(JSON.stringify(hostAfterWrong)).not.toContain(`"id":"${AEON_WRONG_ID}"`);
    expect(JSON.stringify(hostAfterWrong)).not.toContain(`"id":"${AEON_ANSWER_ID}"`);
    // 乙自己猜中了答案（ownGuesses 里当然有），但看不到丙猜的是谁
    expect(JSON.stringify(secondAfterWrong)).not.toContain(`"id":"${AEON_WRONG_ID}"`);
    for (const snapshot of [hostAfterWrong, secondAfterWrong]) {
      const feedback = playerById(snapshot, third.data.user.id).feedback;
      expect(feedback).toHaveLength(1);
      expect(feedback[0]?.[0]?.field).toBe("image");
    }
    // 丙自己看得到自己猜了什么
    const thirdOwn = await thirdTap.nextSnapshot((snapshot) => snapshot.ownGuesses.length === 1);
    expect(thirdOwn.ownGuesses[0]?.character.id).toBe(AEON_WRONG_ID);
    expect(thirdOwn.ownGuesses[0]?.isCorrect).toBe(false);

    // 丙与房主依次猜中 → 全员猜中，立即结算
    thirdTap.socket.send(
      JSON.stringify({
        type: "guess",
        characterId: AEON_ANSWER_ID,
        actionId: crypto.randomUUID(),
      }),
    );
    const endedWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.state === "round-ended"),
      secondTap.nextSnapshot((snapshot) => snapshot.state === "round-ended"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "round-ended"),
    ]);
    hostTap.socket.send(
      JSON.stringify({
        type: "guess",
        characterId: AEON_ANSWER_ID,
        actionId: crypto.randomUUID(),
      }),
    );
    const [ended] = await endedWait;
    expect(ended?.state).toBe("round-ended");
    expect(ended?.roundAnswer?.id).toBe(AEON_ANSWER_ID);
    expect(ended?.nextRoundAt).toBeGreaterThan(Date.now());
    expect(ended?.history).toHaveLength(1);
    const placements = ended?.history[0]?.placements ?? [];
    expect(placements).toHaveLength(3);
    expect(placements.find((entry) => entry.playerId === second.data.user.id)).toMatchObject({
      solved: true,
      points: 225,
    });
    expect(placements.find((entry) => entry.playerId === third.data.user.id)).toMatchObject({
      solved: true,
      guessesUsed: 2,
      points: 190,
    });
    expect(placements.find((entry) => entry.playerId === host.data.user.id)).toMatchObject({
      solved: true,
      points: 190,
    });

    // 房主跳过等待：立即进入第 2 回合，答案不重复
    const roundTwoWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.round === 2 && snapshot.state === "playing"),
      secondTap.nextSnapshot((snapshot) => snapshot.round === 2 && snapshot.state === "playing"),
      thirdTap.nextSnapshot((snapshot) => snapshot.round === 2 && snapshot.state === "playing"),
    ]);
    hostTap.socket.send(JSON.stringify({ type: "next" }));
    const [roundTwo] = await roundTwoWait;
    expect(roundTwo?.roundAnswer).toBeNull();
    expect(roundTwo?.players.every((player) => player.guessesUsed === 0)).toBe(true);

    // 第 2 回合：三个人都猜中（答案恒定是题库第二个实体）
    const roundTwoEndedWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.round === 2 && snapshot.state === "round-ended"),
      secondTap.nextSnapshot(
        (snapshot) => snapshot.round === 2 && snapshot.state === "round-ended",
      ),
      thirdTap.nextSnapshot((snapshot) => snapshot.round === 2 && snapshot.state === "round-ended"),
    ]);
    for (const tap of [secondTap, thirdTap, hostTap]) {
      tap.socket.send(
        JSON.stringify({
          type: "guess",
          characterId: AEON_SECOND_ANSWER_ID,
          actionId: crypto.randomUUID(),
        }),
      );
    }
    const [roundTwoEnded] = await roundTwoEndedWait;
    expect(roundTwoEnded?.roundAnswer?.id).toBe(AEON_SECOND_ANSWER_ID);
    expect(roundTwoEnded?.history).toHaveLength(2);
    // 三人同题先后猜中，第 2 回合至少拿 190 分（100 + 15×4 + 30）
    if (roundTwoEnded) {
      expect(playerById(roundTwoEnded, second.data.user.id).score).toBeGreaterThanOrEqual(415);
    }

    // 第 3 回合同样全员猜中（先各自等 playing，再统一等结算，避免同一连接多个消费者抢消息）
    hostTap.socket.send(JSON.stringify({ type: "next" }));
    await hostTap.nextSnapshot((snapshot) => snapshot.round === 3 && snapshot.state === "playing");
    await secondTap.nextSnapshot(
      (snapshot) => snapshot.round === 3 && snapshot.state === "playing",
    );
    await thirdTap.nextSnapshot((snapshot) => snapshot.round === 3 && snapshot.state === "playing");
    const roundThreeEndedWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.round === 3 && snapshot.state === "round-ended"),
      secondTap.nextSnapshot(
        (snapshot) => snapshot.round === 3 && snapshot.state === "round-ended",
      ),
      thirdTap.nextSnapshot((snapshot) => snapshot.round === 3 && snapshot.state === "round-ended"),
    ]);
    for (const tap of [thirdTap, secondTap, hostTap]) {
      tap.socket.send(
        JSON.stringify({
          type: "guess",
          characterId: AEON_THIRD_ANSWER_ID,
          actionId: crypto.randomUUID(),
        }),
      );
    }
    const [roundThreeEnded] = await roundThreeEndedWait;
    expect(roundThreeEnded?.roundAnswer?.id).toBe(AEON_THIRD_ANSWER_ID);
    expect(roundThreeEnded?.history).toHaveLength(3);

    // rounds 用尽 → finished
    const finishedWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.state === "finished"),
      secondTap.nextSnapshot((snapshot) => snapshot.state === "finished"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "finished"),
    ]);
    hostTap.socket.send(JSON.stringify({ type: "next" }));
    const [finished] = await finishedWait;
    expect(finished?.roundAnswer?.id).toBe(AEON_THIRD_ANSWER_ID);
    expect(finished?.nextRoundAt).toBeNull();

    // 再来一局：回大厅、分数与历史清空
    const lobbyWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.state === "lobby"),
      secondTap.nextSnapshot((snapshot) => snapshot.state === "lobby"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "lobby"),
    ]);
    hostTap.socket.send(JSON.stringify({ type: "rematch" }));
    const [relobby] = await lobbyWait;
    expect(relobby?.round).toBe(0);
    expect(relobby?.history).toEqual([]);
    expect(relobby?.roundAnswer).toBeNull();
    expect(relobby?.players.every((player) => player.score === 0)).toBe(true);
    expect(relobby?.players.every((player) => player.roundStatus === "spectating")).toBe(true);

    for (const tap of [hostTap, secondTap, thirdTap]) tap.socket.close(1000, "test-complete");
  }, 60_000);

  it("表情广播并按每秒 1 次节流，ping 返回 pong", async () => {
    const host = await createSession("ws-react-host");
    const guest = await createSession("ws-react-guest");
    const created = await createParty(host.cookie, { modeId: "aeon", rounds: 3 });
    expect((await joinParty(guest.cookie, created.payload.code)).status).toBe(200);
    const hostTap = await connectPartySocket(host.cookie, created.payload.partyId);
    const guestTap = await connectPartySocket(guest.cookie, created.payload.partyId);
    await hostTap.nextSnapshot((snapshot) => snapshot.players.length === 2);
    await guestTap.nextSnapshot((snapshot) => snapshot.players.length === 2);

    // 连发两个表情：只有一个会被广播
    const reaction = PARTY_REACTIONS[0] ?? "👍";
    hostTap.socket.send(JSON.stringify({ type: "react", reaction }));
    hostTap.socket.send(JSON.stringify({ type: "react", reaction }));
    await sleep(1_200);
    const guestMessages = guestTap
      .drain()
      .filter((message) => (message as { type?: string }).type === "reaction");
    expect(guestMessages).toHaveLength(1);
    expect(guestMessages[0]).toMatchObject({
      type: "reaction",
      playerId: host.data.user.id,
      reaction,
    });
    // 被节流的那次不会产生错误消息
    expect(
      guestTap.drain().some((message) => (message as { type?: string }).type === "error"),
    ).toBe(false);

    const pongWait = hostTap.nextOfType("pong");
    hostTap.socket.send(JSON.stringify({ type: "ping", sentAt: Date.now() }));
    const pong = await pongWait;
    expect(pong.sentAt).toEqual(expect.any(Number));
    hostTap.socket.close(1000, "test-complete");
    guestTap.socket.close(1000, "test-complete");
  });

  it("被踢出的玩家收到 kicked、断开且无法再进入", async () => {
    const host = await createSession("ws-kick-host");
    const guest = await createSession("ws-kick-guest");
    const created = await createParty(host.cookie, { modeId: "aeon", rounds: 3 });
    expect((await joinParty(guest.cookie, created.payload.code)).status).toBe(200);
    const hostTap = await connectPartySocket(host.cookie, created.payload.partyId);
    const guestTap = await connectPartySocket(guest.cookie, created.payload.partyId);
    await hostTap.nextSnapshot((snapshot) => snapshot.players.length === 2);

    const kickedWait = guestTap.nextOfType("kicked");
    const closedWait = new Promise<void>((resolve) => {
      guestTap.socket.addEventListener("close", () => resolve(), { once: true });
    });
    hostTap.socket.send(JSON.stringify({ type: "kick", playerId: guest.data.user.id }));
    expect((await kickedWait).type).toBe("kicked");
    await closedWait;

    // 房主视角：人已经走了
    const afterKick = await hostTap.nextSnapshot((snapshot) => snapshot.players.length === 1);
    expect(afterKick.players[0]?.playerId).toBe(host.data.user.id);

    // 同一个账号不能再加入，也不能再连 WebSocket
    expect((await joinParty(guest.cookie, created.payload.code)).status).toBe(403);
    const rejoin = await SELF.fetch(
      `https://fireflydle.games/api/parties/${created.payload.partyId}/ws`,
      { headers: { cookie: guest.cookie, upgrade: "websocket" } },
    );
    expect(rejoin.status).toBe(403);
    hostTap.socket.close(1000, "test-complete");
  });

  it("房主掉线后转交最早加入的在线玩家，断线玩家不阻塞回合结束", async () => {
    mockDeterministicDraw();
    const host = await createSession("ws-transfer-host");
    const second = await createSession("ws-transfer-second");
    const third = await createSession("ws-transfer-third");
    const created = await createParty(host.cookie, { modeId: "aeon", rounds: 3 });
    expect((await joinParty(second.cookie, created.payload.code)).status).toBe(200);
    expect((await joinParty(third.cookie, created.payload.code)).status).toBe(200);
    const hostTap = await connectPartySocket(host.cookie, created.payload.partyId);
    const secondTap = await connectPartySocket(second.cookie, created.payload.partyId);
    const thirdTap = await connectPartySocket(third.cookie, created.payload.partyId);
    await secondTap.nextSnapshot((snapshot) => snapshot.players.length === 3);

    // 房主掉线：主持人转交给第二个加入的人
    const transferWait = secondTap.nextSnapshot(
      (snapshot) =>
        snapshot.hostPlayerId === second.data.user.id &&
        playerById(snapshot, host.data.user.id).connected === false,
    );
    hostTap.socket.close(1000, "host-offline");
    const transferred = await transferWait;
    expect(transferred.hostPlayerId).toBe(second.data.user.id);
    expect(playerById(transferred, second.data.user.id).isHost).toBe(true);

    // 新房主开始游戏
    const playingWait = Promise.all([
      secondTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
    ]);
    secondTap.socket.send(JSON.stringify({ type: "start" }));
    await playingWait;

    // 剩下两人猜中即结算，掉线的房主记 failed
    const endedWait = Promise.all([
      secondTap.nextSnapshot((snapshot) => snapshot.state === "round-ended"),
      thirdTap.nextSnapshot((snapshot) => snapshot.state === "round-ended"),
    ]);
    secondTap.socket.send(
      JSON.stringify({ type: "guess", characterId: AEON_ANSWER_ID, actionId: crypto.randomUUID() }),
    );
    thirdTap.socket.send(
      JSON.stringify({ type: "guess", characterId: AEON_ANSWER_ID, actionId: crypto.randomUUID() }),
    );
    const [ended] = await endedWait;
    expect(ended?.state).toBe("round-ended");
    expect(ended?.roundAnswer?.id).toBe(AEON_ANSWER_ID);
    const placements = ended?.history[0]?.placements ?? [];
    expect(placements).toHaveLength(3);
    expect(placements.find((entry) => entry.playerId === host.data.user.id)).toMatchObject({
      solved: false,
      guessesUsed: 0,
      points: 0,
    });
    expect(placements.find((entry) => entry.playerId === second.data.user.id)).toMatchObject({
      solved: true,
      points: 225,
    });
    secondTap.socket.close(1000, "test-complete");
    thirdTap.socket.close(1000, "test-complete");
  }, 30_000);

  it("猜测错误通过 error 消息返回", async () => {
    mockDeterministicDraw();
    const host = await createSession("ws-error-host");
    const guest = await createSession("ws-error-guest");
    const created = await createParty(host.cookie, {
      modeId: "aeon",
      rounds: 3,
      maxAttempts: 6,
    });
    expect((await joinParty(guest.cookie, created.payload.code)).status).toBe(200);
    const hostTap = await connectPartySocket(host.cookie, created.payload.partyId);
    const guestTap = await connectPartySocket(guest.cookie, created.payload.partyId);

    // 大厅里猜测 → ROOM_NOT_PLAYING
    const notPlaying = guestTap.nextOfType("error");
    guestTap.socket.send(
      JSON.stringify({ type: "guess", characterId: AEON_ANSWER_ID, actionId: crypto.randomUUID() }),
    );
    expect((await notPlaying).code).toBe("ROOM_NOT_PLAYING");

    const playingWait = Promise.all([
      hostTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
      guestTap.nextSnapshot((snapshot) => snapshot.state === "playing"),
    ]);
    hostTap.socket.send(JSON.stringify({ type: "start" }));
    await playingWait;

    // 猜测不存在的角色 → NOT_FOUND
    const notFound = guestTap.nextOfType("error");
    guestTap.socket.send(
      JSON.stringify({ type: "guess", characterId: "aeon-nope", actionId: crypto.randomUUID() }),
    );
    expect((await notFound).code).toBe("NOT_FOUND");

    // 6 次错误猜测用尽次数 → failed，再猜 → GAME_ATTEMPTS_EXHAUSTED
    const wrongIds = aeonEntities
      .map((entity) => entity.id)
      .filter((id) => id !== AEON_ANSWER_ID)
      .slice(0, 6);
    for (const id of wrongIds) {
      guestTap.socket.send(
        JSON.stringify({ type: "guess", characterId: id, actionId: crypto.randomUUID() }),
      );
    }
    const failed = await guestTap.nextSnapshot(
      (snapshot) => playerById(snapshot, guest.data.user.id).roundStatus === "failed",
    );
    expect(playerById(failed, guest.data.user.id).guessesUsed).toBe(6);
    const exhausted = guestTap.nextOfType("error");
    guestTap.socket.send(
      JSON.stringify({ type: "guess", characterId: AEON_ANSWER_ID, actionId: crypto.randomUUID() }),
    );
    expect((await exhausted).code).toBe("GAME_ATTEMPTS_EXHAUSTED");

    // 重复猜同一角色 → GAME_DUPLICATE_GUESS（房主还有次数）
    const duplicateId = wrongIds[0] ?? "";
    hostTap.socket.send(
      JSON.stringify({ type: "guess", characterId: duplicateId, actionId: crypto.randomUUID() }),
    );
    const duplicate = hostTap.nextOfType("error");
    hostTap.socket.send(
      JSON.stringify({ type: "guess", characterId: duplicateId, actionId: crypto.randomUUID() }),
    );
    expect((await duplicate).code).toBe("GAME_DUPLICATE_GUESS");

    // 房主猜中 → 回合结束（失败的玩家不影响结算）
    const endedWait = hostTap.nextSnapshot((snapshot) => snapshot.state === "round-ended");
    hostTap.socket.send(
      JSON.stringify({ type: "guess", characterId: AEON_ANSWER_ID, actionId: crypto.randomUUID() }),
    );
    const ended = await endedWait;
    expect(ended.roundAnswer?.id).toBe(AEON_ANSWER_ID);
    expect(ended.history[0]?.placements).toHaveLength(2);
    hostTap.socket.close(1000, "test-complete");
    guestTap.socket.close(1000, "test-complete");
  }, 30_000);
});
