import { describe, expect, test } from "bun:test";
import {
  ActivityDefinitionSchema,
  ContentManifestSchema,
  ContentModeDefinitionSchema,
  ContentEntitySchema,
  CreateGameRequestSchema,
  CreateRoomRequestSchema,
  FeedbackStateSchema,
  FieldDefinitionSchema,
  FriendChallengeSchema,
  GuessCellSchema,
  ManifestVersionSchema,
  SearchIndexEntrySchema,
  PublicEndlessRunSchema,
  ClientRoomMessageSchema,
  RoomSnapshotSchema,
  RoundSkipStateSchema,
  RoomConfigurationSchema,
} from "./index";

const labels = { "zh-CN": "普通角色", en: "Characters", ja: "キャラクター" };

const field = {
  id: "element",
  label: { "zh-CN": "属性", en: "Element", ja: "属性" },
  valueType: "enum" as const,
  comparison: "exact" as const,
  required: true,
};

const playableEntity = {
  id: "firefly",
  kind: "playable" as const,
  names: { "zh-CN": "流萤", en: "Firefly", ja: "ホタル" },
  aliases: { "zh-CN": ["liu ying"], en: [], ja: [] },
  source: { url: "https://example.com/firefly", revision: "2026-08-16" },
  reviewStatus: "approved" as const,
  payload: {
    element: "fire" as const,
    path: "destruction" as const,
    rarity: 5 as const,
    factionId: "herta-space-station",
    factionGroupId: "herta-space-station",
    regionId: "penacony",
    releaseVersionId: "2.3",
    releaseOrder: 1,
    assets: {
      avatarPath: "/firefly.webp",
      portraitPath: "/firefly.png",
      sha256: "a".repeat(64),
      rightsNotice: "仅用于测试",
    },
  },
};
const secondPlayableEntity = { ...playableEntity, id: "march-7th" };

const mode = {
  id: "playable" as const,
  label: labels,
  targetPoolId: "playable-targets",
  candidatePoolId: "playable-candidates",
  fields: [field],
  maxAttempts: 6,
  rulesVersion: "1.0",
  activities: ["daily", "practice"] as const,
};

describe("内容契约", () => {
  test("接受带版本、模式和活动的 manifest", () => {
    const manifest = ContentManifestSchema.parse({
      manifestVersion: "1.0.0",
      generatedAt: "2026-08-16T00:00:00.000Z",
      modes: [mode],
      entities: [playableEntity, secondPlayableEntity],
      activities: [
        { id: "daily", label: labels, modeIds: ["playable"], enabled: true },
        { id: "practice", label: labels, modeIds: ["playable"], enabled: true },
      ],
      pools: [
        {
          id: "playable-targets",
          modeId: "playable",
          targetIds: ["firefly"],
          candidateIds: ["firefly", "march-7th"],
        },
        {
          id: "playable-candidates",
          modeId: "playable",
          targetIds: ["firefly"],
          candidateIds: ["firefly", "march-7th"],
        },
      ],
    });

    expect(manifest.manifestVersion).toBe("1.0.0");
  });

  test("拒绝未知反馈状态、重复字段和非法版本", () => {
    expect(() => FeedbackStateSchema.parse("unknown")).toThrow();
    expect(FeedbackStateSchema.parse("unavailable")).toBe("unavailable");
    expect(() =>
      GuessCellSchema.parse({ field: "element", state: "unavailable", direction: "higher" }),
    ).toThrow();
    expect(() => ManifestVersionSchema.parse("latest")).toThrow();
    expect(() => ContentModeDefinitionSchema.parse({ ...mode, fields: [field, field] })).toThrow();
  });

  test("活动不能引用未注册模式", () => {
    expect(() =>
      ActivityDefinitionSchema.parse({
        id: "daily",
        label: labels,
        modeIds: ["npc"],
        enabled: true,
      }),
    ).not.toThrow();
    expect(() =>
      ContentManifestSchema.parse({
        manifestVersion: "1.0.0",
        generatedAt: "2026-08-16T00:00:00.000Z",
        modes: [mode],
        activities: [{ id: "daily", label: labels, modeIds: ["unknown"], enabled: true }],
        pools: [
          {
            id: "playable-targets",
            modeId: "playable",
            targetIds: ["firefly"],
            candidateIds: ["firefly"],
          },
        ],
        entities: [playableEntity],
      }),
    ).toThrow();
  });

  test("实体联合要求来源、审核状态和类型 payload", () => {
    const entity = ContentEntitySchema.parse(playableEntity);

    expect(entity.kind).toBe("playable");
    expect(() => ContentEntitySchema.parse({ ...entity, payload: {} })).toThrow();
  });

  test("搜索索引要求三语名称、唯一搜索词和已知实体", () => {
    const searchEntry = {
      entityId: "firefly",
      names: [
        { value: "流萤", normalized: "流萤", locale: "zh-CN" },
        { value: "Firefly", normalized: "firefly", locale: "en" },
        { value: "ホタル", normalized: "ホタル", locale: "ja" },
      ],
      terms: [{ value: "liu ying", normalized: "liu ying", locale: "zh-CN" }],
    };
    expect(() => SearchIndexEntrySchema.parse(searchEntry)).not.toThrow();
    expect(() =>
      SearchIndexEntrySchema.parse({ ...searchEntry, names: searchEntry.names.slice(0, 2) }),
    ).toThrow(/三语/);
  });
});

