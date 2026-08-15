import { createHash, randomUUID } from "node:crypto";
import { rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "https://sg-wiki-api.hoyolab.com/hoyowiki/wapi";
const VERSION_NOTICE_API =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=250&iPage=1&iPageSize=500&sLangKey=en-us";
const MENU_ID = "105";
const PAGE_SIZE = 30;
const LOCALES = ["zh-CN", "en", "ja"] as const;
const API_LANG: Record<(typeof LOCALES)[number], string> = {
  "zh-CN": "zh-cn",
  en: "en-us",
  ja: "ja-jp",
};

type Locale = (typeof LOCALES)[number];

type SourceEntry = {
  entry_page_id: string;
  name: string;
  icon_url: string;
  filter_values?: {
    npc_factions?: {
      values?: string[];
    };
  };
};

type CuratedOverride = {
  projectId: string | null;
  status: "target" | "candidate-only" | "pending" | "excluded";
  region: string | null;
  faction: string | null;
  debutVersion: string | null;
  debutNoticeInfoId: number | null;
  debutEvidence?: {
    sourceId: "official-hoyowiki-debut" | "official-game-mission";
    url: string;
    locator: string;
  };
  identityDecision: "standalone" | "merge" | "split" | "exclude" | "pending";
  mergedIntoProjectId?: string;
  review: {
    sourceChecked: boolean;
    namesChecked: boolean;
    fallbackChecked: boolean;
    assetChecked: boolean;
    identityBoundaryChecked: boolean;
    regionChecked: boolean;
    factionChecked: boolean;
    debutChecked: boolean;
    humanApproved: boolean;
  };
  reviewNote: string;
};

const TARGET_REVIEW = {
  sourceChecked: true,
  namesChecked: true,
  fallbackChecked: true,
  assetChecked: true,
  identityBoundaryChecked: true,
  regionChecked: true,
  factionChecked: true,
  debutChecked: true,
  humanApproved: true,
} as const;

const PENDING_REVIEW = {
  sourceChecked: false,
  namesChecked: false,
  fallbackChecked: false,
  assetChecked: false,
  identityBoundaryChecked: false,
  regionChecked: false,
  factionChecked: false,
  debutChecked: false,
  humanApproved: false,
} as const;

const CURATED_OVERRIDES: Record<string, CuratedOverride> = {
  "581": {
    projectId: "npc-pom-pom",
    status: "target",
    region: "Astral Express",
    faction: "Astral Express",
    debutVersion: "1.0",
    debutNoticeInfoId: 111258,
    debutEvidence: {
      sourceId: "official-hoyowiki-debut",
      url: `${API_BASE}/entry_page?entry_page_id=2793`,
      locator: "menu_id=142; entry_page_id=2793; name=A Moment of Peace",
    },
    identityDecision: "standalone",
    review: TARGET_REVIEW,
    reviewNote: "列车长作为独立 NPC；换装统一并入同一实体。",
  },
  "1039": {
    projectId: null,
    status: "pending",
    region: "Belobog",
    faction: "Belobog",
    debutVersion: "1.0",
    debutNoticeInfoId: 111258,
    debutEvidence: {
      sourceId: "official-game-mission",
      url: VERSION_NOTICE_API,
      locator: "in-game Trailblaze Mission=Lying in Rust; version=1.0",
    },
    identityDecision: "standalone",
    review: PENDING_REVIEW,
    reviewNote: "普通剧情形象合并；仍缺可稳定引用的具名官方任务条目来证明首次登场。",
  },
  "841": {
    projectId: null,
    status: "pending",
    region: "Belobog",
    faction: "Belobog",
    debutVersion: "1.0",
    debutNoticeInfoId: 111258,
    identityDecision: "standalone",
    review: {
      ...PENDING_REVIEW,
      sourceChecked: true,
      namesChecked: true,
      fallbackChecked: true,
      assetChecked: false,
      identityBoundaryChecked: true,
      regionChecked: true,
      factionChecked: true,
    },
    reviewNote:
      "只采用普通剧情形象，不把战斗单位另立实体；当前图标为遮面通用铁卫模型，不足以公平辨识。",
  },
  "803": {
    projectId: null,
    status: "pending",
    region: "Belobog",
    faction: "Belobog",
    debutVersion: "1.0",
    debutNoticeInfoId: 111258,
    debutEvidence: {
      sourceId: "official-game-mission",
      url: VERSION_NOTICE_API,
      locator: "in-game Trailblaze Mission=To Rot or to Burn; version=1.0",
    },
    identityDecision: "split",
    review: PENDING_REVIEW,
    reviewNote:
      "史瓦罗具有独立人格，可与克拉拉拆分；首领战形态不另立实体；仍缺可稳定引用的具名官方任务条目。",
  },
  "3058": {
    projectId: "npc-skott",
    status: "target",
    region: "Xianzhou Luofu",
    faction: "Interastral Peace Corporation",
    debutVersion: "1.3",
    debutNoticeInfoId: 112854,
    debutEvidence: {
      sourceId: "official-hoyowiki-debut",
      url: `${API_BASE}/entry_page?entry_page_id=1405`,
      locator: "menu_id=136; entry_page_id=1405; name=Aurum Alley's Hustle and Bustle",
    },
    identityDecision: "standalone",
    review: TARGET_REVIEW,
    reviewNote: "活动内换装和后续复用统一并入同一实体。",
  },
  "2441": {
    projectId: "npc-siobhan",
    status: "target",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: "2.1",
    debutNoticeInfoId: 123034,
    debutEvidence: {
      sourceId: "official-hoyowiki-debut",
      url: `${API_BASE}/entry_page?entry_page_id=2384`,
      locator: "menu_id=136; entry_page_id=2384; name=Vignettes in a Cup",
    },
    identityDecision: "standalone",
    review: TARGET_REVIEW,
    reviewNote: "调饮活动中的普通剧情形象作为同一实体。",
  },
  "2018": {
    projectId: null,
    status: "pending",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: "2.0",
    debutNoticeInfoId: 122325,
    debutEvidence: {
      sourceId: "official-game-mission",
      url: VERSION_NOTICE_API,
      locator: "in-game Adventure Mission=Envision a Rose Forthcoming; version=2.0",
    },
    identityDecision: "standalone",
    review: PENDING_REVIEW,
    reviewNote: "现实与梦境表现视为同一人格；仍缺可稳定引用的具名官方任务条目来证明首次登场。",
  },
  "2232": {
    projectId: null,
    status: "pending",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: "2.0",
    debutNoticeInfoId: 122325,
    debutEvidence: {
      sourceId: "official-game-mission",
      url: VERSION_NOTICE_API,
      locator: "in-game Adventure Mission=The Trees at Peace; version=2.0",
    },
    identityDecision: "standalone",
    review: PENDING_REVIEW,
    reviewNote: "三项字段已有建议值，但仍需用具名任务条目复核首次剧情登场。",
  },
  "2529": {
    projectId: null,
    status: "pending",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: null,
    debutNoticeInfoId: null,
    identityDecision: "standalone",
    review: { ...PENDING_REVIEW, sourceChecked: true },
    reviewNote: "缺少首次剧情登场版本的一手任务证据。",
  },
  "2016": {
    projectId: null,
    status: "pending",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: "2.0",
    debutNoticeInfoId: 122325,
    identityDecision: "pending",
    review: { ...PENDING_REVIEW, sourceChecked: true },
    reviewNote: "需确认独立存在与投影/吉祥物表现的边界后才能成为目标。",
  },
  "1672": {
    projectId: null,
    status: "pending",
    region: "Xianzhou Luofu",
    faction: "Xianzhou Luofu",
    debutVersion: "1.5",
    debutNoticeInfoId: 113648,
    debutEvidence: {
      sourceId: "official-game-mission",
      url: VERSION_NOTICE_API,
      locator: "in-game Trailblaze Continuance=A Foxian Tale of the Haunted; version=1.5",
    },
    identityDecision: "split",
    review: PENDING_REVIEW,
    reviewNote: "独立人格可以拆分，但战斗首领形态必须排除并复核可辨识素材。",
  },
  "3297": {
    projectId: null,
    status: "pending",
    region: "Astral Express",
    faction: "Astral Express",
    debutVersion: null,
    debutNoticeInfoId: null,
    identityDecision: "standalone",
    review: { ...PENDING_REVIEW, sourceChecked: true },
    reviewNote: "有独立名称和素材，但首次剧情登场证据尚未闭合。",
  },
  "1616": {
    projectId: null,
    status: "pending",
    region: null,
    faction: null,
    debutVersion: "1.4",
    debutNoticeInfoId: 113276,
    identityDecision: "standalone",
    review: { ...PENDING_REVIEW, sourceChecked: true },
    reviewNote: "不同语言的阵营字段不一致，主叙事地区也存在跨活动歧义。",
  },
  "2253": {
    projectId: "npc-tizocic-ii",
    status: "pending",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: "2.0",
    debutNoticeInfoId: 122325,
    identityDecision: "merge",
    review: { ...PENDING_REVIEW, sourceChecked: true, identityBoundaryChecked: true },
    reviewNote: "蒂索克二世与蒂索克三世按同一人格合并，待确定公开主名称。",
  },
  "2490": {
    projectId: null,
    status: "excluded",
    region: "Penacony",
    faction: "Penacony",
    debutVersion: "2.0",
    debutNoticeInfoId: 122325,
    identityDecision: "merge",
    mergedIntoProjectId: "npc-tizocic-ii",
    review: {
      ...PENDING_REVIEW,
      sourceChecked: true,
      identityBoundaryChecked: true,
    },
    reviewNote: "与蒂索克二世为同一人格，不创建第二个候选。",
  },
  "903": {
    projectId: null,
    status: "excluded",
    region: "Herta Space Station",
    faction: "Herta Space Station",
    debutVersion: "1.0",
    debutNoticeInfoId: 111258,
    identityDecision: "exclude",
    review: {
      ...PENDING_REVIEW,
      sourceChecked: true,
      identityBoundaryChecked: true,
    },
    reviewNote: "黑塔已属于可玩角色题池，NPC 投影/人偶表现不重复进入 NPC 池。",
  },
};

function headers(locale: Locale): HeadersInit {
  return {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    Origin: "https://wiki.hoyolab.com",
    Referer: "https://wiki.hoyolab.com/",
    "User-Agent": "Mozilla/5.0",
    "x-rpc-app_version": "2.0.0",
    "x-rpc-client_type": "4",
    "x-rpc-device_id": randomUUID(),
    "x-rpc-language": API_LANG[locale],
    "x-rpc-wiki_app": "hsr",
  };
}

async function fetchPage(
  locale: Locale,
  pageNumber: number,
): Promise<{
  entries: SourceEntry[];
  total: number;
}> {
  const response = await fetch(`${API_BASE}/get_entry_page_list`, {
    method: "POST",
    headers: headers(locale),
    body: JSON.stringify({
      filters: [],
      menu_id: MENU_ID,
      page_num: pageNumber,
      page_size: PAGE_SIZE,
      use_es: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`${locale} 第 ${pageNumber} 页返回 HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    retcode: number;
    message: string;
    data: { list: SourceEntry[]; total: string };
  };
  if (payload.retcode !== 0) {
    throw new Error(`${locale} 第 ${pageNumber} 页返回 ${payload.retcode}: ${payload.message}`);
  }

  return { entries: payload.data.list, total: Number(payload.data.total) };
}

async function fetchLocale(locale: Locale): Promise<SourceEntry[]> {
  const first = await fetchPage(locale, 1);
  const pageCount = Math.ceil(first.total / PAGE_SIZE);
  const entries = [...first.entries];

  for (let page = 2; page <= pageCount; page += 1) {
    const result = await fetchPage(locale, page);
    entries.push(...result.entries);
  }

  if (entries.length !== first.total) {
    throw new Error(`${locale} 预期 ${first.total} 条，实际抓取 ${entries.length} 条`);
  }
  return entries;
}

function sourceEntryUrl(entryPageId: string): string {
  return `${API_BASE}/entry_page?entry_page_id=${entryPageId}`;
}

const lists = Object.fromEntries(
  await Promise.all(LOCALES.map(async (locale) => [locale, await fetchLocale(locale)])),
) as Record<Locale, SourceEntry[]>;

const byLocale = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    new Map(lists[locale].map((entry) => [entry.entry_page_id, entry])),
  ]),
) as Record<Locale, Map<string, SourceEntry>>;

const entryPageIds = [
  ...new Set(LOCALES.flatMap((locale) => lists[locale].map((entry) => entry.entry_page_id))),
].sort((left, right) => Number(left) - Number(right));

const entries = entryPageIds.map((entryPageId) => {
  const localizedEntries = Object.fromEntries(
    LOCALES.flatMap((locale) => {
      const sourceEntry = byLocale[locale].get(entryPageId);
      return sourceEntry ? [[locale, sourceEntry]] : [];
    }),
  ) as Partial<Record<Locale, SourceEntry>>;
  const fallbackLocale = LOCALES.find((locale) => localizedEntries[locale])!;
  const fallbackEntry = localizedEntries[fallbackLocale]!;
  const override = CURATED_OVERRIDES[entryPageId];
  const status = override?.status ?? "pending";
  const names = Object.fromEntries(
    LOCALES.flatMap((locale) => {
      const name = localizedEntries[locale]?.name;
      return name ? [[locale, name]] : [];
    }),
  );
  const factionsByLocale = Object.fromEntries(
    LOCALES.flatMap((locale) => {
      const values = localizedEntries[locale]?.filter_values?.npc_factions?.values;
      return values?.length ? [[locale, values]] : [];
    }),
  );
  const iconUrls = [
    ...new Set(LOCALES.map((locale) => localizedEntries[locale]?.icon_url).filter(Boolean)),
  ];

  return {
    censusEntryKey: `hoyowiki:${MENU_ID}:${entryPageId}`,
    projectId: override?.projectId ?? null,
    sourceEntryPageId: entryPageId,
    status,
    names,
    fallbackLocale,
    factionsByLocale,
    recognizableAsset: {
      status: iconUrls.length > 0 ? "available" : "missing",
      sourceUrls: iconUrls,
      manuallyChecked: override?.review.assetChecked ?? false,
    },
    quizFields: {
      region: override?.region ?? null,
      faction: override?.faction ?? null,
      debutVersion: override?.debutVersion ?? null,
    },
    identity: {
      decision: override?.identityDecision ?? "pending",
      mergedIntoProjectId: override?.mergedIntoProjectId ?? null,
    },
    sources: [
      {
        sourceId: "official-hoyowiki-npc",
        url: sourceEntryUrl(entryPageId),
        locator: `menu_id=${MENU_ID}; entry_page_id=${entryPageId}; name=${fallbackEntry.name}`,
        supports: ["identity", "names", "faction", "asset"],
      },
      ...(override?.debutNoticeInfoId
        ? [
            {
              sourceId: "official-version-notices",
              url: VERSION_NOTICE_API,
              locator: `iInfoId=${override.debutNoticeInfoId}; version=${override.debutVersion}`,
              supports: ["debutVersion"],
            },
          ]
        : []),
      ...(override?.debutEvidence
        ? [
            {
              sourceId: override.debutEvidence.sourceId,
              url: override.debutEvidence.url,
              locator: `${override.debutEvidence.locator}; npc=${fallbackEntry.name}; region=${override.region}`,
              supports: ["debutEvidence", ...(status === "target" ? ["region"] : [])],
            },
          ]
        : []),
    ],
    review: {
      ...(override?.review ?? PENDING_REVIEW),
      note:
        override?.reviewNote ??
        "官方 NPC 菜单已收录，但主叙事地区、首次剧情登场版本和身份边界尚未逐项审核。",
    },
  };
});

const statusCounts = Object.groupBy(entries, (entry) => entry.status);
const completeNames = entries.filter((entry) =>
  LOCALES.every((locale) => entry.names[locale]),
).length;
const completeQuizFields = entries.filter((entry) =>
  Object.values(entry.quizFields).every((value) => value !== null),
).length;
const sourceDigest = createHash("sha256").update(JSON.stringify(lists)).digest("hex");
const retrievedAt = new Date().toISOString();
const asOf = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(retrievedAt));

const output = {
  schemaVersion: 1,
  asOf,
  scope: {
    sourceRoster: "HoYoWiki HSR NPC menu 105",
    sourceCounts: Object.fromEntries(LOCALES.map((locale) => [locale, lists[locale].length])),
    unionEntries: entries.length,
    policy:
      "以官方 NPC 菜单为 census 基线；未逐项闭合证据者默认 pending，不以预设数量推动为 candidate-only 或 target。",
  },
  coverage: {
    statusCounts: {
      target: statusCounts.target?.length ?? 0,
      candidateOnly: statusCounts["candidate-only"]?.length ?? 0,
      pending: statusCounts.pending?.length ?? 0,
      excluded: statusCounts.excluded?.length ?? 0,
    },
    anyUsableName: `${entries.filter((entry) => Object.keys(entry.names).length > 0).length}/${entries.length}`,
    threeLocaleNames: `${completeNames}/${entries.length}`,
    recognizableAsset: `${entries.filter((entry) => entry.recognizableAsset.status === "available").length}/${entries.length}`,
    sourceTrace: `${entries.filter((entry) => entry.sources.length > 0).length}/${entries.length}`,
    completeQuizFields: `${completeQuizFields}/${entries.length}`,
    humanApprovedTargets: `${entries.filter((entry) => entry.status === "target" && entry.review.humanApproved).length}/${statusCounts.target?.length ?? 0}`,
  },
  policy: {
    target:
      "仅限来源、可用名称与回退、可辨识素材、主叙事地区、主派系、首次剧情登场版本和身份边界全部人工确认的 NPC。",
    candidateOnly:
      "已完成候选所需的身份、名称、来源和字段策展，可建议进入将来搜索候选池，但不得成为答案。",
    pending:
      "官方 census 条目或补充建议尚有身份、字段、素材或来源争议；不属于可搜索候选池。默认状态即 pending。",
    excluded:
      "可玩角色重复项、战斗首领形态、同人格换装/年龄/投影重复项、无稳定个体身份者不入 NPC 池。",
    identity:
      "换装、年龄、投影和普通剧情形象默认合并；官方明确独立人格或存在才拆分；战斗首领形态不入池。",
    complexity: "这是版本化策展快照和人工清单，不是运行时 NPC 数据库、持续抓取平台或企业审批流。",
  },
  reviewChecklist: [
    "sourceChecked",
    "namesChecked",
    "fallbackChecked",
    "assetChecked",
    "identityBoundaryChecked",
    "regionChecked",
    "factionChecked",
    "debutChecked",
    "humanApproved",
  ],
  unresolvedEvidenceGaps: [
    "官方 NPC 菜单只提供宽泛阵营，不提供主叙事地区和首次剧情登场版本。",
    "版本公告只能证明版本存在，pending 与 candidate-only 仍需具名任务条目或可复核的游戏内任务记录来证明首次登场。",
    "部分语言 NPC 菜单数量短暂不同步；缺少语言时使用该条目实际存在的首个语言名称回退。",
    "官方 CDN 图标存在不等于适合作为公平题目；只有 target 已标记为人工检查可辨识。",
    "Mikhail、Gopher Wood、Tiernan 等高知名度 NPC 未在本次官方菜单快照中形成可稳定对齐的 NPC 条目，暂不凭社区页面补入 target。",
  ],
  sources: {
    officialHoyowikiNpc: {
      menuId: MENU_ID,
      menuUrl: "https://wiki.hoyolab.com/pc/hsr/home",
      listApi: `${API_BASE}/get_entry_page_list`,
      retrievedAt,
      responseSha256: sourceDigest,
      rights:
        "官方公开页面未声明开放数据或素材许可证；这里只记录少量事实和来源 URL，不下载或重新发布图片。",
    },
    officialVersionNotices: {
      listApi: VERSION_NOTICE_API,
      use: "只对齐已人工确认的首次剧情登场版本；公告本身不替代具名任务证据。",
    },
  },
  entries,
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../packages/game-data/src/data/npc-census.json");
await writeAtomic(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`已写入 ${entries.length} 条 NPC census：${outputPath}`);

async function writeAtomic(path: string, content: string): Promise<void> {
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  const backup = `${path}.${process.pid}.backup`;
  let targetExisted = false;
  await writeFile(temporary, content, { encoding: "utf8" });

  try {
    await stat(path);
    targetExisted = true;
    await rename(path, backup);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    await rename(temporary, path);
    if (targetExisted) await unlink(backup);
  } catch (error) {
    try {
      await unlink(temporary);
    } catch {
      // 临时文件已被移动或不存在时无需处理。
    }
    if (targetExisted) {
      try {
        await rename(backup, path);
      } catch {
        // 原始错误优先，备份仍保留在同目录供人工恢复。
      }
    }
    throw error;
  }
}
