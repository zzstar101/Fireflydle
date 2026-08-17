import {
  PASSWORD_MIN_LENGTH,
  ServerRoomMessageSchema,
  type Announcement,
  type Character,
  type ReplayResponse,
  type PublicGame,
  type PublicEndlessRun,
  type EndlessLeaderboardEntry,
  type RoomSnapshot,
  type RoomPreviewResponse,
} from "@fireflydle/contracts";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MULTIPLAYER_ROUND_MS, RECONNECT_GRACE_MS } from "@fireflydle/game-engine";
import { PASSWORD_ITERATIONS, sha256 } from "../src/lib/crypto";
import { createPlayableMultiplayerContentSnapshot } from "../src/services/multiplayer-content";
import { contentManifest, currencyWarsManifest, npcManifest } from "@fireflydle/game-data";

const character: Character = {
  id: "firefly-test",
  officialId: "test-1",
  baseCharacterId: "firefly-test",
  names: { "zh-CN": "测试流萤", en: "Test Firefly", ja: "テストホタル" },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "stellaron-hunters",
  factionGroupId: "stellaron-hunters",
  releaseVersionId: "2.3",
  releaseOrder: 10,
  assets: {
    avatarPath: "/assets/characters/firefly-test-avatar.webp",
    portraitPath: "/assets/characters/firefly-test-portrait.webp",
    sourceUrl: "https://hsr.hoyoverse.com/",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: "0".repeat(64),
    rightsNotice: "测试数据",
  },
  enabled: true,
  targetEligible: true,
  sourceRevision: "test",
};

const snapshotCandidate: Character = {
  ...character,
  id: "snapshot-candidate",
  officialId: "test-snapshot-candidate",
  baseCharacterId: "snapshot-candidate",
  names: { "zh-CN": "快照候选", en: "Snapshot Candidate", ja: "スナップ候補" },
  element: "ice",
  targetEligible: false,
};

interface SessionData {
  expiresAt: string;
  user: {
    id: string;
    displayName: string;
    hasEmail: boolean;
    emailVerified: boolean;
    elo?: number;
    rankedMatches?: number;
    leaderboardEligible?: boolean;
  };
}

async function dataOf<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) throw new Error("非法 API 响应");
  const record = payload as Record<string, unknown>;
  if (record.ok !== true || !("data" in record)) throw new Error("非成功 API 响应");
  return record.data as T;
}

async function createSession(ipAddress?: string): Promise<{ cookie: string; data: SessionData }> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", {
    method: "POST",
    headers: { "cf-connecting-ip": ipAddress ?? `test:session:${crypto.randomUUID()}` },
  });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("HttpOnly");
  if (!cookie) throw new Error("缺少 session cookie");
  return { cookie, data: await dataOf<SessionData>(response) };
}

async function createRegisteredSession(
  suffix: string,
): Promise<{ cookie: string; data: SessionData; password: string }> {
  const password = `registered-${suffix}-password`;
  const response = await SELF.fetch("https://fireflydle.games/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `test:${suffix}`,
    },
    body: JSON.stringify({
      loginName: `registered_${suffix}`,
      displayName: `Reg ${suffix}`,
      password,
    }),
  });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少注册账号 session cookie");
  return { cookie, data: await dataOf<SessionData>(response), password };
}

async function createAdminSession(suffix: string): Promise<{ cookie: string; data: SessionData }> {
  const session = await createRegisteredSession(`admin_${suffix}`);
  await env.DB.prepare("UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?")
    .bind(Date.now(), session.data.user.id)
    .run();
  return { cookie: session.cookie, data: session.data };
}

async function seedCharacter(): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO characters
       (id, official_id, base_character_id, element, path, rarity, faction_id,
        faction_group_id, release_version_id, release_order, enabled, target_eligible,
        source_revision, payload_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`,
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
      character.sourceRevision,
      JSON.stringify(character),
      now,
      now,
    )
    .run();
}

async function seedSnapshotCandidate(candidate: Character = snapshotCandidate): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO characters
       (id, official_id, base_character_id, element, path, rarity, faction_id,
        faction_group_id, release_version_id, release_order, enabled, target_eligible,
        source_revision, payload_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`,
  )
    .bind(
      candidate.id,
      candidate.officialId,
      candidate.baseCharacterId,
      candidate.element,
      candidate.path,
      candidate.rarity,
      candidate.factionId,
      candidate.factionGroupId,
      candidate.releaseVersionId,
      candidate.releaseOrder,
      candidate.sourceRevision,
      JSON.stringify(candidate),
      now,
      now,
    )
    .run();
}

function nextSocketMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    socket.addEventListener("message", (event) => resolve(JSON.parse(String(event.data))), {
      once: true,
    });
    socket.addEventListener("error", () => reject(new Error("WebSocket 接收失败")), {
      once: true,
    });
  });
}

async function nextSocketSnapshot(
  socket: WebSocket,
  predicate: (snapshot: RoomSnapshot) => boolean,
): Promise<RoomSnapshot> {
  for (;;) {
    const message = ServerRoomMessageSchema.parse(await nextSocketMessage(socket));
    if (message.type === "snapshot" && predicate(message.snapshot)) return message.snapshot;
  }
}

beforeEach(async () => {
  vi.restoreAllMocks();
  await seedCharacter();
});

describe("Worker 入口与会话", () => {
  it("返回统一健康响应并严格限制 CORS", async () => {
    const health = await SELF.fetch("https://fireflydle.games/api/health");
    expect(health.status).toBe(200);
    expect(await dataOf<{ status: string }>(health)).toMatchObject({ status: "ok" });

    const preflight = await SELF.fetch("https://fireflydle.games/api/session", {
      method: "OPTIONS",
      headers: { origin: "http://localhost:5173" },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");

    const denied = await SELF.fetch("https://fireflydle.games/api/health", {
      headers: { origin: "https://evil.example" },
    });
    expect(denied.status).toBe(403);
  });

  it("只在 HttpOnly cookie 中交付 session token", async () => {
    const session = await createSession();
    expect(session.cookie).toContain("Secure");
    expect(session.cookie).toContain("SameSite=Lax");
    expect(session.cookie).toContain("Domain=.fireflydle.games");
    expect(session.data).not.toHaveProperty("token");
    expect(session.data.user.id).toMatch(/^[0-9a-f-]{36}$/u);
  });
});

describe("公告中心", () => {
  it("按受众返回公告并持久保存关闭状态", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const admin = await createAdminSession(`ann_${suffix}`);
    const guest = await createSession();
    const createdResponse = await SELF.fetch("https://fireflydle.games/api/admin/announcements", {
      method: "POST",
      headers: { cookie: admin.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        title: { "zh-CN": "版本更新", en: "", ja: "" },
        body: { "zh-CN": "- 新增公告中心", en: "", ja: "" },
        category: "update",
        audience: "all",
        published: true,
        startsAt: null,
        endsAt: null,
      }),
    });
    expect(createdResponse.status).toBe(201);
    const created = await dataOf<Announcement>(createdResponse);
    expect(created).toMatchObject({ status: "active", category: "update", readAt: null });
    expect(created.title.en).toBe("版本更新");

    const scheduledResponse = await SELF.fetch("https://fireflydle.games/api/admin/announcements", {
      method: "POST",
      headers: { cookie: admin.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        title: { "zh-CN": "定时通知", en: "", ja: "" },
        body: { "zh-CN": "尚未到生效时间。", en: "", ja: "" },
        published: true,
        startsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      }),
    });
    const scheduled = await dataOf<Announcement>(scheduledResponse);
    expect(scheduled.status).toBe("scheduled");

    const before = await SELF.fetch("https://fireflydle.games/api/announcements", {
      headers: { cookie: guest.cookie },
    });
    const beforeItems = await dataOf<Announcement[]>(before);
    expect(beforeItems.find((item) => item.id === created.id)?.readAt).toBeNull();
    expect(beforeItems.some((item) => item.id === scheduled.id)).toBe(false);

    const read = await SELF.fetch("https://fireflydle.games/api/announcements/read", {
      method: "POST",
      headers: { cookie: guest.cookie, "content-type": "application/json" },
      body: JSON.stringify({ ids: [created.id] }),
    });
    expect(read.status).toBe(200);

    const after = await SELF.fetch("https://fireflydle.games/api/announcements", {
      headers: { cookie: guest.cookie },
    });
    const afterItems = await dataOf<Announcement[]>(after);
    expect(afterItems.find((item) => item.id === created.id)?.readAt).not.toBeNull();
  });

  it("访客登录已有账号后合并公告已读记录", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const admin = await createAdminSession(`am_${suffix}`);
    const guest = await createSession();
    const target = await createRegisteredSession(`at_${suffix}`);
    const createdResponse = await SELF.fetch("https://fireflydle.games/api/admin/announcements", {
      method: "POST",
      headers: { cookie: admin.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        title: { "zh-CN": "合并测试", en: "", ja: "" },
        body: { "zh-CN": "关闭后登录不应重弹。", en: "", ja: "" },
        published: true,
      }),
    });
    const created = await dataOf<Announcement>(createdResponse);
    await SELF.fetch("https://fireflydle.games/api/announcements/read", {
      method: "POST",
      headers: { cookie: guest.cookie, "content-type": "application/json" },
      body: JSON.stringify({ ids: [created.id] }),
    });

    const login = await SELF.fetch("https://fireflydle.games/api/auth/login", {
      method: "POST",
      headers: { cookie: guest.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        loginName: `registered_at_${suffix}`,
        password: target.password,
      }),
    });
    expect(login.status).toBe(200);
    const mergedCookie = login.headers.get("set-cookie");
    if (!mergedCookie) throw new Error("缺少合并后的 session cookie");
    const announcements = await SELF.fetch("https://fireflydle.games/api/announcements", {
      headers: { cookie: mergedCookie },
    });
    const items = await dataOf<Announcement[]>(announcements);
    expect(items.find((item) => item.id === created.id)?.readAt).not.toBeNull();
  });

  it("按 Release 标签幂等发布玩家公告", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    await createAdminSession(`rel_${suffix}`);
    const request = () =>
      SELF.fetch("https://fireflydle.games/api/announcements/releases", {
        method: "POST",
        headers: {
          authorization: "Bearer test-release-announcement-token-0001",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          tagName: `v-test-${suffix}`,
          name: "萤一把测试版本",
          body: "## 玩家更新\n\n- 新增公告系统",
        }),
      });
    const first = await request();
    expect(first.status).toBe(201);
    const created = await dataOf<Announcement>(first);
    expect(created).toMatchObject({ category: "update", source: "release", status: "active" });
    const second = await request();
    expect(second.status).toBe(200);
    expect((await dataOf<Announcement>(second)).id).toBe(created.id);
  });
});

