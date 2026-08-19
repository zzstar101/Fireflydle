import {
  CharacterSchema,
  ContentManifestSchema,
  FactionSchema,
  VersionSchema,
  type Character,
  type Element,
  type Faction,
  type LocalizedText,
  type Path,
  type Version,
} from "@fireflydle/contracts";
import characterData from "./generated/characters.json";
import contentManifestData from "./generated/content-manifest.json";
import factionData from "./generated/factions.json";
import versionData from "./generated/versions.json";
import { buildPlayableManifest } from "./content-manifest";

const parsedCharacters = CharacterSchema.array().parse(characterData);

export const factions: readonly Faction[] = Object.freeze(FactionSchema.array().parse(factionData));
export const versions: readonly Version[] = Object.freeze(VersionSchema.array().parse(versionData));

const derivedContentManifest = buildPlayableManifest(parsedCharacters);
const publishedContentManifest = ContentManifestSchema.parse(contentManifestData);
if (JSON.stringify(derivedContentManifest) !== JSON.stringify(publishedContentManifest)) {
  throw new Error("内容 manifest 与旧角色发布数据不一致，请重新运行 sync:content。");
}
export const contentManifest = Object.freeze(publishedContentManifest);

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

function canonicalFactionId(factionId: string): string {
  return factionId === "interastral-peace-corporation" ? "ipc" : factionId;
}

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
  planarcadia: { "zh-CN": "二相乐园", en: "Planarcadia", ja: "二相楽園" },
  "another-world": { "zh-CN": "异界", en: "Another World", ja: "異界" },
};

export function getRegionName(regionId: string | undefined, locale: keyof LocalizedText): string {
  if (!regionId) return "—";
  return regionLabels[regionId]?.[locale] ?? regionId;
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

export function getSearchText(item: Character): string {
  return getEntitySearchText(item);
}

export { buildPlayableManifest } from "./content-manifest";
