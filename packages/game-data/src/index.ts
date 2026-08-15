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

/**
 * 发布数据由 scripts/sync-characters.ts 从已审核来源生成。
 * 在模块边界再验证一次，避免手工修改 JSON 后把非法数据带入前端或 D1。
 */
export const characters: readonly Character[] = Object.freeze(
  CharacterSchema.array().parse(characterData),
);

export const factions: readonly Faction[] = Object.freeze(FactionSchema.array().parse(factionData));

export const versions: readonly Version[] = Object.freeze(VersionSchema.array().parse(versionData));

/** 新内容系统的普通角色 manifest；旧角色导出仍是迁移期的兼容公开入口。 */
const derivedContentManifest = buildPlayableManifest(characters);
const publishedContentManifest = ContentManifestSchema.parse(contentManifestData);
if (JSON.stringify(derivedContentManifest) !== JSON.stringify(publishedContentManifest)) {
  throw new Error("内容 manifest 与旧角色发布数据不一致，请重新运行 sync:content。");
}
export const contentManifest = Object.freeze(publishedContentManifest);

export { buildPlayableManifest } from "./content-manifest";

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
  return factions.find((faction) => faction.id === factionId)?.names[locale] ?? factionId;
}

export function getSearchText(item: Character): string {
  return [
    ...Object.values(item.names),
    ...item.aliases["zh-CN"],
    ...item.aliases.en,
    ...item.aliases.ja,
  ]
    .join(" ")
    .toLocaleLowerCase();
}