describe("管理概览与注册用户列表", () => {
  it("用户列表从查询层排除访客并支持筛选分页", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const guest = await createSession();
    const registered = await createRegisteredSession(`listed_${suffix}`);
    const admin = await createAdminSession(suffix);

    const response = await SELF.fetch(
      "https://fireflydle.games/api/admin/users?role=player&status=active&page=1&pageSize=10",
      { headers: { cookie: admin.cookie } },
    );
    expect(response.status).toBe(200);
    const page = await dataOf<{
      items: Array<{ id: string; role: string; emailVerified: boolean }>;
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(response);
    expect(page).toMatchObject({ page: 1, pageSize: 10 });
    expect(page.items.some((user) => user.id === registered.data.user.id)).toBe(true);
    expect(page.items.some((user) => user.id === guest.data.user.id)).toBe(false);
    expect(page.items.every((user) => user.role === "player")).toBe(true);
  });

  it("缺少只读 Token 时概览仍返回本地核心指标", async () => {
    const admin = await createAdminSession(crypto.randomUUID().slice(0, 8));
    const response = await SELF.fetch(
      "https://fireflydle.games/api/admin/operations?range=24h&trend=7",
      { headers: { cookie: admin.cookie } },
    );
    expect(response.status).toBe(200);
    const overview = await dataOf<{
      timezone: string;
      audience: { registeredTotal: number; guestTotal: number };
      api: { configured: boolean; available: boolean };
      cloudflare: { configured: boolean; available: boolean };
      trends: unknown[];
    }>(response);
    expect(overview.timezone).toBe("Asia/Shanghai");
    expect(overview.audience.registeredTotal).toBeGreaterThan(0);
    expect(overview.audience.guestTotal).toBeGreaterThan(0);
    expect(overview.api).toEqual(expect.objectContaining({ configured: false, available: false }));
    expect(overview.cloudflare).toEqual(
      expect.objectContaining({ configured: false, available: false }),
    );
    expect(overview.trends).toHaveLength(7);

    const presenceResponse = await SELF.fetch("https://fireflydle.games/api/admin/presence", {
      headers: { cookie: admin.cookie },
    });
    expect(presenceResponse.status).toBe(200);
    const presence = await dataOf<{
      windowMinutes: number;
      total: number | null;
      registered: number | null;
      guests: number | null;
    }>(presenceResponse);
    expect(presence).toMatchObject({
      windowMinutes: 5,
      total: 0,
      registered: 0,
      guests: 0,
    });
  });

  it("持续请求会刷新在线会话的最后活动时间", async () => {
    const session = await createSession();
    const visitSessionId = crypto.randomUUID();
    const response = await SELF.fetch("https://fireflydle.games/api/session", {
      headers: { cookie: session.cookie, "x-visit-session-id": visitSessionId },
    });
    expect(response.status).toBe(200);
    const row = await env.DB.prepare(
      "SELECT started_at, last_seen_at FROM operations_visit_sessions WHERE id = ?",
    )
      .bind(visitSessionId)
      .first<{ started_at: number; last_seen_at: number | null }>();
    expect(row?.last_seen_at).toBeGreaterThanOrEqual(row?.started_at ?? Number.MAX_SAFE_INTEGER);
  });
});

describe("账号密码边界", () => {
  it("密码哈希迭代次数不超过 Workers Web Crypto 上限", () => {
    expect(PASSWORD_ITERATIONS).toBeLessThanOrEqual(100_000);
  });

  it("注册拒绝 5 位密码并接受 6 位密码", async () => {
    const register = (suffix: string, password: string) =>
      SELF.fetch("https://fireflydle.games/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          loginName: `password_${suffix}`,
          displayName: `Password ${suffix}`,
          password,
        }),
      });

    const tooShort = await register("short", "x".repeat(PASSWORD_MIN_LENGTH - 1));
    expect(tooShort.status).toBe(400);

    const accepted = await register("accepted", "x".repeat(PASSWORD_MIN_LENGTH));
    expect(accepted.status).toBe(201);
  });
});

describe("服务端游戏裁决", () => {
  it("题库摘要只为匹配的 manifest 版本提供不可变响应", async () => {
    const playable = await SELF.fetch(
      `https://fireflydle.games/api/characters?manifestVersion=${contentManifest.manifestVersion}`,
    );
    expect(playable.status).toBe(200);
    expect(playable.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");

    const npc = await SELF.fetch(
      `https://fireflydle.games/api/npcs?manifestVersion=${npcManifest.manifestVersion}`,
    );
    expect(npc.status).toBe(200);
    expect(npc.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");

    const unavailable = await SELF.fetch(
      "https://fireflydle.games/api/characters?manifestVersion=0.0.0",
    );
    expect(unavailable.status).toBe(409);
  });

  it("NPC 使用独立四猜快照，创建和恢复不泄露答案", async () => {
    const { cookie } = await createSession();
    const roster = await dataOf<Array<Record<string, unknown> & { id: string }>>(
      await SELF.fetch("https://fireflydle.games/api/npcs", { headers: { cookie } }),
    );
    expect(roster.map((entry) => entry.id).sort()).toEqual(
      ["npc-pom-pom", "npc-siobhan", "npc-skott"].sort(),
    );

    const create = () =>
      SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ modeId: "npc", activityId: "practice" }),
      });
    const game = await dataOf<PublicGame>(await create());
    expect(game.modeId).toBe("npc");
    expect(game.maxAttempts).toBe(4);
    expect(game.answer).toBeNull();
    expect(game.fieldDefinitions?.map((field) => field.id)).toEqual([
      "region",
      "faction",
      "debut-version",
    ]);
    expect((await dataOf<PublicGame>(await create())).id).toBe(game.id);

    const stored = await env.DB.prepare("SELECT target_character_id FROM games WHERE id = ?")
      .bind(game.id)
      .first<{ target_character_id: string }>();
    const finished = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: stored?.target_character_id }),
      }),
    );
    expect(finished.status).toBe("won");
    expect(finished.answer?.id).toBe(stored?.target_character_id);
    expect(finished.guesses[0]?.cells.map((cell) => cell.field)).toEqual([
      "region",
      "faction",
      "debut-version",
    ]);
    expect(finished.inferenceReview?.initialCandidates).toBe(3);
    expect(finished.inferenceReview?.steps[0]?.remainingCandidates).toBe(1);

    const replay = await dataOf<{ kind: string; game: PublicGame }>(
      await SELF.fetch(`https://fireflydle.games/api/replays/${game.id}`, {
        headers: { cookie },
      }),
    );
    expect(replay.kind).toBe("solo");
    expect(replay.game.modeId).toBe("npc");
    expect(replay.game.guesses).toEqual(finished.guesses);
    expect(replay.game.inferenceReview).toEqual(finished.inferenceReview);

    const lossFixture = await dataOf<PublicGame>(await create());
    const base = roster[0];
    if (!base) throw new Error("NPC fixture 缺少基础实体");
    const fixtureCandidates = Object.fromEntries(
      [1, 2, 3, 4].map((index) => [
        `npc-candidate-fixture-${index}`,
        { ...base, id: `npc-candidate-fixture-${index}` },
      ]),
    );
    await env.DB.prepare("UPDATE games SET candidate_pool_json = ? WHERE id = ?")
      .bind(JSON.stringify(fixtureCandidates), lossFixture.id)
      .run();
    let loss = lossFixture;
    for (const id of Object.keys(fixtureCandidates)) {
      loss = await dataOf<PublicGame>(
        await SELF.fetch(`https://fireflydle.games/api/games/${lossFixture.id}/guesses`, {
          method: "POST",
          headers: { cookie, "content-type": "application/json" },
          body: JSON.stringify({ characterId: id }),
        }),
      );
    }
    expect(loss.status).toBe("lost");
    expect(loss.guesses).toHaveLength(4);
    expect(loss.answer?.id).not.toMatch(/^npc-candidate-fixture-/);
    const stats = await dataOf<{ practicePlayed: number }>(
      await SELF.fetch("https://fireflydle.games/api/stats/me", { headers: { cookie } }),
    );
    expect(stats.practicePlayed).toBe(0);
    expect(stats).not.toHaveProperty("randomPlayed");
  });

  it("币战复盘使用绑定候选池精确计数，且不泄露羁绊名称", async () => {
    const { cookie } = await createSession();
    const game = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ modeId: "currency-wars", activityId: "practice" }),
      }),
    );
    const stored = await env.DB.prepare(
      "SELECT target_character_id, candidate_pool_json FROM games WHERE id = ?",
    )
      .bind(game.id)
      .first<{ target_character_id: string; candidate_pool_json: string }>();
    if (!stored) throw new Error("币战 fixture 缺少目标");
    const candidateCount = Object.keys(JSON.parse(stored.candidate_pool_json) as object).length;
    const finished = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: stored.target_character_id }),
      }),
    );
    expect(finished.status).toBe("won");
    expect(finished.inferenceReview?.initialCandidates).toBe(candidateCount);
    expect(finished.inferenceReview?.steps[0]?.remainingCandidates).toBe(1);
    expect(JSON.stringify(finished)).not.toMatch(/ipc|merchant|herta/);
    const replay = await dataOf<{ game: PublicGame }>(
      await SELF.fetch(`https://fireflydle.games/api/replays/${game.id}`, { headers: { cookie } }),
    );
    expect(replay.game.inferenceReview).toEqual(finished.inferenceReview);
    expect(
      currencyWarsManifest.modes.find((mode) => mode.id === "currency-wars")?.maxAttempts,
    ).toBe(game.maxAttempts);
  });

  it("星神题池在恢复、结算、回放和分享中保持同一无剧透图片快照", async () => {
    const { cookie } = await createSession();
    const create = () =>
      SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ modeId: "aeon", activityId: "practice" }),
      });
    const game = await dataOf<PublicGame>(await create());
    expect(game.modeId).toBe("aeon");
    expect(game.activityId).toBe("practice");
    expect(game.maxAttempts).toBe(6);
    expect(game.answer).toBeNull();
    expect(game.aeonImagePath).toMatch(/^\/assets\/aeons\/\d{2}\.webp$/);
    expect(game.aeonImageFocus).toHaveLength(2);
    expect(game.fieldDefinitions?.map((field) => field.id)).toEqual(["image"]);
    expect((await dataOf<PublicGame>(await create())).id).toBe(game.id);

    const stored = await env.DB.prepare(
      "SELECT target_character_id, target_payload_json FROM games WHERE id = ?",
    )
      .bind(game.id)
      .first<{ target_character_id: string; target_payload_json: string }>();
    if (!stored) throw new Error("星神 fixture 缺少目标");
    const targetPayload = JSON.parse(stored.target_payload_json) as {
      names: Record<string, string>;
    };
    const activeJson = JSON.stringify(game);
    expect(activeJson).not.toContain(targetPayload.names["zh-CN"]);
    expect(activeJson).not.toContain(targetPayload.names.en);

    const candidates = JSON.parse(
      (
        await env.DB.prepare("SELECT candidate_pool_json FROM games WHERE id = ?")
          .bind(game.id)
          .first<{ candidate_pool_json: string }>()
      )?.candidate_pool_json ?? "{}",
    ) as Record<string, unknown>;
    const wrong = Object.keys(candidates).find((id) => id !== stored.target_character_id);
    if (!wrong) throw new Error("星神 fixture 缺少错误候选");
    const afterWrong = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: wrong }),
      }),
    );
    expect(afterWrong.status).toBe("active");
    expect(afterWrong.answer).toBeNull();
    expect(afterWrong.aeonImagePath).toBe(game.aeonImagePath);
    expect(afterWrong.aeonImageFocus).toEqual(game.aeonImageFocus);
    expect(afterWrong.guesses[0]?.cells).toEqual([
      { field: "image", state: "miss", direction: "none" },
    ]);

    const resumed = await dataOf<PublicGame>(await create());
    expect(resumed.id).toBe(game.id);
    expect(resumed.aeonImagePath).toBe(game.aeonImagePath);
    expect(resumed.aeonImageFocus).toEqual(game.aeonImageFocus);
    const finished = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: stored.target_character_id }),
      }),
    );
    expect(finished.status).toBe("won");
    expect(finished.answer?.id).toBe(stored.target_character_id);
    expect(finished.aeonImagePath).toBe(game.aeonImagePath);
    expect(finished).not.toHaveProperty("inferenceReview");

    const replay = await dataOf<{ kind: string; game: PublicGame }>(
      await SELF.fetch(`https://fireflydle.games/api/replays/${game.id}`, {
        headers: { cookie },
      }),
    );
    expect(replay.kind).toBe("solo");
    expect(replay.game.id).toBe(game.id);
    expect(replay.game.aeonImagePath).toBe(game.aeonImagePath);
    expect(replay.game.aeonImageFocus).toEqual(game.aeonImageFocus);
    expect(replay.game.guesses).toEqual(finished.guesses);
    expect(replay.game).not.toHaveProperty("inferenceReview");

    const shared = await dataOf<{ url: string }>(
      await SELF.fetch(`https://fireflydle.games/api/replays/${game.id}/share`, {
        method: "POST",
        headers: { cookie },
      }),
    );
    const shareToken = new URL(shared.url).pathname.split("/").at(-1);
    const sharedReplay = await dataOf<{ kind: string; game: PublicGame }>(
      await SELF.fetch(`https://fireflydle.games/api/replays/shared/${shareToken}`),
    );
    expect(sharedReplay.game.id).toBe(game.id);
    expect(sharedReplay.game.aeonImagePath).toBe(game.aeonImagePath);
    expect(sharedReplay.game.aeonImageFocus).toEqual(game.aeonImageFocus);
  });

  it("旧 daily/random 请求只在创建边界映射且公开响应只返回新版契约", async () => {
    const { cookie } = await createSession();
    const create = (difficulty: "casual" | "hard") =>
      SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "daily", difficulty }),
      });
    const [casualResponse, hardResponse] = await Promise.all([create("casual"), create("hard")]);
    const casual = await dataOf<PublicGame>(casualResponse);
    const hard = await dataOf<PublicGame>(hardResponse);
    expect(hard.id).toBe(casual.id);
    expect(casual.maxAttempts).toBe(6);
    expect(hard.maxAttempts).toBe(6);
    expect(casual).toMatchObject({ modeId: "playable", activityId: "daily" });
    expect(casual).not.toHaveProperty("mode");
    expect(casual).not.toHaveProperty("difficulty");

    const concede = async (id: string) =>
      dataOf<PublicGame>(
        await SELF.fetch(`https://fireflydle.games/api/games/${id}/concede`, {
          method: "POST",
          headers: { cookie },
        }),
      );
    const dailyConcede = await SELF.fetch(
      `https://fireflydle.games/api/games/${casual.id}/concede`,
      { method: "POST", headers: { cookie } },
    );
    expect(dailyConcede.status).toBe(403);
    const dailyDone = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${casual.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      }),
    );
    expect(dailyDone.answer?.id).toBe(character.id);
    expect(dailyDone.answer).not.toHaveProperty("officialId");
    expect(dailyDone.guesses[0]?.character).not.toHaveProperty("enabled");

    const randomFirst = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );
    const randomResume = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "hard" }),
      }),
    );
    expect(randomResume.id).toBe(randomFirst.id);
    await concede(randomFirst.id);
    const randomNext = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "hard" }),
      }),
    );
    expect(randomNext.id).not.toBe(randomFirst.id);

    const current = await dataOf<{ daily: PublicGame | null; practice: PublicGame | null }>(
      await SELF.fetch("https://fireflydle.games/api/games/current", { headers: { cookie } }),
    );
    expect(current.daily?.id).toBe(dailyDone.id);
    expect(current.daily?.status).toBe("won");
    expect(current.practice?.id).toBe(randomNext.id);
    expect(current).not.toHaveProperty("random");
    const schedule = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM daily_target_schedule",
    ).first<{ count: number }>();
    expect(schedule?.count).toBe(1);
  });

  it("并发猜测与认输只产生一个最终裁决", async () => {
    const { cookie } = await createSession();
    const game = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ modeId: "playable", activityId: "practice" }),
      }),
    );

    const [guess, concede] = await Promise.all([
      SELF.fetch(`https://fireflydle.games/api/games/${game.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      }),
      SELF.fetch(`https://fireflydle.games/api/games/${game.id}/concede`, {
        method: "POST",
        headers: { cookie },
      }),
    ]);
    expect([guess.status, concede.status].sort()).toEqual([200, 409]);

    const stored = await env.DB.prepare(
      `SELECT games.status, game_results.result,
         (SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id) AS guess_count
       FROM games
       JOIN game_results ON game_results.game_id = games.id
       WHERE games.id = ?`,
    )
      .bind(game.id)
      .first<{ status: string; result: string; guess_count: number }>();
    expect(stored?.result).toBe(stored?.status);
    expect(stored?.guess_count).toBe(stored?.status === "won" ? 1 : 0);
  });
});

