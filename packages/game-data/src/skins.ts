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
  {
    id: "robin-summeretto",
    characterId: "robin",
    names: { "zh-CN": "晴歌", en: "Summeretto", ja: "夏空の歌" },
    version: "4.5",
    imagePath: "/assets/skins/robin-summeretto.png",
    sourceUrl:
      "https://fastcdn.hoyoverse.com/content-v2/hkrpg/165435/918e9fb33aa9ea405f5bac6733462567_5622650737230269602.png",
  },
  {
    id: "aventurine-waveflair",
    characterId: "aventurine",
    names: { "zh-CN": "戏浪", en: "Waveflair", ja: "波と戯れる夏" },
    version: "4.5",
    imagePath: "/assets/skins/aventurine-waveflair.png",
    sourceUrl:
      "https://fastcdn.hoyoverse.com/content-v2/hkrpg/165438/4230467ccb497b066f1641ff693b9e25_4037609123022717053.png",
  },
]);

export function getCharacterSkins(characterId: string): readonly CharacterSkin[] {
  return characterSkins.filter((skin) => skin.characterId === characterId);
}
