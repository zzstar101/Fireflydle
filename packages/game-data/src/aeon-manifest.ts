import { ContentManifestSchema, type ContentManifest, type Locale } from "@fireflydle/contracts";

export type AeonAssetKind = "official-main-art" | "official-path-emblem-fallback";

type AeonDefinition = {
  id: string;
  names: Record<Locale, string>;
  entryId: number;
  image: string;
  focus: readonly [number, number];
  assetKind: AeonAssetKind;
  sourceAssetUrl: string;
  sha256: string;
  width: number;
  height: number;
};

const DEFINITIONS: readonly AeonDefinition[] = [
  {
    id: "aha",
    names: { "zh-CN": "阿哈", en: "Aha", ja: "アッハ" },
    entryId: 883,
    image: "01.webp",
    focus: [0.5, 0.48],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/22/250281765/b6bbbd8e0c5c4bf49ead5a39b6429041_4585180775013259954.png",
    sha256: "cb38f0535833d6d73a125bf0b6605ebb13189d91bcb6bfffa0d3aefb5129583c",
    width: 757,
    height: 757,
  },
  {
    id: "akivili",
    names: { "zh-CN": "阿基维利", en: "Akivili", ja: "アキヴィリ" },
    entryId: 896,
    image: "02.webp",
    focus: [0.5, 0.5],
    assetKind: "official-path-emblem-fallback",
    sourceAssetUrl:
      "https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2024/03/03/310141917/b9cf8c72a7e1741d50ec0d74cc399f92_6102263996548855284.png",
    sha256: "8511eb1fb0c62d296b70106eaf1e61306e6b4796b24c66170445c70b4d007d33",
    width: 489,
    height: 510,
  },
  {
    id: "ena",
    names: { "zh-CN": "太一", en: "Ena", ja: "エナ" },
    entryId: 1222,
    image: "03.webp",
    focus: [0.5, 0.46],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/09/18/6799252/f83673668bde6dbaf2b086c36f90f7e4_5785076247961761852.png",
    sha256: "92b56c6d0df3a369f584d9c081a0e41bc8115dea8f16bb17336f54ffbcb121df",
    width: 296,
    height: 295,
  },
  {
    id: "fuli",
    names: { "zh-CN": "浮黎", en: "Fuli", ja: "浮黎" },
    entryId: 888,
    image: "04.webp",
    focus: [0.5, 0.48],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/23/250281765/d6c31951065f38b1e7836c3b5b33ceff_4091828791051468038.png",
    sha256: "b8aefb80788b7da3cb3d2923d921089ceed589c958c5d95b53311b99cf515e49",
    width: 529,
    height: 529,
  },
  {
    id: "hooh",
    names: { "zh-CN": "互", en: "HooH", ja: "互" },
    entryId: 890,
    image: "05.webp",
    focus: [0.5, 0.48],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2024/01/04/167256510/5af2af603f85df53fe250b8327e2dfb1_4295391010150517903.png",
    sha256: "364d74bf823305a7b187c80b3825781ec64bf1661ae357a3d55eb4cffeccdf45",
    width: 200,
    height: 139,
  },
  {
    id: "idrila",
    names: { "zh-CN": "伊德莉拉", en: "Idrila", ja: "イドリラ" },
    entryId: 893,
    image: "06.webp",
    focus: [0.5, 0.5],
    assetKind: "official-path-emblem-fallback",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/23/250281765/992a0513970a6a76dbe70b22dd770e70_8027765677325237829.png",
    sha256: "2ceee29627e54b7c2260bf30d153dbd91c7a067462764168868cf0ccd929b1b4",
    width: 720,
    height: 720,
  },
  {
    id: "ix",
    names: { "zh-CN": "Ⅸ", en: "IX", ja: "IX" },
    entryId: 887,
    image: "07.webp",
    focus: [0.5, 0.5],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/22/250281765/3039defbc3fa43c9d3e1c875ff9b3cac_4231337302815980995.png",
    sha256: "70a714c1b5e7b40c8e7e6089a157e371bc5715ff78c41b70f456bdf30a1089d2",
    width: 687,
    height: 687,
  },
  {
    id: "lan",
    names: { "zh-CN": "岚", en: "Lan", ja: "嵐" },
    entryId: 885,
    image: "08.webp",
    focus: [0.52, 0.43],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/22/250281765/7a81e2b91cc6d354235a2ef99e9ae1fc_6513640138295289177.png",
    sha256: "1fa3a4633842316f3c1c1c4be892c0df11438f21aef1dacbc46851c8b8ff1bb7",
    width: 283,
    height: 283,
  },
  {
    id: "long",
    names: { "zh-CN": "龙", en: "Long", ja: "龍" },
    entryId: 1210,
    image: "09.webp",
    focus: [0.48, 0.48],
    assetKind: "official-path-emblem-fallback",
    sourceAssetUrl:
      "https://static.wikia.nocookie.net/houkai-star-rail/images/8/86/Path_Permanence.png/revision/latest?cb=20260215021432",
    sha256: "af17c42e51031c73523944d0afda64521c361f121db5198868866d031a99cc14",
    width: 803,
    height: 801,
  },
  {
    id: "mythus",
    names: { "zh-CN": "迷思", en: "Mythus", ja: "ミュトゥス" },
    entryId: 891,
    image: "10.webp",
    focus: [0.5, 0.52],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://act-upload.hoyoverse.com/event-ugc-hoyowiki/2024/01/04/167256510/adacfe86f38e8888f128ba4a6ab6ab9b_6543455597705167005.png",
    sha256: "80948c37a4531459e05a4d6d52fae0c82f1e2c09b8c71f081c765530cf5ac943",
    width: 200,
    height: 139,
  },
  {
    id: "nanook",
    names: { "zh-CN": "纳努克", en: "Nanook", ja: "ナヌーク" },
    entryId: 884,
    image: "11.webp",
    focus: [0.5, 0.42],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/22/250281765/cf7a0de626c996ae42c9137c443a66e7_1421223029062292258.png",
    sha256: "8ac1e98144d31d48e685d5b70aea2d6c6a1a603cccb68ffd32043f8306f63a27",
    width: 315,
    height: 315,
  },
  {
    id: "nous",
    names: { "zh-CN": "博识尊", en: "Nous", ja: "ヌース" },
    entryId: 895,
    image: "12.webp",
    focus: [0.5, 0.48],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/07/05/250281765/f851a5616cf72377b86f092bf4922cae_1196865774381024278.png",
    sha256: "af4cacff07a4405ada73de82ab9d3b9eadc31d482f823ad233e61f6ff48c84dc",
    width: 968,
    height: 968,
  },
  {
    id: "oroboros",
    names: { "zh-CN": "奥博洛斯", en: "Oroboros", ja: "ウロボロス" },
    entryId: 897,
    image: "13.webp",
    focus: [0.5, 0.5],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/09/18/6799252/a507ab04dc8863b4f6323eb39fdc383c_2148718354358782209.png",
    sha256: "f19d34deee89f4529988b7178e0ed02353c729cc9ec9a6ee8ee33840dfa7ba76",
    width: 118,
    height: 115,
  },
  {
    id: "qlipoth",
    names: { "zh-CN": "克里珀", en: "Qlipoth", ja: "クリフォト" },
    entryId: 889,
    image: "14.webp",
    focus: [0.5, 0.47],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/22/250281765/dd493785a69c03666887cc536756fda0_2560434127200079023.png",
    sha256: "cefca1b7691b36637328145645fc332f5040df167d27973e73d8e68410fddc84",
    width: 711,
    height: 711,
  },
  {
    id: "tayzzyronth",
    names: { "zh-CN": "塔伊兹育罗斯", en: "Tayzzyronth", ja: "タイズルス" },
    entryId: 892,
    image: "15.webp",
    focus: [0.5, 0.45],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/09/18/6799252/b8769c9df34ef9a6bb8246c2a22bb009_8895379902410496580.png",
    sha256: "5d58e85aea5ed3b443f5305973a6cecdd5b420cbe8e9d02bd0e0663525fee6e8",
    width: 871,
    height: 871,
  },
  {
    id: "terminus",
    names: { "zh-CN": "末王", en: "Terminus", ja: "テルミヌス" },
    entryId: 1211,
    image: "16.webp",
    focus: [0.5, 0.5],
    assetKind: "official-path-emblem-fallback",
    sourceAssetUrl: "https://www.bilibili.com/video/BV1EM4y1h7Vm/",
    sha256: "336505d4a319be6087d945cfdba6956800859fa4ad1d4715c4df1a2f01a74b9e",
    width: 720,
    height: 720,
  },
  {
    id: "xipe",
    names: { "zh-CN": "希佩", en: "Xipe", ja: "シペ" },
    entryId: 894,
    image: "17.webp",
    focus: [0.5, 0.42],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/07/05/250281765/61ab57bdf7afc41e7813ea48563b13fd_6595009449542762914.png",
    sha256: "ff87709711b5f0fecbb13c3e9a87d1112604392059165aed62c0094088dc10df",
    width: 305,
    height: 305,
  },
  {
    id: "yaoshi",
    names: { "zh-CN": "药师", en: "Yaoshi", ja: "薬師" },
    entryId: 886,
    image: "18.webp",
    focus: [0.5, 0.44],
    assetKind: "official-main-art",
    sourceAssetUrl:
      "https://upload-static.hoyoverse.com/hoyolab-wiki/2023/06/22/250281765/9e7e849ca15d6bec65a6814bbd591ecf_4656878012264589158.png",
    sha256: "e2541fae20cb22176c610236d2fbd7d424d7092d681abedc502d55c5f73d422e",
    width: 332,
    height: 332,
  },
];