describe("普通角色无尽玩法", () => {
  async function seedEndlessWrongCandidates(): Promise<string[]> {
    const ids = Array.from({ length: 6 }, (_, index) => `endless-wrong-${index + 1}`);
    const now = Date.now();
    for (const [index, id] of ids.entries()) {
      const candidate: Character = {
        ...character,
        id,
        officialId: `endless-${index + 1}`,
        baseCharacterId: id,
        names: {
          "zh-CN": `无尽错误${index + 1}`,
          en: `Wrong ${index + 1}`,
          ja: `不正解${index + 1}`,
        },
        targetEligible: false,
      };
      await env.DB.prepare(
        `INSERT OR REPLACE INTO characters
           (id, official_id, base_character_id, element, path, rarity, faction_id,
            faction_group_id, release_version_id, release_order, enabled, target_eligible,
            source_revision, payload_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`,
      )
        .bind(
          candidate.id,
          candidate.officialId,
          candidate.baseCharacterId,
          candidate.element,
          candidate.path,
          candidate.rarity,
          candidate.factionId,
          candidate.factionGroupId,
          candidate.releaseVersionId,
          candidate.releaseOrder,
          candidate.sourceRevision,
          JSON.stringify(candidate),
          now,
          now,
        )
        .run();
    }
    return ids;
  }

  it("恢复同一局，跳过只可使用一次，四次后续失败令生命归零", async () => {
    const wrongIds = await seedEndlessWrongCandidates();
    const { cookie } = await createSession();
    const create = () =>
      SELF.fetch("https://fireflydle.games/api/endless", {
        method: "POST",
        headers: { cookie },
      });
    const started = await dataOf<PublicEndlessRun>(await create());
    expect(started).toMatchObject({ lives: 5, clears: 0, maxAttempts: 6, skipAvailable: true });
    expect(started.answer).toBeNull();
    expect((await dataOf<PublicEndlessRun>(await create())).id).toBe(started.id);

    const skipped = await dataOf<PublicEndlessRun>(
      await SELF.fetch(`https://fireflydle.games/api/endless/${started.id}/skip`, {
        method: "POST",
        headers: { cookie },
      }),
    );
    expect(skipped).toMatchObject({ lives: 4, clears: 0, skipAvailable: false, roundNumber: 2 });
    expect(skipped.lastRound).toMatchObject({ result: "skipped", answer: { id: character.id } });
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/endless/${started.id}/skip`, {
          method: "POST",
          headers: { cookie },
        })
      ).status,
    ).toBe(409);

    let run = skipped;
    for (let round = 0; round < 4; round += 1) {
      for (const characterId of wrongIds) {
        run = await dataOf<PublicEndlessRun>(
          await SELF.fetch(`https://fireflydle.games/api/endless/${started.id}/guesses`, {
            method: "POST",
            headers: { cookie, "content-type": "application/json" },
            body: JSON.stringify({ characterId }),
          }),
        );
      }
    }
    expect(run).toMatchObject({ status: "finished", lives: 0, clears: 0, totalGuesses: 24 });
    expect(run.answer?.id).toBe(character.id);
    expect(run.lastRound).toMatchObject({ result: "lost", guessCount: 6 });
  });

  it("猜中后不消耗生命并立即开始下一道六猜题", async () => {
    const { cookie } = await createSession();
    const run = await dataOf<PublicEndlessRun>(
      await SELF.fetch("https://fireflydle.games/api/endless", {
        method: "POST",
        headers: { cookie },
      }),
    );
    const next = await dataOf<PublicEndlessRun>(
      await SELF.fetch(`https://fireflydle.games/api/endless/${run.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      }),
    );
    expect(next).toMatchObject({ lives: 5, clears: 1, totalGuesses: 1, roundNumber: 2 });
    expect(next.guesses).toEqual([]);
    expect(next.answer).toBeNull();
    expect(next.lastRound).toMatchObject({ result: "won", answer: { id: character.id } });
  });

  it("排行榜按通关数、总猜测次数和总耗时排序", async () => {
    const sessions = await Promise.all(
      ["board_a", "board_b", "board_c"].map((suffix) => createRegisteredSession(suffix)),
    );
    const scores = [
      { clears: 7, guesses: 20, elapsed: 90_000 },
      { clears: 7, guesses: 18, elapsed: 100_000 },
      { clears: 7, guesses: 18, elapsed: 70_000 },
    ];
    for (const [index, session] of sessions.entries()) {
      const run = await dataOf<PublicEndlessRun>(
        await SELF.fetch("https://fireflydle.games/api/endless", {
          method: "POST",
          headers: { cookie: session.cookie },
        }),
      );
      const score = scores[index];
      if (!score) throw new Error("缺少排行测试分数");
      const startedAt = Date.now() - score.elapsed;
      await env.DB.prepare(
        `UPDATE endless_runs SET status = 'finished', lives = 0, clears = ?, total_guesses = ?,
         started_at = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(score.clears, score.guesses, startedAt, Date.now(), Date.now(), run.id)
        .run();
    }
    const board = await dataOf<EndlessLeaderboardEntry[]>(
      await SELF.fetch("https://fireflydle.games/api/leaderboards/endless"),
    );
    const entries = board.filter((entry) => entry.displayName.startsWith("Reg board_"));
    expect(entries.map((entry) => entry.displayName)).toEqual([
      "Reg board_c",
      "Reg board_b",
      "Reg board_a",
    ]);
  });
});

describe("排行榜准入", () => {
  it("不再公开每日榜，Elo 榜只展示未隐藏的注册用户", async () => {
    const registered = await createRegisteredSession("public_boards");
    const guest = await createSession();
    expect(registered.data.user.leaderboardEligible).toBe(true);

    expect((await SELF.fetch("https://fireflydle.games/api/leaderboards/daily")).status).toBe(404);

    const elo = await dataOf<Array<{ displayName: string; elo: number; rankedMatches: number }>>(
      await SELF.fetch("https://fireflydle.games/api/leaderboards/elo"),
    );
    expect(elo).toContainEqual(
      expect.objectContaining({
        displayName: registered.data.user.displayName,
        elo: 1000,
        rankedMatches: 0,
      }),
    );
    expect(elo.some((entry) => entry.displayName === guest.data.user.displayName)).toBe(false);

    await env.DB.prepare("UPDATE users SET leaderboard_eligible = 0 WHERE id = ?")
      .bind(registered.data.user.id)
      .run();
    const eloAfterHide = await dataOf<Array<{ displayName: string }>>(
      await SELF.fetch("https://fireflydle.games/api/leaderboards/elo"),
    );
    expect(
      eloAfterHide.some((entry) => entry.displayName === registered.data.user.displayName),
    ).toBe(false);
  });
});