describe("字段定义", () => {
  test("必需字段必须声明可比较规则", () => {
    expect(() => FieldDefinitionSchema.parse({ ...field, required: false })).not.toThrow();
    expect(() => FieldDefinitionSchema.parse({ ...field, comparison: "not-a-rule" })).toThrow();
  });
});

describe("单人对局运行时契约", () => {
  test("创建请求只表达内容模式与活动", () => {
    expect(CreateGameRequestSchema.parse({ modeId: "playable", activityId: "practice" })).toEqual({
      modeId: "playable",
      activityId: "practice",
    });
    expect(() =>
      CreateGameRequestSchema.parse({ mode: "random", difficulty: "standard" }),
    ).toThrow();
  });
});

describe("好友挑战契约", () => {
  test("四种内容模式共用首次成绩协议且不提供异步跳过", () => {
    for (const modeId of ["playable", "npc", "currency-wars", "aeon"] as const) {
      const challenge = FriendChallengeSchema.parse({
        id: "f4f64434-e8b5-4ba1-9094-d11b9252de29",
        modeId,
        activityId: "friend-challenge",
        poolRuleVersion: "1.0.0",
        manifestVersion: "1.0.0",
        maxAttempts: 6,
        creatorScore: { status: "won", guessCount: 2, elapsedMs: 2_000 },
        officialScore: null,
        comparison: null,
        attempt: null,
      });
      expect(challenge.modeId).toBe(modeId);
      expect(challenge).not.toHaveProperty("skipAvailable");
    }
  });
});

describe("无尽玩法契约", () => {
  test("公开状态固定表达生命、题次、跳过和当前六猜", () => {
    const run = PublicEndlessRunSchema.parse({
      id: "f4f64434-e8b5-4ba1-9094-d11b9252de29",
      modeId: "playable",
      activityId: "endless",
      lives: 5,
      clears: 0,
      totalGuesses: 0,
      skipAvailable: true,
      status: "active",
      roundNumber: 1,
      maxAttempts: 6,
      guesses: [],
      startedAt: "2026-08-17T00:00:00.000Z",
      completedAt: null,
      elapsedMs: 0,
      answer: null,
      lastRound: null,
      fieldDefinitions: [field],
    });
    expect(run).toMatchObject({ lives: 5, maxAttempts: 6, skipAvailable: true });
  });
});

describe("实时房间跳过契约", () => {
  test("只接受实时房间的请求、回应与四种协商状态", () => {
    expect(ClientRoomMessageSchema.parse({ type: "request-skip" })).toEqual({
      type: "request-skip",
    });
    expect(ClientRoomMessageSchema.parse({ type: "respond-skip", accepted: false })).toEqual({
      type: "respond-skip",
      accepted: false,
    });
    expect(
      RoundSkipStateSchema.parse({
        status: "pending",
        round: 2,
        requestedByPlayerId: "f4f64434-e8b5-4ba1-9094-d11b9252de29",
        expiresAt: 1_725_000_000_000,
      }),
    ).toMatchObject({ status: "pending", round: 2 });
    expect(() => RoundSkipStateSchema.parse({ status: "executed", round: 2 })).toThrow();
  });
});

