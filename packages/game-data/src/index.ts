import {
  CharacterSchema,
  ContentManifestSchema,
  FactionSchema,
  VersionSchema,
  type Character,
  type ContentEntity,
  type Element,
  type Faction,
  type LocalizedText,
  type Path,
  type Version,
  type NpcSummary,
  CurrencyWarsRulesetSchema,
  CurrencyWarsUnitSummarySchema,
  type CurrencyWarsUnit,
  type CurrencyWarsUnitSummary,
} from "@fireflydle/contracts";

import characterData from "./generated/characters.json";
import contentManifestData from "./generated/content-manifest.json";
import factionData from "./generated/factions.json";
import versionData from "./generated/versions.json";
import { buildPlayableManifest } from "./content-manifest";
import npcManifestData from "./data/npc-manifest.json";
import currencyWarsManifestData from "./data/currency-wars-manifest.json";

/**
 * 发布数据由 scripts/sync-characters.ts 从已审核来源生成。
 * 在模块边界再验证一次，避免手工修改 JSON 后把非法数据带入前端或 D1。
 */
const parsedCharacters = CharacterSchema.array().parse(characterData);

export const factions: readonly Faction[] = Object.freeze(FactionSchema.array().parse(factionData));

export const versions: readonly Version[] = Object.freeze(VersionSchema.array().parse(versionData));

/** 新内容系统的普通角色 manifest；旧角色导出仍是迁移期的兼容公开入口。 */
const derivedContentManifest = buildPlayableManifest(parsedCharacters);
const publishedContentManifest = ContentManifestSchema.parse(contentManifestData);
if (JSON.stringify(derivedContentManifest) !== JSON.stringify(publishedContentManifest)) {
  throw new Error("内容 manifest 与旧角色发布数据不一致，请重新运行 sync:content。");
}
export const contentManifest = Object.freeze(publishedContentManifest);

/** T13 已审核 NPC 小池；与普通角色 manifest 和运行时实体完全分离。 */
export const npcManifest = Object.freeze(ContentManifestSchema.parse(npcManifestData));

/** T14 独立币战规则快照；单位不进入普通内容实体联合。 */
export const currencyWarsManifest = Object.freeze(
  ContentManifestSchema.parse(currencyWarsManifestData),
);
export const currencyWarsRuleset = Object.freeze(
  CurrencyWarsRulesetSchema.parse(currencyWarsManifest.currencyWars),
);
export const currencyWarsUnits: readonly CurrencyWarsUnit[] = Object.freeze(
  currencyWarsRuleset.units,
);
export function currencyWarsSummary(unit: CurrencyWarsUnit): CurrencyWarsUnitSummary {
  return CurrencyWarsUnitSummarySchema.parse({
    id: unit.id,
    names: unit.names,
    aliases: unit.aliases,
    cost: unit.cost,
    position: unit.position,
    assets: unit.assets,
  });
}
export const currencyWarsUnitSummaries: readonly CurrencyWarsUnitSummary[] = Object.freeze(
  currencyWarsUnits.map(currencyWarsSummary),
);

export function getCurrencyWarsSearchText(
  unit: Pick<CurrencyWarsUnit, "names" | "aliases">,
): string {
  return getEntitySearchText(unit);
}

export type NpcEntity = Extract<ContentEntity, { kind: "npc" }>;
export const npcEntities = Object.freeze(
  npcManifest.entities.filter((entity): entity is NpcEntity => entity.kind === "npc"),
);

export function getNpcSearchText(entity: NpcEntity): string {
  return getEntitySearchText(entity);
}

function canonicalFactionId(factionId: string): string {
  return factionId === "interastral-peace-corporation" ? "ipc" : factionId;
}

export function npcSummary(entity: NpcEntity): NpcSummary {
  const faction = factions.find(
    (entry) => entry.id === canonicalFactionId(entity.payload.factionId),
  );
  const version = versions.find((entry) => entry.id === entity.payload.debutVersionId);
  if (!faction) throw new Error(`NPC ${entity.id} 引用了未知派系 ${entity.payload.factionId}`);
  if (!version) throw new Error(`NPC ${entity.id} 引用了未知版本 ${entity.payload.debutVersionId}`);
  return {
    id: entity.id,
    names: entity.names,
    aliases: entity.aliases,
    regionId: entity.payload.regionId,
    factionId: entity.payload.factionId,
    factionGroupId: faction.groupId,
    debutVersionId: entity.payload.debutVersionId,
    debutVersionOrder: version.order,
    assets: entity.payload.assets,
  };
}