describe("匹配、SQLite Durable Object 与 WebSocket", () => {
  it("普通角色私人房在加入前共享配置、开局后锁定并且不计 Elo", async () => {
    const wrongCandidates = Array.from({ length: 4 }, (_, index) => ({
      ...snapshotCandidate,
      id: `private-wrong-${index}`,
      officialId: `private-wrong-${index}`,
      baseCharacterId: `private-wrong-${index}`,
      names: {
        "zh-CN": `私人房错误候选${index}`,
        en: `Private wrong ${index}`,
        ja: `プライベート候補${index}`,
      },
    }));
    for (const candidate of wrongCandidates) await seedSnapshotCandidate(candidate);

    const owner = await createSession("test:private-config-owner");
    const opponent = await createSession("test:private-config-opponent");
    const createdResponse = await SELF.fetch("https://fireflydle.games/api/rooms", {
      method: "POST",
      headers: { cookie: owner.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        modeId: "playable",
        activityId: "private-room",
        format: 1,
        roundTimeSeconds: null,
        maxAttempts: 4,
      }),
    });
    expect(createdResponse.status).toBe(201);
    const created = await dataOf<{
      roomId: string;
      code: string;
      snapshot: RoomSnapshot;
    }>(createdResponse);
    const expectedConfiguration = {
      modeId: "playable",
      activityId: "private-room",
      format: 1,
      roundTimeSeconds: null,
      maxAttempts: 4,
    } as const;
    expect(created.snapshot).toMatchObject({
      state: "waiting",
      ranked: false,
      configuration: expectedConfiguration,
    });

    const preview = await dataOf<RoomPreviewResponse>(
      await SELF.fetch(
        `https://fireflydle.games/api/rooms/preview?code=${encodeURIComponent(created.code)}`,
        { headers: { cookie: opponent.cookie } },
      ),
    );
    expect(preview.configuration).toEqual(expectedConfiguration);

    const joinedResponse = await SELF.fetch("https://fireflydle.games/api/rooms/join", {
      method: "POST",
      headers: { cookie: opponent.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        code: created.code,
        format: 7,
        roundTimeSeconds: 30,
        maxAttempts: 8,
      }),
    });
    expect(joinedResponse.status).toBe(200);
    const joined = await dataOf<{ snapshot: RoomSnapshot }>(joinedResponse);
    expect(joined.snapshot).toMatchObject({
      state: "playing",
      roundEndsAt: null,
      configuration: expectedConfiguration,
    });

    const [ownerResponse, opponentResponse] = await Promise.all([
      SELF.fetch(`https://fireflydle.games/api/rooms/${created.roomId}/socket`, {
        headers: { cookie: owner.cookie, upgrade: "websocket" },
      }),
      SELF.fetch(`https://fireflydle.games/api/rooms/${created.roomId}/socket`, {
        headers: { cookie: opponent.cookie, upgrade: "websocket" },
      }),
    ]);
    const ownerSocket = ownerResponse.webSocket;
    const opponentSocket = opponentResponse.webSocket;
    expect(ownerSocket).not.toBeNull();
    expect(opponentSocket).not.toBeNull();
    if (!ownerSocket || !opponentSocket) return;
    ownerSocket.accept();
    opponentSocket.accept();
    const [ownerPlaying, opponentPlaying] = await Promise.all([
      nextSocketSnapshot(ownerSocket, (snapshot) => snapshot.state === "playing"),
      nextSocketSnapshot(opponentSocket, (snapshot) => snapshot.state === "playing"),
    ]);
    expect(ownerPlaying.configuration).toEqual(expectedConfiguration);
    expect(opponentPlaying.configuration).toEqual(expectedConfiguration);

    for (const candidate of wrongCandidates) {
      ownerSocket.send(
        JSON.stringify({
          type: "guess",
          characterId: candidate.id,
          actionId: crypto.randomUUID(),
        }),
      );
      await nextSocketSnapshot(
        ownerSocket,
        (snapshot) => snapshot.ownGuesses.length === wrongCandidates.indexOf(candidate) + 1,
      );
    }
    const exhaustedMessage = nextSocketMessage(ownerSocket);
    ownerSocket.send(
      JSON.stringify({
        type: "guess",
        characterId: character.id,
        actionId: crypto.randomUUID(),
      }),
    );
    expect(await exhaustedMessage).toMatchObject({
      type: "error",
      code: "GAME_ATTEMPTS_EXHAUSTED",
    });

    opponentSocket.send(
      JSON.stringify({
        type: "guess",
        characterId: character.id,
        actionId: crypto.randomUUID(),
      }),
    );
    const finished = await nextSocketSnapshot(
      opponentSocket,
      (snapshot) => snapshot.state === "finished",
    );
    expect(finished).toMatchObject({ ranked: false, ratingChanges: [] });
    await SELF.fetch(`https://fireflydle.games/api/replays/${created.roomId}`, {
      headers: { cookie: owner.cookie },
    });
    const archived = await env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM matches WHERE id = ?) AS matches_count,
         (SELECT COUNT(*) FROM rating_events WHERE match_id = ?) AS rating_events_count`,
    )
      .bind(created.roomId, created.roomId)
      .first<{ matches_count: number; rating_events_count: number }>();
    expect(archived).toEqual({ matches_count: 1, rating_events_count: 0 });
    ownerSocket.close(1000, "test-complete");
    opponentSocket.close(1000, "test-complete");
  });

  it("私人房通过 WebSocket 始终使用创建时的候选与字段规则快照", async () => {
    await seedSnapshotCandidate();
    const owner = await createSession();
    const opponent = await createSession();
    const created = await SELF.fetch("https://fireflydle.games/api/rooms", {
      method: "POST",
      headers: { cookie: owner.cookie, "content-type": "application/json" },
      body: JSON.stringify({ format: 1 }),
    });
    expect(created.status).toBe(201);
    const room = await dataOf<{ roomId: string; code: string }>(created);

    const publishedCandidate = { ...snapshotCandidate, element: character.element };
    await env.DB.prepare(
      `UPDATE characters
       SET element = ?, payload_json = ?, enabled = 0, target_eligible = 0, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        publishedCandidate.element,
        JSON.stringify(publishedCandidate),
        Date.now(),
        snapshotCandidate.id,
      )
      .run();

    const joined = await SELF.fetch("https://fireflydle.games/api/rooms/join", {
      method: "POST",
      headers: { cookie: opponent.cookie, "content-type": "application/json" },
      body: JSON.stringify({ code: room.code }),
    });
    expect(joined.status).toBe(200);

    const socketResponse = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${room.roomId}/socket`,
      { headers: { cookie: owner.cookie, upgrade: "websocket" } },
    );
    expect(socketResponse.status).toBe(101);
    const socket = socketResponse.webSocket;
    expect(socket).not.toBeNull();
    if (!socket) return;
    socket.accept();
    await nextSocketSnapshot(socket, (snapshot) => snapshot.state === "playing");

    socket.send(
      JSON.stringify({
        type: "guess",
        characterId: snapshotCandidate.id,
        actionId: crypto.randomUUID(),
      }),
    );
    const updated = await nextSocketSnapshot(
      socket,
      (snapshot) => snapshot.ownGuesses.length === 1,
    );
    expect(updated.ownGuesses[0]?.cells[0]).toMatchObject({
      field: "element",
      state: "miss",
    });
    socket.send(
      JSON.stringify({
        type: "guess",
        characterId: character.id,
        actionId: crypto.randomUUID(),
      }),
    );
    const finished = await nextSocketSnapshot(socket, (snapshot) => snapshot.state === "finished");
    expect(finished.state).toBe("finished");

    const replayResponse = await SELF.fetch(`https://fireflydle.games/api/replays/${room.roomId}`, {
      headers: { cookie: owner.cookie },
    });
    expect(replayResponse.status).toBe(200);
    const replay = await dataOf<ReplayResponse>(replayResponse);
    expect(replay.kind).toBe("multiplayer");
    if (replay.kind !== "multiplayer") return;
    expect(replay.match).toMatchObject({
      modeId: "playable",
      activityId: "private-room",
      ranked: false,
    });
    expect(replay.match.rounds[0]?.answer.element).toBe(character.element);

    const archived = await env.DB.prepare(
      `SELECT mode_id, activity_id, pool_rule_version, manifest_version,
              candidate_pool_json, field_rules_json,
              (SELECT COUNT(*) FROM rating_events WHERE match_id = matches.id) AS rating_events_count
       FROM matches WHERE id = ?`,
    )
      .bind(room.roomId)
      .first<{
        mode_id: string;
        activity_id: string;
        pool_rule_version: string;
        manifest_version: string;
        candidate_pool_json: string;
        field_rules_json: string;
        rating_events_count: number;
      }>();
    expect(archived).toMatchObject({
      mode_id: "playable",
      activity_id: "private-room",
      rating_events_count: 0,
      pool_rule_version: expect.stringMatching(/^\d+\.\d+\.\d+$/u),
      manifest_version: expect.stringMatching(/^\d+\.\d+\.\d+$/u),
    });
    expect(JSON.parse(archived?.candidate_pool_json ?? "{}")).toHaveProperty(snapshotCandidate.id);
    expect(JSON.parse(archived?.field_rules_json ?? "{}")).toMatchObject({
      rules: expect.arrayContaining([{ field: "element", comparison: "exact" }]),
    });
    socket.close(1000, "test-complete");
  });

  it("房间序列化字段规则后不受规则来源对象变更影响", async () => {
    const owner = await createSession();
    const opponent = await createSession();
    const roomId = crypto.randomUUID();
    const startedAt = Date.now();
    await env.DB.prepare(
      `INSERT INTO room_directory
         (room_id, room_code, durable_object_name, owner_user_id, state, ranked,
          match_format, created_at, expires_at)
       VALUES (?, 'FLD42', ?, ?, 'active', 0, 1, ?, ?)`,
    )
      .bind(roomId, roomId, owner.data.user.id, startedAt, startedAt + 60_000)
      .run();
    const contentSnapshot = createPlayableMultiplayerContentSnapshot(
      [character, snapshotCandidate],
      [character],
    );
    contentSnapshot.fieldRules = {
      rules: [{ field: "element", comparison: "exact" }],
      definitions: contentSnapshot.fieldRules.definitions.filter((field) => field.id === "element"),
    };
    await env.GAME_ROOM.getByName(roomId).initialize({
      roomId,
      code: "FLD42",
      format: 1,
      activityId: "private-room",
      owner: {
        userId: owner.data.user.id,
        displayName: owner.data.user.displayName,
        isGuest: true,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: opponent.data.user.id,
        displayName: opponent.data.user.displayName,
        isGuest: true,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot,
      now: startedAt,
    });

    contentSnapshot.fieldRules.rules = [{ field: "faction", comparison: "faction" }];
    contentSnapshot.candidateSnapshots[snapshotCandidate.id] = {
      ...snapshotCandidate,
      element: character.element,
    };
    const socketResponse = await SELF.fetch(`https://fireflydle.games/api/rooms/${roomId}/socket`, {
      headers: { cookie: owner.cookie, upgrade: "websocket" },
    });
    expect(socketResponse.status).toBe(101);
    const socket = socketResponse.webSocket;
    if (!socket) return;
    socket.accept();
    await nextSocketSnapshot(socket, (snapshot) => snapshot.state === "playing");
    socket.send(
      JSON.stringify({
        type: "guess",
        characterId: snapshotCandidate.id,
        actionId: crypto.randomUUID(),
      }),
    );
    const updated = await nextSocketSnapshot(
      socket,
      (snapshot) => snapshot.ownGuesses.length === 1,
    );
    expect(updated.ownGuesses[0]?.cells).toEqual([
      { field: "element", state: "miss", direction: "none" },
    ]);
    socket.close(1000, "test-complete");
  });

  it("只在回合结束后公开答案，连续平局也会一直加赛", async () => {
    const roomId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const opponentId = crypto.randomUUID();
    const startedAt = Date.now();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    const playing = await roomObject.initialize({
      roomId,
      code: "DRW22",
      format: 3,
      activityId: "private-room",
      owner: {
        userId: ownerId,
        displayName: "Draw Left",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: opponentId,
        displayName: "Draw Right",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
      now: startedAt,
    });
    expect(playing.roundAnswer).toBeNull();
    expect(playing.nextRoundAt).toBeNull();

    let roundStartedAt = startedAt;
    for (let round = 1; round <= 4; round += 1) {
      const ended = await roomObject.snapshot(ownerId, roundStartedAt + MULTIPLAYER_ROUND_MS + 1);
      expect(ended.ok).toBe(true);
      if (!ended.ok) return;
      expect(ended.snapshot.state).toBe("round-ended");
      expect(ended.snapshot.round).toBe(round);
      expect(ended.snapshot.roundAnswer?.id).toBe(character.id);
      expect(ended.snapshot.roundWinnerId).toBeNull();
      expect(ended.snapshot.winnerId).toBeNull();
      expect(ended.snapshot.consecutiveDraws).toBe(round);
      const nextRoundAt = ended.snapshot.nextRoundAt;
      expect(nextRoundAt).not.toBeNull();
      if (nextRoundAt === null) return;
      roundStartedAt = nextRoundAt + 1;
      const advanced = await roomObject.snapshot(ownerId, roundStartedAt);
      expect(advanced.ok).toBe(true);
      if (!advanced.ok) return;
      expect(advanced.snapshot.state).toBe("playing");
      expect(advanced.snapshot.round).toBe(round + 1);
      expect(advanced.snapshot.roundAnswer).toBeNull();
    }
  });

  it("只有对手接受提议后才以平局结束整场", async () => {
    const roomId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const opponentId = crypto.randomUUID();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    await roomObject.initialize({
      roomId,
      code: "AGR42",
      format: 3,
      activityId: "private-room",
      owner: {
        userId: ownerId,
        displayName: "Offer Left",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: opponentId,
        displayName: "Offer Right",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
    });

    const offered = await roomObject.offerDraw(ownerId);
    expect(offered.ok && offered.snapshot.drawOfferByPlayerId).toBe(ownerId);
    expect((await roomObject.respondDraw(ownerId, true)).ok).toBe(false);
    const rejected = await roomObject.respondDraw(opponentId, false);
    expect(rejected.ok && rejected.snapshot.drawOfferByPlayerId).toBeNull();
    expect(rejected.ok && rejected.snapshot.state).toBe("playing");

    await roomObject.offerDraw(ownerId);
    const accepted = await roomObject.respondDraw(opponentId, true);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.snapshot.state).toBe("finished");
    expect(accepted.snapshot.finishReason).toBe("agreed-draw");
    expect(accepted.snapshot.winnerId).toBeNull();
    expect(accepted.snapshot.drawOfferByPlayerId).toBeNull();
  });

  it("通过 WebSocket 向双方同步跳过的待确认、取消和执行状态", async () => {
    const owner = await createSession("test:skip-owner");
    const opponent = await createSession("test:skip-opponent");
    const created = await SELF.fetch("https://fireflydle.games/api/rooms", {
      method: "POST",
      headers: { cookie: owner.cookie, "content-type": "application/json" },
      body: JSON.stringify({ format: 3 }),
    });
    const room = await dataOf<{ roomId: string; code: string }>(created);
    await SELF.fetch("https://fireflydle.games/api/rooms/join", {
      method: "POST",
      headers: { cookie: opponent.cookie, "content-type": "application/json" },
      body: JSON.stringify({ code: room.code }),
    });

    const [ownerResponse, opponentResponse] = await Promise.all([
      SELF.fetch(`https://fireflydle.games/api/rooms/${room.roomId}/socket`, {
        headers: { cookie: owner.cookie, upgrade: "websocket" },
      }),
      SELF.fetch(`https://fireflydle.games/api/rooms/${room.roomId}/socket`, {
        headers: { cookie: opponent.cookie, upgrade: "websocket" },
      }),
    ]);
    const ownerSocket = ownerResponse.webSocket;
    const opponentSocket = opponentResponse.webSocket;
    expect(ownerSocket).not.toBeNull();
    expect(opponentSocket).not.toBeNull();
    if (!ownerSocket || !opponentSocket) return;
    ownerSocket.accept();
    opponentSocket.accept();
    const [ownerPlaying] = await Promise.all([
      nextSocketSnapshot(ownerSocket, (snapshot) => snapshot.state === "playing"),
      nextSocketSnapshot(opponentSocket, (snapshot) => snapshot.state === "playing"),
    ]);

    const ownerPending = nextSocketSnapshot(
      ownerSocket,
      (snapshot) => snapshot.roundSkip.status === "pending",
    );
    const opponentPending = nextSocketSnapshot(
      opponentSocket,
      (snapshot) => snapshot.roundSkip.status === "pending",
    );
    ownerSocket.send(JSON.stringify({ type: "request-skip" }));
    const pendingSnapshots = await Promise.all([ownerPending, opponentPending]);
    expect(pendingSnapshots.map((snapshot) => snapshot.roundSkip)).toEqual([
      pendingSnapshots[0]?.roundSkip,
      pendingSnapshots[0]?.roundSkip,
    ]);

    const ownerCancelled = nextSocketSnapshot(
      ownerSocket,
      (snapshot) => snapshot.roundSkip.status === "cancelled",
    );
    const opponentCancelled = nextSocketSnapshot(
      opponentSocket,
      (snapshot) => snapshot.roundSkip.status === "cancelled",
    );
    opponentSocket.send(JSON.stringify({ type: "respond-skip", accepted: false }));
    const cancelledSnapshots = await Promise.all([ownerCancelled, opponentCancelled]);
    expect(cancelledSnapshots.map((snapshot) => snapshot.roundSkip)).toEqual([
      {
        status: "cancelled",
        round: ownerPlaying.round,
        requestedByPlayerId: owner.data.user.id,
        reason: "declined",
      },
      {
        status: "cancelled",
        round: ownerPlaying.round,
        requestedByPlayerId: owner.data.user.id,
        reason: "declined",
      },
    ]);

    const ownerPendingAgain = nextSocketSnapshot(
      ownerSocket,
      (snapshot) => snapshot.roundSkip.status === "pending",
    );
    const opponentPendingAgain = nextSocketSnapshot(
      opponentSocket,
      (snapshot) => snapshot.roundSkip.status === "pending",
    );
    ownerSocket.send(JSON.stringify({ type: "request-skip" }));
    await Promise.all([ownerPendingAgain, opponentPendingAgain]);
    const ownerExecuted = nextSocketSnapshot(
      ownerSocket,
      (snapshot) => snapshot.roundSkip.status === "executed",
    );
    const opponentExecuted = nextSocketSnapshot(
      opponentSocket,
      (snapshot) => snapshot.roundSkip.status === "executed",
    );
    opponentSocket.send(JSON.stringify({ type: "respond-skip", accepted: true }));
    const executedSnapshots = await Promise.all([ownerExecuted, opponentExecuted]);
    for (const snapshot of executedSnapshots) {
      expect(snapshot).toMatchObject({
        state: "playing",
        round: ownerPlaying.round + 1,
        roundAnswer: null,
        players: [{ score: 0 }, { score: 0 }],
        roundSkip: {
          status: "executed",
          round: ownerPlaying.round,
          requestedByPlayerId: owner.data.user.id,
          acceptedByPlayerId: opponent.data.user.id,
        },
      });
    }
    ownerSocket.close(1000, "test-complete");
    opponentSocket.close(1000, "test-complete");
  });

  it("跳过拒绝或超时保持本题，并发确认只推进一次", async () => {
    const roomId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const opponentId = crypto.randomUUID();
    const startedAt = Date.now();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    await roomObject.initialize({
      roomId,
      code: "SKP42",
      format: 3,
      activityId: "private-room",
      owner: {
        userId: ownerId,
        displayName: "Skip Left",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: opponentId,
        displayName: "Skip Right",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
      now: startedAt,
    });

    await roomObject.requestSkip(ownerId, startedAt + 10);
    const declined = await roomObject.respondSkip(opponentId, false, startedAt + 20);
    expect(declined.ok && declined.snapshot).toMatchObject({
      state: "playing",
      round: 1,
      players: [{ score: 0 }, { score: 0 }],
      roundSkip: { status: "cancelled", reason: "declined" },
    });

    const pending = await roomObject.requestSkip(opponentId, startedAt + 30);
    expect(pending.ok).toBe(true);
    if (!pending.ok || pending.snapshot.roundSkip.status !== "pending") return;
    const timedOut = await roomObject.snapshot(ownerId, pending.snapshot.roundSkip.expiresAt + 1);
    expect(timedOut.ok && timedOut.snapshot).toMatchObject({
      state: "playing",
      round: 1,
      players: [{ score: 0 }, { score: 0 }],
      roundSkip: { status: "cancelled", reason: "timeout" },
    });

    await roomObject.requestSkip(ownerId, pending.snapshot.roundSkip.expiresAt + 2);
    const confirmations = await Promise.all([
      roomObject.respondSkip(opponentId, true, pending.snapshot.roundSkip.expiresAt + 3),
      roomObject.respondSkip(opponentId, true, pending.snapshot.roundSkip.expiresAt + 3),
    ]);
    expect(confirmations.filter((result) => result.ok)).toHaveLength(1);
    const final = await roomObject.snapshot(ownerId, pending.snapshot.roundSkip.expiresAt + 4);
    expect(final.ok && final.snapshot).toMatchObject({
      state: "playing",
      round: 2,
      consecutiveDraws: 0,
      roundAnswer: null,
      players: [{ score: 0 }, { score: 0 }],
      roundSkip: { status: "executed", round: 1 },
    });
  });

  it("固定 BO3 随机匹配在双方跳过后返回双方永久 Elo 变化", async () => {
    const roomId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const opponentId = crypto.randomUUID();
    const startedAt = Date.now();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    await roomObject.initialize({
      roomId,
      code: "ELR24",
      activityId: "ranked-match",
      format: 3,
      owner: {
        userId: ownerId,
        displayName: "Rated Left",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: opponentId,
        displayName: "Rated Right",
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
      now: startedAt,
    });
    const firstWin = await roomObject.guess(
      ownerId,
      character.id,
      crypto.randomUUID(),
      startedAt + 100,
    );
    expect(firstWin.ok).toBe(true);
    if (!firstWin.ok || firstWin.snapshot.nextRoundAt === null) return;
    const roundTwoAt = firstWin.snapshot.nextRoundAt + 1;
    await roomObject.snapshot(ownerId, roundTwoAt);
    await roomObject.requestSkip(ownerId, roundTwoAt + 1);
    const skipped = await roomObject.respondSkip(opponentId, true, roundTwoAt + 2);
    expect(skipped.ok && skipped.snapshot).toMatchObject({
      state: "playing",
      round: 3,
      roundSkip: { status: "executed", round: 2 },
    });

    const won = await roomObject.guess(ownerId, character.id, crypto.randomUUID(), roundTwoAt + 3);
    expect(won.ok).toBe(true);
    if (!won.ok) return;
    expect(won.snapshot.state).toBe("finished");
    expect(won.snapshot.roundAnswer?.id).toBe(character.id);
    expect(won.snapshot).toMatchObject({
      modeId: "playable",
      activityId: "ranked-match",
      ranked: true,
      ratingChanges: [
        { playerId: ownerId, before: 1000, after: 1024, delta: 24 },
        { playerId: opponentId, before: 1000, after: 976, delta: -24 },
      ],
    });

    const lost = await roomObject.snapshot(opponentId, roundTwoAt + 4);
    expect(lost.ok).toBe(true);
    if (!lost.ok) return;
    expect(lost.snapshot.ratingChanges).toEqual(won.snapshot.ratingChanges);
  });

  it("并发归档只写入一场比赛和双方各一个评分事件", async () => {
    const left = await createRegisteredSession("single_verdict_left");
    const right = await createRegisteredSession("single_verdict_right");
    const roomId = crypto.randomUUID();
    const startedAt = Date.now();
    await env.DB.prepare(
      `INSERT INTO room_directory
         (room_id, room_code, durable_object_name, owner_user_id, state, ranked,
          match_format, created_at, expires_at)
       VALUES (?, 'ONE42', ?, ?, 'active', 1, 3, ?, ?)`,
    )
      .bind(roomId, roomId, left.data.user.id, startedAt, startedAt + 60_000)
      .run();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    await roomObject.initialize({
      roomId,
      code: "ONE42",
      activityId: "ranked-match",
      format: 3,
      owner: {
        userId: left.data.user.id,
        displayName: left.data.user.displayName,
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: right.data.user.id,
        displayName: right.data.user.displayName,
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
      now: startedAt,
    });

    const first = await roomObject.guess(
      left.data.user.id,
      character.id,
      crypto.randomUUID(),
      startedAt + 1,
    );
    expect(first.ok && first.snapshot.nextRoundAt).not.toBeNull();
    if (!first.ok || first.snapshot.nextRoundAt === null) return;
    const secondRoundAt = first.snapshot.nextRoundAt + 1;
    await roomObject.snapshot(left.data.user.id, secondRoundAt);
    await roomObject.guess(left.data.user.id, character.id, crypto.randomUUID(), secondRoundAt + 1);
    const final = await roomObject.snapshot(left.data.user.id, secondRoundAt + 2);
    expect(final.ok && final.snapshot.state).toBe("finished");
    expect(final.ok && final.snapshot.winnerId).toBe(left.data.user.id);

    expect(
      await Promise.all([
        roomObject.archiveForPlayer(left.data.user.id, secondRoundAt + 3),
        roomObject.archiveForPlayer(right.data.user.id, secondRoundAt + 3),
      ]),
    ).toEqual([true, true]);
    const archived = await env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM matches WHERE id = ?) AS matches_count,
         (SELECT COUNT(*) FROM rating_events WHERE match_id = ?) AS rating_events_count`,
    )
      .bind(roomId, roomId)
      .first<{ matches_count: number; rating_events_count: number }>();
    expect(archived).toEqual({ matches_count: 1, rating_events_count: 2 });
    const ratingEvents = await env.DB.prepare(
      `SELECT user_id, rating_before, rating_after, delta
       FROM rating_events WHERE match_id = ? ORDER BY user_id`,
    )
      .bind(roomId)
      .all<{
        user_id: string;
        rating_before: number;
        rating_after: number;
        delta: number;
      }>();
    expect(ratingEvents.results).toEqual(
      expect.arrayContaining([
        {
          user_id: left.data.user.id,
          rating_before: 1000,
          rating_after: 1024,
          delta: 24,
        },
        {
          user_id: right.data.user.id,
          rating_before: 1000,
          rating_after: 976,
          delta: -24,
        },
      ]),
    );
    const ratings = await env.DB.prepare(
      "SELECT id, elo, ranked_matches FROM users WHERE id IN (?, ?) ORDER BY id",
    )
      .bind(left.data.user.id, right.data.user.id)
      .all<{ id: string; elo: number; ranked_matches: number }>();
    expect(ratings.results).toEqual(
      expect.arrayContaining([
        { id: left.data.user.id, elo: 1024, ranked_matches: 1 },
        { id: right.data.user.id, elo: 976, ranked_matches: 1 },
      ]),
    );
  });

  it("重连与超时竞争后仍只归档断线裁决一次", async () => {
    const left = await createRegisteredSession("timeout_left");
    const right = await createRegisteredSession("timeout_right");
    const roomId = crypto.randomUUID();
    const startedAt = Date.now();
    await env.DB.prepare(
      `INSERT INTO room_directory
         (room_id, room_code, durable_object_name, owner_user_id, state, ranked,
          match_format, created_at, expires_at)
       VALUES (?, 'RCE42', ?, ?, 'active', 0, 1, ?, ?)`,
    )
      .bind(roomId, roomId, left.data.user.id, startedAt, startedAt + 60_000)
      .run();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    await roomObject.initialize({
      roomId,
      code: "RCE42",
      format: 1,
      activityId: "private-room",
      owner: {
        userId: left.data.user.id,
        displayName: left.data.user.displayName,
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: right.data.user.id,
        displayName: right.data.user.displayName,
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
      now: startedAt,
    });
    await roomObject.disconnect(right.data.user.id, startedAt + 1);
    const deadline = startedAt + 1 + RECONNECT_GRACE_MS;
    await Promise.all([
      roomObject.reconnect(right.data.user.id, deadline),
      roomObject.snapshot(left.data.user.id, deadline),
    ]);
    const final = await roomObject.snapshot(left.data.user.id, deadline + 1);
    expect(final.ok && final.snapshot).toMatchObject({
      modeId: "playable",
      activityId: "private-room",
      ranked: false,
      state: "finished",
      finishReason: "disconnect",
      winnerId: left.data.user.id,
      ratingChanges: [],
    });

    await Promise.all([
      roomObject.archiveForPlayer(left.data.user.id, deadline + 2),
      roomObject.archiveForPlayer(right.data.user.id, deadline + 2),
    ]);
    const count = await env.DB.prepare(
      `SELECT COUNT(*) AS count,
              (SELECT COUNT(*) FROM rating_events WHERE match_id = ?) AS rating_events_count
       FROM matches WHERE id = ?`,
    )
      .bind(roomId, roomId)
      .first<{ count: number; rating_events_count: number }>();
    expect(count).toEqual({ count: 1, rating_events_count: 0 });
    const unchanged = await env.DB.prepare(
      "SELECT elo, ranked_matches FROM users WHERE id IN (?, ?) ORDER BY id",
    )
      .bind(left.data.user.id, right.data.user.id)
      .all<{ elo: number; ranked_matches: number }>();
    expect(unchanged.results).toEqual([
      { elo: 1000, ranked_matches: 0 },
      { elo: 1000, ranked_matches: 0 },
    ]);
  });

  it("归档并仅向参赛者返回完整多人复盘", async () => {
    const left = await createRegisteredSession("replay_left");
    const right = await createRegisteredSession("replay_right");
    const outsider = await createSession();
    const roomId = crypto.randomUUID();
    const startedAt = Date.now();
    await env.DB.prepare(
      `INSERT INTO room_directory
         (room_id, room_code, durable_object_name, owner_user_id, state, ranked,
          match_format, created_at, expires_at)
       VALUES (?, 'RPY42', ?, ?, 'active', 1, 3, ?, ?)`,
    )
      .bind(roomId, roomId, left.data.user.id, startedAt, startedAt + 60_000)
      .run();
    const roomObject = env.GAME_ROOM.getByName(roomId);
    await roomObject.initialize({
      roomId,
      code: "RPY42",
      format: 3,
      activityId: "ranked-match",
      owner: {
        userId: left.data.user.id,
        displayName: left.data.user.displayName,
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      opponent: {
        userId: right.data.user.id,
        displayName: right.data.user.displayName,
        isGuest: false,
        rating: 1000,
        rankedMatches: 0,
      },
      contentSnapshot: createPlayableMultiplayerContentSnapshot([character], [character]),
      now: startedAt,
    });

    const first = await roomObject.guess(
      left.data.user.id,
      character.id,
      crypto.randomUUID(),
      startedAt + 10,
    );
    expect(first.ok).toBe(true);
    if (!first.ok || first.snapshot.nextRoundAt === null) return;
    const roundTwoAt = first.snapshot.nextRoundAt + 1;
    await roomObject.snapshot(left.data.user.id, roundTwoAt);
    const second = await roomObject.guess(
      right.data.user.id,
      character.id,
      crypto.randomUUID(),
      roundTwoAt + 10,
    );
    expect(second.ok).toBe(true);
    if (!second.ok || second.snapshot.nextRoundAt === null) return;
    const roundThreeAt = second.snapshot.nextRoundAt + 1;
    await roomObject.snapshot(left.data.user.id, roundThreeAt);
    const finished = await roomObject.guess(
      left.data.user.id,
      character.id,
      crypto.randomUUID(),
      roundThreeAt + 10,
    );
    expect(finished.ok && finished.snapshot.state).toBe("finished");
    expect(await roomObject.archiveForPlayer(left.data.user.id, roundThreeAt + 11)).toBe(true);

    const response = await SELF.fetch(`https://fireflydle.games/api/replays/${roomId}`, {
      headers: { cookie: left.cookie },
    });
    expect(response.status).toBe(200);
    const replay = await dataOf<ReplayResponse>(response);
    expect(replay.kind).toBe("multiplayer");
    if (replay.kind !== "multiplayer") return;
    expect(replay.match.players).toHaveLength(2);
    expect(replay.match.rounds).toHaveLength(3);
    expect(replay.match.rounds.map((round) => round.answer.id)).toEqual([
      character.id,
      character.id,
      character.id,
    ]);
    expect(replay.match.rounds.flatMap((round) => round.guesses)).toHaveLength(3);
    expect(
      replay.match.players.find((player) => player.playerId === left.data.user.id),
    ).toMatchObject({
      score: 2,
      ratingBefore: 1000,
      ratingAfter: 1024,
    });

    const forbidden = await SELF.fetch(`https://fireflydle.games/api/replays/${roomId}`, {
      headers: { cookie: outsider.cookie },
    });
    expect(forbidden.status).toBe(404);
    const stats = await dataOf<{
      recent: Array<{ id: string; scoreFor?: number; scoreAgainst?: number }>;
    }>(
      await SELF.fetch("https://fireflydle.games/api/stats/me", {
        headers: { cookie: left.cookie },
      }),
    );
    expect(stats.recent).toContainEqual(
      expect.objectContaining({ id: roomId, scoreFor: 2, scoreAgainst: 1 }),
    );
  });

  it("固定 BO3 排位并建立只对局内玩家可用的房间", async () => {
    await seedSnapshotCandidate();
    const guest = await createSession();
    const guestRanked = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: guest.cookie },
    });
    expect(guestRanked.status).toBe(401);

    const left = await createRegisteredSession("ranked_left");
    const right = await createRegisteredSession("ranked_right");
    const outsider = await createSession();
    const first = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: left.cookie },
    });
    expect(first.status).toBe(202);
    const waiting = await dataOf<{ status: "waiting"; ticketId: string }>(first);
    expect(waiting.status).toBe("waiting");

    const second = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: right.cookie, "content-type": "application/json" },
      body: JSON.stringify({ format: 7 }),
    });
    const matched = await dataOf<{
      status: "matched";
      ticketId: string;
      roomId: string;
      roomCode: string;
    }>(second);
    expect(matched.status).toBe("matched");

    const status = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${waiting.ticketId}`,
      { headers: { cookie: left.cookie } },
    );
    expect((await dataOf<{ status: string }>(status)).status).toBe("matched");

    const room = await SELF.fetch(`https://fireflydle.games/api/rooms/${matched.roomId}`, {
      headers: { cookie: left.cookie },
    });
    const roomData = await dataOf<{ snapshot: RoomSnapshot }>(room);
    expect(roomData.snapshot).toMatchObject({
      modeId: "playable",
      activityId: "ranked-match",
      format: 3,
      ranked: true,
      ratingChanges: [],
    });
    expect(roomData.snapshot.state).toBe("playing");
    expect(roomData.snapshot.players).toHaveLength(2);
    expect((roomData.snapshot.roundEndsAt ?? 0) - Date.now()).toBeGreaterThan(85_000);

    const publishedCandidate = { ...snapshotCandidate, element: character.element };
    await env.DB.prepare(
      `UPDATE characters
       SET element = ?, payload_json = ?, enabled = 0, target_eligible = 0, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        publishedCandidate.element,
        JSON.stringify(publishedCandidate),
        Date.now(),
        snapshotCandidate.id,
      )
      .run();

    const hiddenRoom = await SELF.fetch(`https://fireflydle.games/api/rooms/${matched.roomId}`, {
      headers: { cookie: outsider.cookie },
    });
    expect(hiddenRoom.status).toBe(404);
    const hiddenLeave = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${matched.roomId}/leave`,
      { method: "POST", headers: { cookie: outsider.cookie } },
    );
    expect(hiddenLeave.status).toBe(404);
    const hiddenSocket = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${matched.roomId}/socket`,
      { headers: { cookie: outsider.cookie, upgrade: "websocket" } },
    );
    expect(hiddenSocket.status).toBe(404);

    const roomObject = env.GAME_ROOM.getByName(matched.roomId);
    const snapshotGuess = await roomObject.guess(
      left.data.user.id,
      snapshotCandidate.id,
      crypto.randomUUID(),
      Date.now(),
    );
    expect(snapshotGuess.ok && snapshotGuess.snapshot.ownGuesses[0]?.cells[0]).toMatchObject({
      field: "element",
      state: "miss",
    });
    const rateAt = Date.now() + 61_000;
    // BO7 理论峰值是 42 次；前 60 个唯一 action 都不应被速率上限误伤。
    for (let index = 0; index < 60; index += 1) {
      const invalidGuess = await roomObject.guess(
        left.data.user.id,
        "missing-character",
        `invalid-${index}`,
        rateAt,
      );
      expect(invalidGuess).toMatchObject({ ok: false, code: "NOT_FOUND" });
    }
    const limitedGuess = await roomObject.guess(
      left.data.user.id,
      "missing-character",
      "invalid-over-limit",
      rateAt,
    );
    expect(limitedGuess).toMatchObject({ ok: false, code: "RATE_LIMITED" });

    const socketResponse = await SELF.fetch(
      `https://fireflydle.games/api/rooms/${matched.roomId}/socket`,
      { headers: { cookie: left.cookie, upgrade: "websocket" } },
    );
    expect(socketResponse.status).toBe(101);
    expect(socketResponse.webSocket).not.toBeNull();
    socketResponse.webSocket?.accept();
    socketResponse.webSocket?.close(1000, "test-complete");

    const prematureAck = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}/ack`,
      { method: "POST", headers: { cookie: right.cookie } },
    );
    expect(prematureAck.status).toBe(409);
    const activeRetry = await dataOf<{
      status: "matched";
      ticketId: string;
      roomId: string;
    }>(
      await SELF.fetch("https://fireflydle.games/api/matchmaking", {
        method: "POST",
        headers: { cookie: right.cookie },
      }),
    );
    expect(activeRetry).toMatchObject({
      status: "matched",
      ticketId: matched.ticketId,
      roomId: matched.roomId,
    });

    await env.DB.prepare("UPDATE room_directory SET state = 'finished' WHERE room_id = ?")
      .bind(matched.roomId)
      .run();
    const nextAttempt = await SELF.fetch("https://fireflydle.games/api/matchmaking", {
      method: "POST",
      headers: { cookie: left.cookie },
    });
    const nextTicket = await dataOf<{ status: "waiting"; ticketId: string }>(nextAttempt);
    expect(nextTicket.status).toBe("waiting");
    expect(nextTicket.ticketId).not.toBe(waiting.ticketId);

    const firstAck = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}/ack`,
      { method: "POST", headers: { cookie: right.cookie } },
    );
    const retryAck = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}/ack`,
      { method: "POST", headers: { cookie: right.cookie } },
    );
    expect(firstAck.status).toBe(200);
    expect(retryAck.status).toBe(200);
    const consumedStatus = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${matched.ticketId}`,
      { headers: { cookie: right.cookie } },
    );
    expect(consumedStatus.status).toBe(404);
    const leftStatus = await SELF.fetch(
      `https://fireflydle.games/api/matchmaking/${nextTicket.ticketId}`,
      { headers: { cookie: left.cookie } },
    );
    expect(leftStatus.status).toBe(200);
  });
});