describe("私人房配置契约", () => {
  test("保留内容与活动标识，并为普通角色私人房提供稳定默认值", () => {
    expect(CreateRoomRequestSchema.parse({})).toEqual({
      modeId: "playable",
      activityId: "private-room",
      format: 3,
      roundTimeSeconds: 90,
      maxAttempts: 6,
      modifier: null,
    });
    expect(
      RoomConfigurationSchema.parse({
        modeId: "playable",
        activityId: "private-room",
        format: 7,
        roundTimeSeconds: null,
        maxAttempts: 8,
        modifier: "fog",
      }),
    ).toMatchObject({ format: 7, roundTimeSeconds: null, maxAttempts: 8, modifier: "fog" });
  });

  test("拒绝私人房范围外的计时和猜测次数", () => {
    for (const format of [1, 3, 5, 7] as const) {
      expect(CreateRoomRequestSchema.parse({ format }).format).toBe(format);
    }
    for (const roundTimeSeconds of [null, 30, 60, 90] as const) {
      expect(CreateRoomRequestSchema.parse({ roundTimeSeconds }).roundTimeSeconds).toBe(
        roundTimeSeconds,
      );
    }
    for (const maxAttempts of [4, 6, 8] as const) {
      expect(CreateRoomRequestSchema.parse({ maxAttempts }).maxAttempts).toBe(maxAttempts);
    }
    expect(() => CreateRoomRequestSchema.parse({ roundTimeSeconds: 45 })).toThrow();
    expect(() => CreateRoomRequestSchema.parse({ maxAttempts: 5 })).toThrow();
    expect(() => CreateRoomRequestSchema.parse({ modeId: "npc" })).toThrow();
    expect(CreateRoomRequestSchema.parse({ modifier: "speed" }).modifier).toBe("speed");
    expect(() => CreateRoomRequestSchema.parse({ modifiers: ["fog", "speed"] })).toThrow();
  });
});

describe("永久 Elo 结算契约", () => {
  test("房间快照保留模式与活动，并返回双方纯数字评分变化", () => {
    const leftId = "f4f64434-e8b5-4ba1-9094-d11b9252de29";
    const rightId = "460a4c7b-82d6-4fc7-bd32-96a86a6849af";
    const snapshot = RoomSnapshotSchema.parse({
      roomId: "19a7089d-5aef-474f-85e6-fcbb96a74eb7",
      code: "ELR24",
      modeId: "playable",
      activityId: "ranked-match",
      format: 3,
      configuration: {
        modeId: "playable",
        activityId: "ranked-match",
        format: 3,
        roundTimeSeconds: 90,
        maxAttempts: 6,
      },
      ranked: true,
      state: "finished",
      round: 2,
      consecutiveDraws: 0,
      roundEndsAt: null,
      nextRoundAt: null,
      reconnectDeadline: null,
      players: [
        {
          playerId: leftId,
          displayName: "Left",
          score: 2,
          guessesUsed: 2,
          connected: true,
          reconnectPauseUsed: false,
        },
        {
          playerId: rightId,
          displayName: "Right",
          score: 0,
          guessesUsed: 0,
          connected: true,
          reconnectPauseUsed: false,
        },
      ],
      ownGuesses: [],
      opponentFeedback: [],
      roundAnswer: null,
      roundWinnerId: leftId,
      roundSkip: { status: "idle" },
      drawOfferByPlayerId: null,
      winnerId: leftId,
      finishReason: "score",
      ratingChanges: [
        { playerId: leftId, before: 1000, after: 1024, delta: 24 },
        { playerId: rightId, before: 1000, after: 976, delta: -24 },
      ],
    });

    expect(snapshot).toMatchObject({
      modeId: "playable",
      activityId: "ranked-match",
      ratingChanges: [
        { playerId: leftId, before: 1000, after: 1024, delta: 24 },
        { playerId: rightId, before: 1000, after: 976, delta: -24 },
      ],
    });
  });
});
