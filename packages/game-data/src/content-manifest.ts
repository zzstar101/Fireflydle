import {
  CharacterSchema,
  ContentManifestSchema,
  type Character,
  type ContentEntity,
  type ContentManifest,
  type FieldDefinition,
} from "@fireflydle/contracts";
import { buildSearchIndexEntry } from "./search";

const LABELS = { "zh-CN": "普通角色", en: "Characters", ja: "キャラクター" } as const;

const REGION_BY_GROUP: Record<string, string> = {
  "herta-space-station": "herta-space-station",
  belobog: "belobog",
  penacony: "penacony",
  "xianzhou-alliance": "xianzhou",
  amphoreus: "amphoreus",
  cosmic: "cosmic",
  "astral-express": "astral-express",
  "stellaron-hunters": "cosmic",
  ipc: "cosmic",
  planarcadia: "planarcadia",
  "another-world": "another-world",
};

const PLAYABLE_FIELDS: FieldDefinition[] = [
  {
    id: "element",
    label: { "zh-CN": "属性", en: "Element", ja: "属性" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "path",
    label: { "zh-CN": "命途", en: "Path", ja: "運命" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "rarity",
    label: { "zh-CN": "稀有度", en: "Rarity", ja: "レアリティ" },
    valueType: "number",
    comparison: "exact",
    required: true,
  },
  {
    id: "faction",
    label: { "zh-CN": "派系", en: "Faction", ja: "派閥" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "region",
    label: { "zh-CN": "地区", en: "Region", ja: "地域" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "version",
    label: { "zh-CN": "版本", en: "Version", ja: "バージョン" },
    valueType: "number",
    comparison: "direction",
    required: true,
    directional: true,
  },
];

const ACTIVITIES = [
  {
    id: "daily" as const,
    label: { "zh-CN": "每日题", en: "Daily", ja: "デイリー" },
    enabled: true,
  },
  {
    id: "practice" as const,
    label: { "zh-CN": "练习", en: "Practice", ja: "練習" },
    enabled: true,
  },
  {
    id: "weekly" as const,
    label: { "zh-CN": "周赛", en: "Weekly", ja: "ウィークリー" },
    enabled: false,
  },
  {
    id: "endless" as const,
    label: { "zh-CN": "无尽", en: "Endless", ja: "エンドレス" },
    enabled: false,
  },
  {
    id: "friend-challenge" as const,
    label: { "zh-CN": "好友挑战", en: "Friend challenge", ja: "フレンドチャレンジ" },
    enabled: false,
  },
  {
    id: "private-room" as const,
    label: { "zh-CN": "私人房", en: "Private room", ja: "プライベートルーム" },
    enabled: true,
  },
  {
    id: "ranked-match" as const,
    label: { "zh-CN": "排位匹配", en: "Ranked match", ja: "ランクマッチ" },
    // 保留既有无段位 ELO/PvP 的兼容 ID，但不在 T02 manifest 中启用对外入口。
    enabled: false,
  },
] as const;

function compareCharacters(left: Character, right: Character): number {
  if (left.releaseOrder !== right.releaseOrder) return left.releaseOrder - right.releaseOrder;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function regionFor(character: Character): string {
  if (character.regionId) return character.regionId;
  const regionId = REGION_BY_GROUP[character.factionGroupId];
  if (!regionId) throw new Error(`角色 ${character.id} 缺少地区映射：${character.factionGroupId}`);
  return regionId;
}

function stableContentRevision(value: unknown): number {
  let hash = 2_166_136_261;
  for (const symbol of JSON.stringify(value)) {
    hash ^= symbol.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function toPlayableEntity(character: Character): ContentEntity {
  return {
    id: character.id,
    kind: "playable",
    names: character.names,
    aliases: character.aliases,
    source: { url: character.assets.sourceUrl, revision: character.sourceRevision },
    reviewStatus: character.enabled ? "approved" : "rejected",
    payload: {
      element: character.element,
      path: character.path,
      rarity: character.rarity,
      factionId: character.factionId,
      factionGroupId: character.factionGroupId,
      regionId: regionFor(character),
      releaseVersionId: character.releaseVersionId,
      releaseOrder: character.releaseOrder,
      assets: {
        avatarPath: character.assets.avatarPath,
        portraitPath: character.assets.portraitPath,
        sha256: character.assets.sha256,
        rightsNotice: character.assets.rightsNotice,
      },
    },
  };
}

/** 从旧 Character 发布导出生成唯一的普通角色 manifest。 */
export function buildPlayableManifest(input: readonly Character[]): ContentManifest {
  const characters = CharacterSchema.array().parse(input).toSorted(compareCharacters);
  const ids = new Set<string>();
  for (const character of characters) {
    if (ids.has(character.id)) throw new Error(`角色 ID 重复：${character.id}`);
    ids.add(character.id);
  }

  const candidates = characters.filter((character) => character.enabled);
  const targets = candidates.filter((character) => character.targetEligible);
  if (targets.length === 0) throw new Error("普通角色目标池不能为空。");

  const entities = characters.map(toPlayableEntity);
  const candidateIds = candidates.map((character) => character.id);
  const targetIds = targets.map((character) => character.id);
  const activities = ACTIVITIES.map((activity) => ({
    ...activity,
    modeIds: ["playable" as const],
  }));
  const generatedAt = characters
    .map((character) => character.assets.sourceUpdatedAt)
    .toSorted()
    .at(-1);
  if (!generatedAt) throw new Error("普通角色数据不能为空。");

  const content = {
    generatedAt,
    modes: [
      {
        id: "playable" as const,
        label: LABELS,
        targetPoolId: "playable-targets",
        candidatePoolId: "playable-candidates",
        fields: PLAYABLE_FIELDS,
        maxAttempts: 6,
        rulesVersion: "1.0.0",
        activities: ACTIVITIES.map((activity) => activity.id),
      },
    ],
    activities,
    pools: [
      { id: "playable-targets", modeId: "playable" as const, targetIds, candidateIds },
      { id: "playable-candidates", modeId: "playable" as const, targetIds, candidateIds },
    ],
    entities,
    searchIndex: entities.map(buildSearchIndexEntry),
  };

  return ContentManifestSchema.parse({
    ...content,
    manifestVersion: `1.0.${stableContentRevision(content)}`,
  });
}