describe("访客进度合并", () => {
  it("隔离冲突日常并只迁移非冲突记录，同时按场次加权合并 Elo", async () => {
    const guest = await createSession();
    const password = "merge-password-12345";
    const registered = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginName: "merge_target",
        displayName: "Merge Target",
        password,
      }),
    });
    expect(registered.status).toBe(201);
    const target = await dataOf<SessionData>(registered);

    const createGame = async (cookie: string, activityId: "daily" | "practice") =>
      dataOf<PublicGame>(
        await SELF.fetch("https://fireflydle.games/api/games", {
          method: "POST",
          headers: { cookie, "content-type": "application/json" },
          body: JSON.stringify({ modeId: "playable", activityId }),
        }),
      );
    const targetDaily = await createGame(registered.headers.get("set-cookie") ?? "", "daily");
    const guestDaily = await createGame(guest.cookie, "daily");
    const guestRandom = await createGame(guest.cookie, "practice");
    const submitCorrect = (cookie: string, gameId: string) =>
      SELF.fetch(`https://fireflydle.games/api/games/${gameId}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
    const [targetResult, randomResult] = await Promise.all([
      submitCorrect(registered.headers.get("set-cookie") ?? "", targetDaily.id),
      submitCorrect(guest.cookie, guestRandom.id),
    ]);
    expect(targetResult.status).toBe(200);
    expect(randomResult.status).toBe(200);
    await SELF.fetch(`https://fireflydle.games/api/replays/${guestRandom.id}/share`, {
      method: "POST",
      headers: { cookie: guest.cookie },
    });

    const matchId = crypto.randomUUID();
    const roomId = crypto.randomUUID();
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO matches
           (id, room_code, match_format, ranked, winner_user_id, finish_reason,
            created_at, started_at, completed_at, archived_at)
         VALUES (?, 'MRG42', 1, 1, ?, 'score', ?, ?, ?, ?)`,
      ).bind(matchId, guest.data.user.id, now, now, now, now),
      env.DB.prepare(
        `INSERT INTO match_players
           (match_id, user_id, seat, display_name, score, rating_before, rating_after)
         VALUES (?, ?, 0, 'Guest Merge', 1, 800, 810)`,
      ).bind(matchId, guest.data.user.id),
      env.DB.prepare(
        `INSERT INTO match_rounds
           (match_id, round_number, target_character_id, winner_user_id, started_at, completed_at)
         VALUES (?, 1, ?, ?, ?, ?)`,
      ).bind(matchId, character.id, guest.data.user.id, now, now),
      env.DB.prepare(
        `INSERT INTO match_guesses
           (match_id, round_number, user_id, ordinal, character_id, result_json, guessed_at)
         VALUES (?, 1, ?, 1, ?, '{}', ?)`,
      ).bind(matchId, guest.data.user.id, character.id, now),
      env.DB.prepare(
        `INSERT INTO rating_events
           (id, match_id, user_id, rating_before, rating_after, delta, created_at)
         VALUES (?, ?, ?, 800, 810, 10, ?)`,
      ).bind(crypto.randomUUID(), matchId, guest.data.user.id, now),
      env.DB.prepare(
        `INSERT INTO room_directory
           (room_id, room_code, durable_object_name, owner_user_id, state,
            ranked, match_format, created_at, expires_at)
         VALUES (?, 'OWN42', ?, ?, 'finished', 0, 1, ?, ?)`,
      ).bind(roomId, roomId, guest.data.user.id, now, now + 60_000),
      env.DB.prepare(
        "UPDATE users SET elo = 1200, ranked_matches = 12, leaderboard_eligible = 1 WHERE id = ?",
      ).bind(target.user.id),
      env.DB.prepare(
        "UPDATE users SET elo = 800, ranked_matches = 8, leaderboard_eligible = 0 WHERE id = ?",
      ).bind(guest.data.user.id),
    ]);

    const login = await SELF.fetch("https://fireflydle.games/api/auth/login", {
      method: "POST",
      headers: { cookie: guest.cookie, "content-type": "application/json" },
      body: JSON.stringify({ loginName: "merge_target", password }),
    });
    expect(login.status).toBe(200);
    const merged = await dataOf<SessionData>(login);
    expect(merged.user.id).toBe(target.user.id);
    expect(merged.user.elo).toBe(1040);
    expect(merged.user.rankedMatches).toBe(20);

    const resultOwners = await env.DB.prepare(
      "SELECT game_id, user_id, leaderboard_hidden_at FROM game_results WHERE game_id IN (?, ?) ORDER BY game_id",
    )
      .bind(targetDaily.id, guestDaily.id)
      .all<{ game_id: string; user_id: string; leaderboard_hidden_at: number | null }>();
    expect(resultOwners.results).toHaveLength(2);
    expect(resultOwners.results.find((row) => row.game_id === targetDaily.id)?.user_id).toBe(
      target.user.id,
    );
    const isolatedDaily = resultOwners.results.find((row) => row.game_id === guestDaily.id);
    expect(isolatedDaily?.user_id).toBe(guest.data.user.id);
    expect(isolatedDaily?.leaderboard_hidden_at).not.toBeNull();
    const visibleDaily = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM game_results
       WHERE user_id = ? AND mode = 'daily' AND leaderboard_hidden_at IS NULL`,
    )
      .bind(target.user.id)
      .first<{ count: number }>();
    expect(visibleDaily?.count).toBe(1);

    const mergedCookie = login.headers.get("set-cookie") ?? "";
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/replays/${guestDaily.id}`, {
          headers: { cookie: mergedCookie },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/replays/${guestRandom.id}`, {
          headers: { cookie: mergedCookie },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await SELF.fetch(`https://fireflydle.games/api/games/${guestRandom.id}`, {
          headers: { cookie: mergedCookie },
        })
      ).status,
    ).toBe(200);

    const history = await env.DB.prepare(
      `SELECT
         (SELECT winner_user_id FROM matches WHERE id = ?) AS match_winner,
         (SELECT user_id FROM match_players WHERE match_id = ?) AS match_player,
         (SELECT user_id FROM rating_events WHERE match_id = ?) AS rating_user,
         (SELECT owner_user_id FROM room_directory WHERE room_id = ?) AS room_owner,
          (SELECT created_by_user_id FROM replay_shares WHERE game_id = ?) AS share_owner,
          (SELECT merged_into_user_id FROM users WHERE id = ?) AS merged_into,
          (SELECT status FROM games WHERE id = ?) AS isolated_daily_status,
          (SELECT COUNT(*) FROM guest_progress_merges WHERE guest_user_id = ?) AS merge_count`,
    )
      .bind(
        matchId,
        matchId,
        matchId,
        roomId,
        guestRandom.id,
        guest.data.user.id,
        guestDaily.id,
        guest.data.user.id,
      )
      .first<Record<string, string>>();
    expect(history).toMatchObject({
      match_winner: target.user.id,
      match_player: target.user.id,
      rating_user: target.user.id,
      room_owner: target.user.id,
      share_owner: target.user.id,
      merged_into: target.user.id,
      isolated_daily_status: "expired",
      merge_count: 1,
    });
  });

  it("并行登录只会合并一次访客 Elo", async () => {
    const guest = await createSession();
    const target = await createRegisteredSession("concurrent_merge");
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE users SET elo = 1200, ranked_matches = 12, leaderboard_eligible = 1 WHERE id = ?",
      ).bind(target.data.user.id),
      env.DB.prepare(
        "UPDATE users SET elo = 800, ranked_matches = 8, leaderboard_eligible = 0 WHERE id = ?",
      ).bind(guest.data.user.id),
    ]);

    const login = () =>
      SELF.fetch("https://fireflydle.games/api/auth/login", {
        method: "POST",
        headers: { cookie: guest.cookie, "content-type": "application/json" },
        body: JSON.stringify({
          loginName: "registered_concurrent_merge",
          password: target.password,
        }),
      });
    const responses = await Promise.all([login(), login()]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);

    const merged = await env.DB.prepare(
      `SELECT elo, ranked_matches,
         (SELECT COUNT(*) FROM guest_progress_merges WHERE guest_user_id = ?) AS merge_count
       FROM users WHERE id = ?`,
    )
      .bind(guest.data.user.id, target.data.user.id)
      .first<{ elo: number; ranked_matches: number; merge_count: number }>();
    expect(merged).toMatchObject({ elo: 1040, ranked_matches: 20, merge_count: 1 });
  });
});