const playableEntitiesById = new Map(
  contentManifest.entities
    .filter((entity) => entity.kind === "playable")
    .map((entity) => [entity.id, entity]),
);

/** 从发布 manifest 注入普通角色玩法字段，避免 Web 与 Worker 维护第二套地区映射。 */
export function enrichPlayableCharacter(character: Character): Character {
  const entity = playableEntitiesById.get(character.id);
  if (!entity) return character;
  return { ...character, regionId: entity.payload.regionId };
}

export const characters: readonly Character[] = Object.freeze(
  parsedCharacters.map(enrichPlayableCharacter),
);

export { buildPlayableManifest } from "./content-manifest";
export { buildSearchIndexEntry, normalizeSearchText, searchEntities } from "./search";
export type { EntitySearchResult, SearchMatchKind } from "./search";

export const elementLabels: Record<Element, LocalizedText> = {
  physical: { "zh-CN": "物理", en: "Physical", ja: "物理" },
  fire: { "zh-CN": "火", en: "Fire", ja: "炎" },
  ice: { "zh-CN": "冰", en: "Ice", ja: "氷" },
  lightning: { "zh-CN": "雷", en: "Lightning", ja: "雷" },
  wind: { "zh-CN": "风", en: "Wind", ja: "風" },
  quantum: { "zh-CN": "量子", en: "Quantum", ja: "量子" },
  imaginary: { "zh-CN": "虚数", en: "Imaginary", ja: "虚数" },
};

export const pathLabels: Record<Path, LocalizedText> = {
  destruction: { "zh-CN": "毁灭", en: "Destruction", ja: "壊滅" },
  hunt: { "zh-CN": "巡猎", en: "The Hunt", ja: "巡狩" },
  erudition: { "zh-CN": "智识", en: "Erudition", ja: "知恵" },
  harmony: { "zh-CN": "同谐", en: "Harmony", ja: "調和" },
  nihility: { "zh-CN": "虚无", en: "Nihility", ja: "虚無" },
  preservation: { "zh-CN": "存护", en: "Preservation", ja: "存護" },
  abundance: { "zh-CN": "丰饶", en: "Abundance", ja: "豊穣" },
  remembrance: { "zh-CN": "记忆", en: "Remembrance", ja: "記憶" },
  elation: { "zh-CN": "欢愉", en: "Elation", ja: "愉悦" },
};

export function getFactionName(factionId: string, locale: keyof LocalizedText): string {
  const canonicalId = canonicalFactionId(factionId);
  return factions.find((faction) => faction.id === canonicalId)?.names[locale] ?? factionId;
}

const regionLabels: Record<string, LocalizedText> = {
  "herta-space-station": {
    "zh-CN": "黑塔空间站",
    en: "Herta Space Station",
    ja: "宇宙ステーション「ヘルタ」",
  },
  belobog: { "zh-CN": "贝洛伯格", en: "Belobog", ja: "ベロブルグ" },
  penacony: { "zh-CN": "匹诺康尼", en: "Penacony", ja: "ピノコニー" },
  xianzhou: { "zh-CN": "仙舟", en: "Xianzhou", ja: "仙舟" },
  "xianzhou-luofu": { "zh-CN": "仙舟「罗浮」", en: "Xianzhou Luofu", ja: "仙舟「羅浮」" },
  "interastral-peace-corporation": {
    "zh-CN": "星际和平公司",
    en: "Interastral Peace Corporation",
    ja: "スターピースカンパニー",
  },
  amphoreus: { "zh-CN": "翁法罗斯", en: "Amphoreus", ja: "オンパロス" },
  cosmic: { "zh-CN": "银河", en: "Cosmic", ja: "銀河" },
  "astral-express": { "zh-CN": "星穹列车", en: "Astral Express", ja: "星穹列車" },
  planarcadia: { "zh-CN": "哀丽秘榭", en: "Planarcadia", ja: "プラナルカディア" },
  "another-world": { "zh-CN": "异界", en: "Another World", ja: "異界" },
};

export function getRegionName(regionId: string | undefined, locale: keyof LocalizedText): string {
  if (!regionId) return "—";
  return regionLabels[regionId]?.[locale] ?? regionId;
}

export function getSearchText(item: Character): string {
  return getEntitySearchText(item);
}

export function getEntitySearchText(item: Pick<Character, "names" | "aliases">): string {
  return [
    ...Object.values(item.names),
    ...item.aliases["zh-CN"],
    ...item.aliases.en,
    ...item.aliases.ja,
  ]
    .join(" ")
    .toLocaleLowerCase();
}
