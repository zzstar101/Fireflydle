import { describe, expect, test } from "bun:test";
import {
  ActivityDefinitionSchema,
  ContentManifestSchema,
  ContentModeDefinitionSchema,
  ContentEntitySchema,
  FeedbackStateSchema,
  FieldDefinitionSchema,
  GuessCellSchema,
  ManifestVersionSchema,
  SearchIndexEntrySchema,
  PublicEndlessRunSchema,
  ClientRoomMessageSchema,
  RoundSkipStateSchema,
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