describe("邮箱验证", () => {
  it("无邮箱注册保持可用，验证邮件发送失败也不会回滚带邮箱注册", async () => {
    const outbound = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("test-email-delivery-failed"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const withoutEmail = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.101",
      },
      body: JSON.stringify({
        loginName: "without_email",
        displayName: "Without Email",
        password: "secret",
      }),
    });
    expect(withoutEmail.status).toBe(201);
    const registeredWithoutEmail = await dataOf<SessionData>(withoutEmail);
    expect(registeredWithoutEmail.user).toMatchObject({
      hasEmail: false,
      emailVerified: false,
    });
    expect(outbound).not.toHaveBeenCalled();
    const withoutEmailTokens = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM email_verification_tokens WHERE user_id = ?",
    )
      .bind(registeredWithoutEmail.user.id)
      .first<{ count: number }>();
    expect(withoutEmailTokens?.count).toBe(0);

    const withEmail = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.102",
      },
      body: JSON.stringify({
        loginName: "delivery_failure",
        displayName: "Delivery Failure",
        password: "secret",
        email: "delivery-failure@example.com",
      }),
    });
    expect(withEmail.status).toBe(201);
    const registered = await dataOf<SessionData>(withEmail);
    expect(registered.user).toMatchObject({ hasEmail: true, emailVerified: false });
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledOnce());
    await vi.waitFor(() => {
      const deliveryFailures = consoleError.mock.calls.filter(
        ([message]) =>
          typeof message === "string" &&
          message.includes('"event":"email-verification-send-failed"'),
      );
      expect(deliveryFailures).toHaveLength(1);
    });

    const stored = await env.DB.prepare(
      `SELECT users.email_verified,
         (SELECT COUNT(*) FROM email_verification_tokens
          WHERE user_id = users.id AND used_at IS NULL) AS token_count
       FROM users WHERE id = ?`,
    )
      .bind(registered.user.id)
      .first<{ email_verified: number; token_count: number }>();
    expect(stored).toMatchObject({ email_verified: 0, token_count: 1 });
  });

  it("重发会使旧 token 失效，确认后刷新会话中的邮箱状态", async () => {
    const emailedTokens: string[] = [];
    const outbound = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      expect(request.url).toBe("https://api.resend.com/emails");
      expect(request.headers.get("authorization")).toBe("Bearer test-resend-key");
      const body = (await request.json()) as {
        from?: unknown;
        to?: unknown;
        subject?: unknown;
        text?: unknown;
        html?: unknown;
      };
      expect(body).toMatchObject({
        from: "Fireflydle <account@fireflydle.games>",
        to: ["Verify@Example.com"],
        subject: "[Fireflydle] 验证你的邮箱",
      });
      expect(body.html).toEqual(expect.stringContaining(">验证邮箱</a>"));
      expect(body.html).toEqual(expect.stringContaining("verify-email?token="));
      if (typeof body.text === "string") {
        const match = /verify-email\?token=([^\s]+)/u.exec(body.text);
        if (match?.[1]) emailedTokens.push(decodeURIComponent(match[1]));
      }
      return Response.json({ id: "email-verification-test" });
    });

    const response = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.103",
      },
      body: JSON.stringify({
        loginName: "verify_email",
        displayName: "Verify Email",
        password: "secret",
        email: "Verify@Example.com",
      }),
    });
    expect(response.status).toBe(201);
    const registered = await dataOf<SessionData>(response);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(registered.user).toMatchObject({ hasEmail: true, emailVerified: false });
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledOnce());

    const resent = await SELF.fetch(
      "https://fireflydle.games/api/auth/email-verification/request",
      { method: "POST", headers: { cookie } },
    );
    expect(resent.status).toBe(200);
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledTimes(2));
    expect(emailedTokens).toHaveLength(2);

    const currentToken = emailedTokens[1];
    if (!currentToken) throw new Error("未从验证邮件中取得 token");
    const stored = await env.DB.prepare(
      `SELECT token_hash FROM email_verification_tokens
       WHERE user_id = ? AND used_at IS NULL`,
    )
      .bind(registered.user.id)
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(currentToken);

    const confirm = (token: string) =>
      SELF.fetch("https://fireflydle.games/api/auth/email-verification/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
    expect((await confirm(emailedTokens[0] ?? "")).status).toBe(400);
    const firstConfirmation = await confirm(currentToken);
    expect(firstConfirmation.status).toBe(200);
    expect(
      await dataOf<{ verified: boolean; alreadyVerified: boolean }>(firstConfirmation),
    ).toEqual({
      verified: true,
      alreadyVerified: false,
    });

    const repeatedConfirmation = await confirm(currentToken);
    expect(repeatedConfirmation.status).toBe(200);
    expect(
      await dataOf<{ verified: boolean; alreadyVerified: boolean }>(repeatedConfirmation),
    ).toEqual({
      verified: true,
      alreadyVerified: true,
    });

    const supersededConfirmation = await confirm(emailedTokens[0] ?? "");
    expect(supersededConfirmation.status).toBe(200);
    expect(
      await dataOf<{ verified: boolean; alreadyVerified: boolean }>(supersededConfirmation),
    ).toEqual({
      verified: true,
      alreadyVerified: true,
    });

    const me = await SELF.fetch("https://fireflydle.games/api/auth/me", { headers: { cookie } });
    expect((await dataOf<SessionData["user"]>(me)).emailVerified).toBe(true);
  });
});