export const aeonAssetAudit = DEFINITIONS.map((definition) => ({
  id: `aeon-${definition.id}`,
  assetKind: definition.assetKind,
  localPath: `/assets/aeons/${definition.image}`,
  officialPageUrl: `https://wiki.hoyolab.com/pc/hsr/entry/${definition.entryId}`,
  sourceAssetUrl: definition.sourceAssetUrl,
  sha256: definition.sha256,
  width: definition.width,
  height: definition.height,
  focus: definition.focus,
}));

const entities = DEFINITIONS.map((definition) => ({
  id: `aeon-${definition.id}`,
  kind: "aeon" as const,
  names: definition.names,
  aliases: {
    "zh-CN": [definition.names["zh-CN"]],
    en: [definition.names.en],
    ja: [definition.names.ja],
  },
  source: {
    url: `https://wiki.hoyolab.com/pc/hsr/entry/${definition.entryId}`,
    revision: "official-aeon-menu-2026-08-17",
  },
  reviewStatus: "approved" as const,
  payload: {
    assets: {
      imagePath: `/assets/aeons/${definition.image}`,
      focus: definition.focus,
    },
  },
}));

export const aeonManifest: ContentManifest = ContentManifestSchema.parse({
  manifestVersion: "1.0.1",
  generatedAt: "2026-08-17T00:00:00.000Z",
  modes: [
    {
      id: "aeon",
      label: { "zh-CN": "星神", en: "Aeons", ja: "星神" },
      targetPoolId: "aeon-targets",
      candidatePoolId: "aeon-candidates",
      fields: [
        {
          id: "image",
          label: { "zh-CN": "星神图片", en: "Aeon image", ja: "星神画像" },
          valueType: "image",
          comparison: "exact",
          required: true,
        },
      ],
      maxAttempts: 6,
      rulesVersion: "1.0.0",
      activities: ["practice", "endless"],
    },
  ],
  activities: [
    {
      id: "practice",
      label: { "zh-CN": "练习", en: "Practice", ja: "練習" },
      modeIds: ["aeon"],
      enabled: true,
    },
    {
      id: "endless",
      label: { "zh-CN": "无尽", en: "Endless", ja: "エンドレス" },
      modeIds: ["aeon"],
      enabled: true,
    },
  ],
  pools: [
    {
      id: "aeon-targets",
      modeId: "aeon",
      targetIds: entities.map(({ id }) => id),
      candidateIds: entities.map(({ id }) => id),
    },
    {
      id: "aeon-candidates",
      modeId: "aeon",
      targetIds: entities.map(({ id }) => id),
      candidateIds: entities.map(({ id }) => id),
    },
  ],
  entities,
});

export type AeonEntity = (typeof entities)[number];
