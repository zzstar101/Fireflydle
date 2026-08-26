import type { LocalizedText } from "@fireflydle/contracts";

export type CharacterSkin = {
  id: string;
  characterId: string;
  names: LocalizedText;
  version: string;
  imagePath: string;
  sourceUrl: string;
};

/** 官方已实装时装。时装属于角色视觉变体，不作为独立角色计入题池。 */
export const characterSkins: readonly CharacterSkin[] = Object.freeze([
  {
    id: "firefly-spring-postcard",
    characterId: "firefly",
    names: { "zh-CN": "春日手信", en: "Spring Postcard", ja: "春日の便り" },
    version: "3.4",
    imagePath: "/assets/skins/firefly-spring-postcard.png",
    sourceUrl: "https://wiki.biligame.com/sr/春日手信",
  },
  {
    id: "march-winter-warmth",
    characterId: "march-7th",
    names: { "zh-CN": "冬去煦至", en: "Winter Warmth", ja: "冬去りのぬくもり" },
    version: "3.0",
    imagePath: "/assets/skins/march-winter-warmth.png",
    sourceUrl: "https://wiki.biligame.com/sr/冬去煦至",
  },
  {
    id: "ruan-mei-snow-plum",
    characterId: "ruan-mei",
    names: { "zh-CN": "雪绽梅笺", en: "Snow Plum Letter", ja: "雪咲く梅便り" },
    version: "4.0",
    imagePath: "/assets/skins/ruan-mei-snow-plum.png",
    sourceUrl: "https://wiki.biligame.com/sr/雪绽梅笺",
  },
  {
    id: "castorice-dream-butterfly",
    characterId: "castorice",
    names: { "zh-CN": "幽梦翩跹", en: "Dreaming Butterfly", ja: "幽夢の蝶" },
    version: "4.2",
    imagePath: "/assets/skins/castorice-dream-butterfly.png",
    sourceUrl: "https://wiki.biligame.com/sr/幽梦翩跹",
  },
  {
    id: "sparkle-sweet-dream",
    characterId: "sparxie",
    names: { "zh-CN": "甜梦电波", en: "Sweet Dream Signal", ja: "甘夢電波" },
    version: "4.4",
    imagePath: "/assets/skins/sparkle-sweet-dream.png",
    sourceUrl: "https://wiki.biligame.com/sr/甜梦电波",
  },
]);

export function getCharacterSkins(characterId: string): readonly CharacterSkin[] {
  return characterSkins.filter((skin) => skin.characterId === characterId);
}