describe("密码重置", () => {
  it("未验证邮箱保持不可枚举且不创建 token 或发送邮件", async () => {
    const now = Date.now();
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users
         (id, login_name, login_name_normalized, display_name, display_name_normalized,
          password_hash, password_salt, password_iterations, email, email_normalized,
          role, is_guest, email_verified, elo, ranked_matches, leaderboard_eligible,
          created_at, updated_at)
       VALUES (?, 'unverified_reset', 'unverified_reset', 'Unverified Reset', 'unverified reset',
               'old-hash', 'old-salt', 1, 'unverified@example.com', 'unverified@example.com',
               'player', 0, 0, 1000, 0, 0, ?, ?)`,
    )
      .bind(userId, now, now)
      .run();
    const outbound = vi.spyOn(globalThis, "fetch");

    const requested = await SELF.fetch("https://fireflydle.games/api/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unverified@example.com" }),
    });
    expect(requested.status).toBe(200);
    expect(await dataOf<{ accepted: boolean }>(requested)).toEqual({ accepted: true });
    expect(outbound).not.toHaveBeenCalled();
    const stored = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ?",
    )
      .bind(userId)
      .first<{ count: number }>();
    expect(stored?.count).toBe(0);
  });

  it("只存 token hash，通过 Resend 发送并且 token 一次性使用", async () => {
    const now = Date.now();
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users
         (id, login_name, login_name_normalized, display_name, display_name_normalized,
          password_hash, password_salt, password_iterations, email, email_normalized,
          role, is_guest, email_verified, elo, ranked_matches, leaderboard_eligible,
          created_at, updated_at)
       VALUES (?, 'reset_user', 'reset_user', 'Reset User', 'reset user',
               'old-hash', 'old-salt', 1, 'reset@example.com', 'reset@example.com',
               'player', 0, 1, 1000, 0, 0, ?, ?)`,
    )
      .bind(userId, now, now)
      .run();

    let emailedToken: string | null = null;
    const outbound = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      expect(request.url).toBe("https://api.resend.com/emails");
      expect(request.headers.get("authorization")).toBe("Bearer test-resend-key");
      const body: unknown = await request.json();
      if (typeof body === "object" && body !== null && "text" in body) {
        expect(body).toMatchObject({
          from: "Fireflydle <account@fireflydle.games>",
          to: ["reset@example.com"],
          subject: "[Fireflydle] 重置你的密码",
          html: expect.stringContaining(">重置密码</a>"),
        });
        if (typeof body.text === "string") {
          const match = /recover\?token=([^\s]+)/u.exec(body.text);
          emailedToken = match?.[1] ? decodeURIComponent(match[1]) : null;
        }
      }
      return Response.json({ id: "email-test" });
    });

    const requested = await SELF.fetch("https://fireflydle.games/api/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "reset@example.com" }),
    });
    expect(requested.status).toBe(200);
    await vi.waitFor(() => expect(outbound).toHaveBeenCalledOnce());
    if (!emailedToken) throw new Error("未从邮件中取得重置 token");
    const stored = await env.DB.prepare(
      "SELECT token_hash FROM password_reset_tokens WHERE user_id = ?",
    )
      .bind(userId)
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(emailedToken);

    const confirm = (password: string) =>
      SELF.fetch("https://fireflydle.games/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: emailedToken, password }),
      });
    expect((await confirm("x".repeat(PASSWORD_MIN_LENGTH - 1))).status).toBe(400);
    expect((await confirm("x".repeat(PASSWORD_MIN_LENGTH))).status).toBe(200);
    expect((await confirm("x".repeat(PASSWORD_MIN_LENGTH))).status).toBe(400);
  });
});

describe("持久化限流", () => {
  it("跨请求累计登录失败并返回统一重试信息", async () => {
    const attempt = () =>
      SELF.fetch("https://fireflydle.games/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "203.0.113.77",
        },
        body: JSON.stringify({ loginName: "rate_limited_identity", password: "wrong" }),
      });
    for (let index = 0; index < 10; index += 1) {
      expect((await attempt()).status).toBe(401);
    }
    const limited = await attempt();
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    const payload = (await limited.json()) as {
      ok: boolean;
      error: { code: string; details: { retryAfter: number; retryAt: string } };
    };
    expect(payload).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(payload.error.details.retryAfter).toBeGreaterThan(0);
    expect(Date.parse(payload.error.details.retryAt)).not.toBeNaN();
    const persisted = await env.DB.prepare(
      "SELECT request_count, blocked_until FROM rate_limits WHERE scope = 'auth:login:identity' AND key_hash = ?",
    )
      .bind(await sha256("rate_limited_identity"))
      .first<{ request_count: number; blocked_until: number }>();
    expect(persisted?.request_count).toBe(11);
    expect(persisted?.blocked_until ?? 0).toBeGreaterThan(Date.now());
  });
});
