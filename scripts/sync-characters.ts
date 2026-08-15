import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";

import {
  CharacterSchema,
  FactionSchema,
  VersionSchema,
  type Character,
  type Element,
  type Faction,
  type LocalizedAliases,
  type LocalizedText,
  type Path,
  type Version,
} from "../packages/contracts/src/index.ts";
import overridesJson from "../packages/game-data/src/data/sync-overrides.json";
import { generateResponsiveVariants, type ResponsiveVariantResult } from "./responsive-assets.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const GAME_DATA_PACKAGE_PATH = join(REPO_ROOT, "packages", "game-data", "package.json");
const GENERATED_DATA_DIR = join(REPO_ROOT, "packages", "game-data", "src", "generated");
const GENERATED_SQL_PATH = join(REPO_ROOT, "packages", "game-data", "generated", "characters.sql");
const PUBLIC_ASSET_DIR = join(REPO_ROOT, "apps", "web", "public", "assets");
const CHARACTER_ASSET_DIR = join(PUBLIC_ASSET_DIR, "characters");
const DEFAULT_CACHE_DIR = join(REPO_ROOT, "tmp", "fireflydle-data-cache");

const HOYO_API_BASE =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList";
const HOYO_CHARACTER_CHANNEL = 242;
const HOYO_FACTION_CHANNEL = 241;
const HOYO_NOTICE_CHANNEL = 250;
const HOYO_LOCALES = {
  "zh-CN": "zh-cn",
  en: "en-us",
  ja: "ja-jp",
} as const;
const STARRAIL_RES_REPOSITORY = "Mar-7th/StarRailRes";
const STARRAIL_RES_BRANCH = "master";
const RIGHTS_NOTICE =
  "Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.";
const PLANNED_HASH = "0".repeat(64);
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_ASSET_BYTES = 3 * 1024 * 1024;

const requireFromGameData = createRequire(GAME_DATA_PACKAGE_PATH);
const { pinyin } = requireFromGameData("pinyin-pro") as {
  pinyin: (value: string, options: { toneType: "none" }) => string;
};
const { toRomaji } = requireFromGameData("wanakana") as {
  toRomaji: (value: string) => string;
};

interface CliOptions {
  asOf: Date;
  asOfLabel: string;
  cacheDir: string;
  dryRun: boolean;
  offline: boolean;
  refreshCache: boolean;
}

interface SyncOverrides {
  schemaVersion: number;
  minimumOfficialRosterSize: number;
  minimumVersionNoticeCount: number;
  ambiguousOfficialContentIds: Record<string, string>;
  canonicalIdOverrides: Record<string, string>;
  baseCharacterIdOverrides: Record<string, string>;
  releaseVersionOverrides: Record<string, string>;
  displayNameOverrides: Record<string, LocalizedText>;
  aliasesByOfficialId: Record<string, LocalizedAliases>;
  pinyinOverridesByOfficialId: Record<string, string[]>;
  romajiOverridesByOfficialId: Record<string, string[]>;
  factionIdsByCategory: Record<string, string>;
  factionGroupByOfficialId: Record<string, string>;
  subfactionDefinitions: SubfactionOverride[];
  subfactionByOfficialId: Record<string, string>;
  trailblazerForms: TrailblazerOverride[];
}

interface SubfactionOverride {
  id: string;
  groupId: string;
  names: LocalizedText;
  sourceOfficialIds: string[];
}

interface TrailblazerOverride {
  id: string;
  officialId: string;
  mergedOfficialIds: [string, string];
  names: LocalizedText;
  aliases: LocalizedAliases;
  releaseVersionId: string;
}

interface HoyoContentItem {
  dtCreateTime: string;
  dtEndTime: string;
  dtStartTime: string;
  iInfoId: number;
  sCategoryName: string;
  sExt: string;
  sTitle: string;
}

interface HoyoContentPayload {
  retcode: number;
  message: string;
  data: {
    iTotal: number;
    list: HoyoContentItem[];
  };
}

interface HoyoCharacterExt {
  "cha-id": string;
  active?: string;
  avatarActivePC?: Array<{ name?: string; url?: string }>;
  avatarPC?: Array<{ name?: string; url?: string }>;
  name?: string;
  poster?: Array<{ name?: string; url?: string }>;
  posterPC?: Array<{ name?: string; url?: string }>;
}

interface StarRailCharacter {
  element: string;
  icon: string;
  id: string;
  name: string;
  path: string;
  portrait: string;
  preview: string;
  rarity: number;
  tag: string;
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    committer: {
      date: string;
    };
  };
  html_url: string;
}

interface OfficialLocalizedRecord {
  category: string;
  contentId: number;
  createdAt: string;
  endAt: string;
  ext: HoyoCharacterExt;
  name: string;
  sourceName: string;
  startAt: string;
  webCharacterId: string;
}

interface CharacterDraft extends Omit<Character, "assets"> {
  assetSourceKind: "hoyoverse-content-api" | "starrailres-trailblazer-fallback";
  assetSourceUrl: string;
  sourceUpdatedAt: string;
}

interface AssetResult {
  bytes: Uint8Array;
  characterId: string;
  extension: string;
  localFileName: string;
  mimeType: string;
  sha256: string;
  sourceKind: CharacterDraft["assetSourceKind"];
  sourceUrl: string;
  responsiveVariants: ResponsiveVariantResult[];
}

interface CachedJson<T> {
  body: T;
  bodySha256: string;
  fetchedAt: string;
  sourceUrl: string;
}

interface VersionNotice {
  infoId: number;
  releasedAt: string;
  sourceTitle: string;
  version: string;
}

interface SourceBundle {
  characterPayloads: Record<keyof typeof HOYO_LOCALES, CachedJson<HoyoContentPayload>>;
  factionPayloads: Record<keyof typeof HOYO_LOCALES, CachedJson<HoyoContentPayload>>;
  noticePayload: CachedJson<HoyoContentPayload>;
  starCharacters: Record<keyof typeof HOYO_LOCALES, CachedJson<Record<string, StarRailCharacter>>>;
  starCommit: CachedJson<GitHubCommitResponse>;
}

const overrides = overridesJson as unknown as SyncOverrides;

function parseCliOptions(argv: string[]): CliOptions {
  let dryRun = false;
  let offline = false;
  let refreshCache = false;
  let cacheDir = DEFAULT_CACHE_DIR;
  let asOfInput: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      dryRun = true;
    } else if (argument === "--offline") {
      offline = true;
    } else if (argument === "--refresh-cache") {
      refreshCache = true;
    } else if (argument === "--cache-dir") {
      cacheDir = requireFollowingValue(argv, ++index, "--cache-dir");
    } else if (argument?.startsWith("--cache-dir=")) {
      cacheDir = argument.slice("--cache-dir=".length);
    } else if (argument === "--as-of") {
      asOfInput = requireFollowingValue(argv, ++index, "--as-of");
    } else if (argument?.startsWith("--as-of=")) {
      asOfInput = argument.slice("--as-of=".length);
    } else if (argument === "--help" || argument === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`未知参数：${argument ?? "<empty>"}`);
    }
  }

  if (offline && refreshCache) {
    throw new Error("--offline 与 --refresh-cache 不能同时使用。");
  }

  const asOfLabel = asOfInput ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfLabel)) {
    throw new Error("--as-of 必须是 YYYY-MM-DD。");
  }
  const asOf = new Date(`${asOfLabel}T23:59:59.999Z`);
  if (Number.isNaN(asOf.getTime())) {
    throw new Error(`无效的 --as-of：${asOfLabel}`);
  }

  return {
    asOf,
    asOfLabel,
    cacheDir: resolve(REPO_ROOT, cacheDir),
    dryRun,
    offline,
    refreshCache,
  };
}

function requireFollowingValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} 缺少参数。`);
  }
  return value;
}

function printHelp(): void {
  console.log(`Fireflydle 角色数据同步

用法：bun scripts/sync-characters.ts [options]

  --dry-run              抓取并验证数据/素材 URL，不覆盖发布文件
  --offline              禁止网络，仅使用 --cache-dir 中的缓存
  --refresh-cache        强制重新下载素材；元数据始终优先请求最新值
  --cache-dir <path>     缓存目录（默认 tmp/fireflydle-data-cache）
  --as-of YYYY-MM-DD     只收录截至该 UTC 日已上线的内容
  --help                 显示帮助
`);
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function formattedJsonText(value: unknown): Promise<string> {
  return prettierFormat(jsonText(value), {
    parser: "json",
    printWidth: 100,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
  });
}

function compactJson(value: unknown): string {
  return JSON.stringify(value);
}

function parseUtcTimestamp(value: string, label: string): Date {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}Z`;
  const parsed = new Date(withZone);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} 包含无效时间：${value}`);
  }
  return parsed;
}

function isoTimestamp(value: string, label: string): string {
  return parseUtcTimestamp(value, label).toISOString();
}

function sourceDate(value: string): string {
  return value.slice(0, 10);
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function plainOfficialText(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function officialJapaneseReading(value: string): string {
  const withRubyReadings = value.replace(/<ruby\b[^>]*>[\s\S]*?<\/ruby>/gi, (ruby) => {
    const reading = ruby.match(/<rt\b[^>]*>([\s\S]*?)<\/rt>/i)?.[1];
    return reading ? plainOfficialText(reading) : plainOfficialText(ruby);
  });
  return plainOfficialText(withRubyReadings);
}

function latinAliasForms(value: string): string[] {
  const spaced = value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!spaced) return [];
  const compact = spaced.replaceAll(" ", "");
  return spaced === compact ? [spaced] : [spaced, compact];
}

function pinyinAliases(value: string): string[] {
  const hanOnly = value.match(/\p{Script=Han}+/gu)?.join("") ?? "";
  if (!hanOnly) return [];
  return latinAliasForms(pinyin(hanOnly, { toneType: "none" }));
}

function romajiAliases(value: string): string[] {
  const kanaOnly = value.match(/[\p{Script=Hiragana}\p{Script=Katakana}ー]+/gu)?.join(" ") ?? "";
  if (!kanaOnly) return [];
  const romaji = latinAliasForms(toRomaji(kanaOnly));
  const keyboardFriendly = romaji.flatMap((alias) =>
    latinAliasForms(alias.replace(/([aeiou])\1+/g, "$1")),
  );
  return [...romaji, ...keyboardFriendly];
}

function uniqueAliases(values: Iterable<string>, displayName: string): string[] {
  const displayValue = displayName.trim();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, " ");
    const key = value.toLocaleLowerCase();
    if (!value || value === displayValue || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function generatedAliases(
  officialId: string,
  names: LocalizedText,
  japaneseSource: string | undefined,
  manual: LocalizedAliases | undefined,
): LocalizedAliases {
  const manualAliases = manual ?? { "zh-CN": [], en: [], ja: [] };
  const chineseAliases = [...manualAliases["zh-CN"]];
  const generatedPinyin = pinyinAliases(names["zh-CN"]);
  chineseAliases.push(
    ...(generatedPinyin.length > 0 ? generatedPinyin : latinAliasForms(names["zh-CN"])),
  );
  for (const alias of manualAliases["zh-CN"]) chineseAliases.push(...pinyinAliases(alias));
  chineseAliases.push(...(overrides.pinyinOverridesByOfficialId[officialId] ?? []));

  const englishAliases = [
    ...manualAliases.en,
    ...latinAliasForms(names.en),
    ...manualAliases.en.flatMap((alias) => latinAliasForms(alias)),
  ];

  const reading = japaneseSource ? officialJapaneseReading(japaneseSource) : names.ja;
  const japaneseAliases = [...manualAliases.ja, ...romajiAliases(reading)];
  for (const alias of manualAliases.ja) japaneseAliases.push(...romajiAliases(alias));
  if (romajiAliases(reading).length === 0) {
    // 官方日文只有汉字且未提供 ruby 时，使用官方英文名作可输入降级。
    japaneseAliases.push(...latinAliasForms(names.en));
  }
  japaneseAliases.push(...(overrides.romajiOverridesByOfficialId[officialId] ?? []));

  return {
    "zh-CN": uniqueAliases(chineseAliases, names["zh-CN"]),
    en: uniqueAliases(englishAliases, names.en),
    ja: uniqueAliases(japaneseAliases, names.ja),
  };
}

function normalizedEnglishName(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/\p{Mark}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

function slugifyEnglishName(value: string): string {
  const slug = value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/\p{Mark}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    throw new Error(`无法从名称生成 ID：${value}`);
  }
  return slug;
}

function parseCharacterExt(item: HoyoContentItem, locale: string): HoyoCharacterExt {
  let parsed: unknown;
  try {
    parsed = JSON.parse(item.sExt);
  } catch (error) {
    throw new Error(`${locale} 角色 ${item.iInfoId} 的 sExt 不是 JSON`, { cause: error });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`${locale} 角色 ${item.iInfoId} 的 sExt 不是对象。`);
  }
  const ext = parsed as Partial<HoyoCharacterExt>;
  if (typeof ext["cha-id"] !== "string" || !/^\d+$/.test(ext["cha-id"])) {
    throw new Error(`${locale} 角色 ${item.iInfoId} 缺少合法 cha-id。`);
  }
  return ext as HoyoCharacterExt;
}

function validateHoyoPayload(value: unknown, label: string): HoyoContentPayload {
  if (!value || typeof value !== "object") {
    throw new Error(`${label} 不是 JSON 对象。`);
  }
  const payload = value as Partial<HoyoContentPayload>;
  if (payload.retcode !== 0 || !payload.data || !Array.isArray(payload.data.list)) {
    throw new Error(`${label} 响应异常：retcode=${String(payload.retcode)}`);
  }
  return payload as HoyoContentPayload;
}

function validateStarCharacters(value: unknown, label: string): Record<string, StarRailCharacter> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} 不是角色索引对象。`);
  }
  const records = value as Record<string, Partial<StarRailCharacter>>;
  for (const [id, record] of Object.entries(records)) {
    if (
      record.id !== id ||
      typeof record.name !== "string" ||
      typeof record.element !== "string" ||
      typeof record.path !== "string" ||
      (record.rarity !== 4 && record.rarity !== 5) ||
      typeof record.icon !== "string"
    ) {
      throw new Error(`${label} 的角色 ${id} 结构异常。`);
    }
  }
  return records as Record<string, StarRailCharacter>;
}

function validateGitHubCommit(value: unknown): GitHubCommitResponse {
  if (!value || typeof value !== "object") {
    throw new Error("StarRailRes commit 响应不是对象。");
  }
  const commit = value as Partial<GitHubCommitResponse>;
  if (
    typeof commit.sha !== "string" ||
    !/^[a-f0-9]{40}$/.test(commit.sha) ||
    typeof commit.commit?.committer?.date !== "string" ||
    typeof commit.html_url !== "string"
  ) {
    throw new Error("StarRailRes commit 响应结构异常。");
  }
  return commit as GitHubCommitResponse;
}

async function fetchWithRetry(url: string, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          accept: "application/json, image/*;q=0.9, */*;q=0.1",
          referer: "https://hsr.hoyoverse.com/",
          "user-agent": "Fireflydle-data-sync/1.0 (unofficial non-commercial fan project)",
          ...init.headers,
        },
        signal: AbortSignal.timeout(45_000),
      });
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) {
      await Bun.sleep(300 * 3 ** attempt);
    }
  }
  throw new Error(`请求失败：${url}`, { cause: lastError });
}

async function readCachedJson<T>(
  cachePath: string,
  validator: (value: unknown) => T,
): Promise<CachedJson<T>> {
  const text = await readFile(cachePath, "utf8");
  const parsed = JSON.parse(text) as Partial<CachedJson<unknown>>;
  if (
    typeof parsed.sourceUrl !== "string" ||
    typeof parsed.fetchedAt !== "string" ||
    typeof parsed.bodySha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(parsed.bodySha256)
  ) {
    throw new Error(`缓存头异常：${cachePath}`);
  }
  const actualHash = sha256(compactJson(parsed.body));
  if (actualHash !== parsed.bodySha256) {
    throw new Error(`缓存校验失败：${cachePath}`);
  }
  return {
    body: validator(parsed.body),
    bodySha256: parsed.bodySha256,
    fetchedAt: parsed.fetchedAt,
    sourceUrl: parsed.sourceUrl,
  };
}

async function fetchJsonCached<T>(
  options: CliOptions,
  key: string,
  url: string,
  validator: (value: unknown) => T,
): Promise<CachedJson<T>> {
  const cachePath = join(options.cacheDir, "json", `${key}.json`);
  if (options.offline) {
    return readCachedJson(cachePath, validator);
  }

  try {
    const response = await fetchWithRetry(url);
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_SOURCE_BYTES) {
      throw new Error(`${key} 响应超过 ${MAX_SOURCE_BYTES} 字节限制。`);
    }
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > MAX_SOURCE_BYTES) {
      throw new Error(`${key} 响应超过 ${MAX_SOURCE_BYTES} 字节限制。`);
    }
    const body = validator(JSON.parse(text));
    const cached: CachedJson<T> = {
      body,
      bodySha256: sha256(compactJson(body)),
      fetchedAt: new Date().toISOString(),
      sourceUrl: url,
    };
    await writeAtomic(cachePath, jsonText(cached));
    return cached;
  } catch (networkError) {
    try {
      const cached = await readCachedJson(cachePath, validator);
      console.warn(`警告：${key} 网络请求失败，使用已验证缓存。`);
      return cached;
    } catch (cacheError) {
      throw new AggregateError(
        [networkError, cacheError],
        `${key} 既无可用网络响应，也无有效缓存。`,
      );
    }
  }
}

async function loadSources(options: CliOptions): Promise<SourceBundle> {
  const characterEntries = await Promise.all(
    Object.entries(HOYO_LOCALES).map(async ([locale, sourceLocale]) => {
      const url = hoyoListUrl(HOYO_CHARACTER_CHANNEL, sourceLocale);
      const payload = await fetchJsonCached(
        options,
        `hoyo-characters-${sourceLocale}`,
        url,
        (value) => validateHoyoPayload(value, `HoYoverse characters ${sourceLocale}`),
      );
      return [locale, payload] as const;
    }),
  );
  const factionEntries = await Promise.all(
    Object.entries(HOYO_LOCALES).map(async ([locale, sourceLocale]) => {
      const url = hoyoListUrl(HOYO_FACTION_CHANNEL, sourceLocale);
      const payload = await fetchJsonCached(
        options,
        `hoyo-factions-${sourceLocale}`,
        url,
        (value) => validateHoyoPayload(value, `HoYoverse factions ${sourceLocale}`),
      );
      return [locale, payload] as const;
    }),
  );
  const noticePayload = await fetchJsonCached(
    options,
    "hoyo-version-notices-en-us",
    hoyoListUrl(HOYO_NOTICE_CHANNEL, "en-us"),
    (value) => validateHoyoPayload(value, "HoYoverse version notices en-us"),
  );
  const starCommit = await fetchJsonCached(
    options,
    "starrailres-commit",
    `https://api.github.com/repos/${STARRAIL_RES_REPOSITORY}/commits/${STARRAIL_RES_BRANCH}`,
    validateGitHubCommit,
  );
  const starCharacterEntries = await Promise.all(
    Object.entries({ "zh-CN": "cn", en: "en", ja: "jp" } as const).map(
      async ([locale, sourceLocale]) => {
        const url = `https://raw.githubusercontent.com/${STARRAIL_RES_REPOSITORY}/${starCommit.body.sha}/index_min/${sourceLocale}/characters.json`;
        const payload = await fetchJsonCached(
          options,
          `starrailres-${starCommit.body.sha.slice(0, 12)}-${sourceLocale}-characters`,
          url,
          (value) => validateStarCharacters(value, `StarRailRes ${sourceLocale}`),
        );
        return [locale, payload] as const;
      },
    ),
  );

  return {
    characterPayloads: Object.fromEntries(characterEntries) as SourceBundle["characterPayloads"],
    factionPayloads: Object.fromEntries(factionEntries) as SourceBundle["factionPayloads"],
    noticePayload,
    starCharacters: Object.fromEntries(starCharacterEntries) as SourceBundle["starCharacters"],
    starCommit,
  };
}

function hoyoListUrl(channel: number, locale: string): string {
  const query = new URLSearchParams({
    iChanId: String(channel),
    iPage: "1",
    iPageSize: "500",
    sLangKey: locale,
  });
  return `${HOYO_API_BASE}?${query.toString()}`;
}

function releasedOfficialCharacters(
  payload: HoyoContentPayload,
  locale: string,
  asOf: Date,
): Map<string, OfficialLocalizedRecord> {
  const result = new Map<string, OfficialLocalizedRecord>();
  for (const item of payload.data.list) {
    const ext = parseCharacterExt(item, locale);
    const start = parseUtcTimestamp(item.dtStartTime, `${locale} ${item.iInfoId} dtStartTime`);
    const end = parseUtcTimestamp(item.dtEndTime, `${locale} ${item.iInfoId} dtEndTime`);
    if (start > asOf || end <= asOf) {
      continue;
    }
    const webCharacterId = ext["cha-id"];
    if (result.has(webCharacterId)) {
      throw new Error(`${locale} 存在重复 cha-id：${webCharacterId}`);
    }
    const sourceName = ext.name?.trim() || item.sTitle;
    const name = plainOfficialText(sourceName);
    if (!name) {
      throw new Error(`${locale} 角色 ${webCharacterId} 缺少名称。`);
    }
    result.set(webCharacterId, {
      category: item.sCategoryName.trim(),
      contentId: item.iInfoId,
      createdAt: item.dtCreateTime,
      endAt: item.dtEndTime,
      ext,
      name,
      sourceName,
      startAt: item.dtStartTime,
      webCharacterId,
    });
  }
  return result;
}

function alignOfficialLocales(
  sources: SourceBundle,
  options: CliOptions,
): Map<string, Record<keyof typeof HOYO_LOCALES, OfficialLocalizedRecord>> {
  const localized = Object.fromEntries(
    Object.entries(sources.characterPayloads).map(([locale, payload]) => [
      locale,
      releasedOfficialCharacters(payload.body, locale, options.asOf),
    ]),
  ) as Record<keyof typeof HOYO_LOCALES, Map<string, OfficialLocalizedRecord>>;

  const referenceIds = [...localized["zh-CN"].keys()].sort(
    (left, right) => Number(left) - Number(right),
  );
  if (referenceIds.length < overrides.minimumOfficialRosterSize) {
    throw new Error(
      `HoYoverse 已发布角色只有 ${referenceIds.length} 个，低于安全阈值 ${overrides.minimumOfficialRosterSize}，拒绝覆盖。`,
    );
  }
  for (const locale of ["en", "ja"] as const) {
    const localeIds = [...localized[locale].keys()].sort(
      (left, right) => Number(left) - Number(right),
    );
    if (compactJson(localeIds) !== compactJson(referenceIds)) {
      throw new Error(`HoYoverse ${locale} 与 zh-CN 的已发布 cha-id 不一致，拒绝覆盖。`);
    }
  }

  return new Map(
    referenceIds.map((id) => [
      id,
      {
        "zh-CN": requireMapValue(localized["zh-CN"], id, `zh-CN cha-id ${id}`),
        en: requireMapValue(localized.en, id, `en cha-id ${id}`),
        ja: requireMapValue(localized.ja, id, `ja cha-id ${id}`),
      },
    ]),
  );
}

function requireMapValue<K, V>(map: Map<K, V>, key: K, label: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`缺少 ${label}。`);
  }
  return value;
}

function officialIdForRecord(
  webCharacterId: string,
  localized: Record<keyof typeof HOYO_LOCALES, OfficialLocalizedRecord>,
  starEnglish: Record<string, StarRailCharacter>,
): string {
  const explicit = overrides.ambiguousOfficialContentIds[webCharacterId];
  if (explicit) {
    if (!starEnglish[explicit]) {
      throw new Error(`cha-id ${webCharacterId} 覆盖指向不存在的游戏 ID ${explicit}。`);
    }
    return explicit;
  }
  const target = normalizedEnglishName(localized.en.name);
  const matches = Object.values(starEnglish).filter(
    (record) => normalizedEnglishName(record.name) === target,
  );
  if (matches.length !== 1) {
    throw new Error(
      `cha-id ${webCharacterId} (${localized.en.name}) 匹配到 ${matches.length} 个 StarRailRes 角色；请在 ambiguousOfficialContentIds 审核后覆盖。`,
    );
  }
  const match = matches[0];
  if (!match) {
    throw new Error(`cha-id ${webCharacterId} 匹配结果异常。`);
  }
  return match.id;
}

function parseVersionNotices(payload: HoyoContentPayload, asOf: Date): VersionNotice[] {
  const candidates = new Map<string, Array<{ item: HoyoContentItem; score: number }>>();
  for (const item of payload.data.list) {
    const startedAt = parseUtcTimestamp(item.dtStartTime, `notice ${item.iInfoId} dtStartTime`);
    if (startedAt > asOf) {
      continue;
    }
    const versionMatch = item.sTitle.match(/Version\s+(\d+\.\d+)/i);
    if (!versionMatch?.[1]) {
      continue;
    }
    if (/pre-download|maintenance|trailer|strategy|special program|discord/i.test(item.sTitle)) {
      continue;
    }
    let score = 0;
    if (/update details|update overview|version update|updates\b/i.test(item.sTitle)) score += 100;
    if (/\bupdate\b/i.test(item.sTitle)) score += 50;
    if (/is now live/i.test(item.sTitle)) score += 50;
    if (score === 0) {
      continue;
    }
    const list = candidates.get(versionMatch[1]) ?? [];
    list.push({ item, score });
    candidates.set(versionMatch[1], list);
  }

  const notices = [...candidates.entries()].map(([version, entries]) => {
    entries.sort(
      (left, right) => right.score - left.score || left.item.iInfoId - right.item.iInfoId,
    );
    const selected = entries[0]?.item;
    if (!selected) {
      throw new Error(`版本 ${version} 没有可用官方公告。`);
    }
    return {
      infoId: selected.iInfoId,
      releasedAt: isoTimestamp(selected.dtStartTime, `version ${version}`),
      sourceTitle: selected.sTitle,
      version,
    };
  });
  notices.sort((left, right) => Date.parse(left.releasedAt) - Date.parse(right.releasedAt));
  if (notices.length < overrides.minimumVersionNoticeCount) {
    throw new Error(
      `官方版本公告只解析出 ${notices.length} 个，低于安全阈值 ${overrides.minimumVersionNoticeCount}。`,
    );
  }
  return notices;
}

function versionsFromNotices(notices: VersionNotice[]): Version[] {
  return notices.map((notice, order) =>
    VersionSchema.parse({
      id: notice.version,
      order,
      releasedAt: notice.releasedAt,
    }),
  );
}

function releaseVersionForRecord(
  officialId: string,
  startAt: string,
  notices: VersionNotice[],
): string {
  const explicit = overrides.releaseVersionOverrides[officialId];
  if (explicit) {
    if (!notices.some((notice) => notice.version === explicit)) {
      throw new Error(`${officialId} 的版本覆盖 ${explicit} 没有官方版本公告。`);
    }
    return explicit;
  }
  const firstNotice = notices[0];
  if (!firstNotice) {
    throw new Error("版本公告列表为空。");
  }
  const releaseDate = sourceDate(startAt);
  if (releaseDate < sourceDate(firstNotice.releasedAt)) {
    return firstNotice.version;
  }
  const matching = notices.find((notice) => sourceDate(notice.releasedAt) === releaseDate);
  if (!matching) {
    throw new Error(`${officialId} 的官网上线日 ${releaseDate} 未匹配官方大版本公告；不进行猜测。`);
  }
  return matching.version;
}

function officialFactions(sources: SourceBundle): Faction[] {
  const categoryNames = new Map<string, Partial<LocalizedText>>();
  for (const locale of Object.keys(HOYO_LOCALES) as Array<keyof typeof HOYO_LOCALES>) {
    for (const item of sources.factionPayloads[locale].body.data.list) {
      const category = item.sCategoryName.trim();
      const factionId = overrides.factionIdsByCategory[category];
      if (!factionId) {
        continue;
      }
      const names = categoryNames.get(category) ?? {};
      names[locale] = plainOfficialText(item.sTitle).trim();
      categoryNames.set(category, names);
    }
  }

  const officialGroups = Object.entries(overrides.factionIdsByCategory)
    .map(([category, id]) => {
      const names = categoryNames.get(category);
      if (!names?.["zh-CN"] || !names.en || !names.ja) {
        throw new Error(`官方阵营 ${category} 缺少三语名称。`);
      }
      return FactionSchema.parse({
        enabled: true,
        groupId: id,
        id,
        names,
      });
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const groupIds = new Set(officialGroups.map((faction) => faction.id));
  const subfactions = overrides.subfactionDefinitions.map((definition) => {
    if (!groupIds.has(definition.groupId)) {
      throw new Error(`子势力 ${definition.id} 指向未知官网大组 ${definition.groupId}。`);
    }
    if (definition.sourceOfficialIds.length === 0) {
      throw new Error(`子势力 ${definition.id} 缺少审计来源角色 ID。`);
    }
    return FactionSchema.parse({
      enabled: true,
      groupId: definition.groupId,
      id: definition.id,
      names: definition.names,
    });
  });
  const allFactions = [...officialGroups, ...subfactions].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  if (new Set(allFactions.map((faction) => faction.id)).size !== allFactions.length) {
    throw new Error("官网大组与子势力 ID 存在重复。");
  }
  return allFactions;
}

function gamePath(value: string): Path {
  const mapping: Record<string, Path> = {
    Elation: "elation",
    Knight: "preservation",
    Mage: "erudition",
    Memory: "remembrance",
    Priest: "abundance",
    Rogue: "hunt",
    Shaman: "harmony",
    Warlock: "nihility",
    Warrior: "destruction",
  };
  const path = mapping[value];
  if (!path) {
    throw new Error(`未知 StarRailRes 命途枚举：${value}`);
  }
  return path;
}

function gameElement(value: string): Element {
  const mapping: Record<string, Element> = {
    Fire: "fire",
    Ice: "ice",
    Imaginary: "imaginary",
    Physical: "physical",
    Quantum: "quantum",
    Thunder: "lightning",
    Wind: "wind",
  };
  const element = mapping[value];
  if (!element) {
    throw new Error(`未知 StarRailRes 属性枚举：${value}`);
  }
  return element;
}

function officialAvatarUrl(record: OfficialLocalizedRecord): string {
  const url = record.ext.avatarActivePC?.[0]?.url ?? record.ext.avatarPC?.[0]?.url;
  if (!url) {
    throw new Error(`HoYoverse cha-id ${record.webCharacterId} 缺少头像 URL。`);
  }
  validateSourceUrl(url, ["fastcdn.hoyoverse.com", "webstatic.hoyoverse.com"]);
  return url;
}

function validateSourceUrl(value: string, allowedHosts: string[]): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) {
    throw new Error(`来源 URL 不在允许列表：${value}`);
  }
  return url;
}

function buildDrafts(
  aligned: Map<string, Record<keyof typeof HOYO_LOCALES, OfficialLocalizedRecord>>,
  sources: SourceBundle,
  notices: VersionNotice[],
  versions: Version[],
  sourceRevision: string,
): {
  drafts: CharacterDraft[];
  mergedOfficialIds: Record<string, string[]>;
  officialContentIds: Record<string, number>;
} {
  const starByLocale = Object.fromEntries(
    Object.entries(sources.starCharacters).map(([locale, payload]) => [locale, payload.body]),
  ) as Record<keyof typeof HOYO_LOCALES, Record<string, StarRailCharacter>>;
  const versionOrder = new Map(versions.map((version) => [version.id, version.order]));
  const drafts: CharacterDraft[] = [];
  const mergedOfficialIds: Record<string, string[]> = {};
  const officialContentIds: Record<string, number> = {};
  const usedOfficialIds = new Set<string>();
  const usedCanonicalIds = new Set<string>();

  for (const [webCharacterId, localized] of aligned) {
    const officialId = officialIdForRecord(webCharacterId, localized, starByLocale.en);
    if (usedOfficialIds.has(officialId)) {
      throw new Error(`游戏角色 ID ${officialId} 被多个官网条目匹配。`);
    }
    usedOfficialIds.add(officialId);
    officialContentIds[officialId] = localized.en.contentId;
    const star = starByLocale.en[officialId];
    if (!star) {
      throw new Error(`StarRailRes en 缺少 ${officialId}。`);
    }
    for (const locale of ["zh-CN", "ja"] as const) {
      if (!starByLocale[locale][officialId]) {
        throw new Error(`StarRailRes ${locale} 缺少 ${officialId}。`);
      }
    }

    const names = overrides.displayNameOverrides[officialId] ?? {
      "zh-CN": localized["zh-CN"].name,
      en: localized.en.name,
      ja: localized.ja.name,
    };
    const id = overrides.canonicalIdOverrides[officialId] ?? slugifyEnglishName(star.name);
    if (usedCanonicalIds.has(id)) {
      throw new Error(`角色稳定 ID 重复：${id}`);
    }
    usedCanonicalIds.add(id);
    const releaseVersionId = releaseVersionForRecord(officialId, localized.en.startAt, notices);
    const releaseOrder = versionOrder.get(releaseVersionId);
    if (releaseOrder === undefined) {
      throw new Error(`${officialId} 缺少版本顺序：${releaseVersionId}`);
    }
    const officialFactionGroupId = overrides.factionIdsByCategory[localized.en.category];
    if (!officialFactionGroupId) {
      throw new Error(`${officialId} 的官方分类 ${localized.en.category} 未审核映射。`);
    }
    const factionGroupId = overrides.factionGroupByOfficialId[officialId] ?? officialFactionGroupId;
    if (!Object.values(overrides.factionIdsByCategory).includes(factionGroupId)) {
      throw new Error(`${officialId} 的势力大组覆盖 ${factionGroupId} 不存在。`);
    }
    const factionId = overrides.subfactionByOfficialId[officialId] ?? factionGroupId;
    const subfaction = overrides.subfactionDefinitions.find(
      (definition) => definition.id === factionId,
    );
    if (factionId !== factionGroupId && subfaction?.groupId !== factionGroupId) {
      throw new Error(`${officialId} 的子势力 ${factionId} 不属于官网大组 ${factionGroupId}。`);
    }
    const latestCreatedAt = [localized["zh-CN"], localized.en, localized.ja]
      .map((entry) => isoTimestamp(entry.createdAt, `${officialId} createdAt`))
      .sort()
      .at(-1);
    if (!latestCreatedAt) {
      throw new Error(`${officialId} 缺少来源时间。`);
    }
    const baseCharacterId = overrides.baseCharacterIdOverrides[officialId] ?? id;
    drafts.push({
      aliases: generatedAliases(
        officialId,
        names,
        localized.ja.sourceName,
        overrides.aliasesByOfficialId[officialId],
      ),
      assetSourceKind: "hoyoverse-content-api",
      assetSourceUrl: officialAvatarUrl(localized["zh-CN"]),
      baseCharacterId,
      element: gameElement(star.element),
      enabled: true,
      factionGroupId,
      factionId,
      id,
      names,
      officialId,
      path: gamePath(star.path),
      rarity: star.rarity as 4 | 5,
      releaseOrder,
      releaseVersionId,
      sourceRevision,
      sourceUpdatedAt: latestCreatedAt,
      targetEligible: true,
    });
  }

  for (const officialId of Object.keys(overrides.factionGroupByOfficialId)) {
    if (!usedOfficialIds.has(officialId)) {
      throw new Error(`势力大组覆盖引用未收录角色 ${officialId}。`);
    }
  }

  for (const form of overrides.trailblazerForms) {
    if (usedCanonicalIds.has(form.id)) {
      throw new Error(`开拓者稳定 ID 重复：${form.id}`);
    }
    usedCanonicalIds.add(form.id);
    const representative = starByLocale.en[form.officialId];
    const counterpart = starByLocale.en[form.mergedOfficialIds[1]];
    if (!representative || !counterpart) {
      throw new Error(`StarRailRes 缺少开拓者形态 ${form.mergedOfficialIds.join("/")}。`);
    }
    if (
      representative.element !== counterpart.element ||
      representative.path !== counterpart.path ||
      representative.rarity !== counterpart.rarity
    ) {
      throw new Error(`开拓者 ${form.id} 男女形态枚举不一致，拒绝合并。`);
    }
    const releaseOrder = versionOrder.get(form.releaseVersionId);
    if (releaseOrder === undefined) {
      throw new Error(`开拓者 ${form.id} 缺少版本 ${form.releaseVersionId}。`);
    }
    const assetSourceUrl = `https://raw.githubusercontent.com/${STARRAIL_RES_REPOSITORY}/${sources.starCommit.body.sha}/${representative.icon}`;
    validateSourceUrl(assetSourceUrl, ["raw.githubusercontent.com"]);
    mergedOfficialIds[form.id] = [...form.mergedOfficialIds];
    drafts.push({
      aliases: generatedAliases(form.officialId, form.names, undefined, form.aliases),
      assetSourceKind: "starrailres-trailblazer-fallback",
      assetSourceUrl,
      baseCharacterId: "trailblazer",
      element: gameElement(representative.element),
      enabled: true,
      factionGroupId: "astral-express",
      factionId: "astral-express",
      id: form.id,
      names: form.names,
      officialId: form.officialId,
      path: gamePath(representative.path),
      rarity: representative.rarity as 4 | 5,
      releaseOrder,
      releaseVersionId: form.releaseVersionId,
      sourceRevision,
      sourceUpdatedAt: new Date(sources.starCommit.body.commit.committer.date).toISOString(),
      targetEligible: true,
    });
  }

  drafts.sort(
    (left, right) => left.releaseOrder - right.releaseOrder || left.id.localeCompare(right.id),
  );
  return { drafts, mergedOfficialIds, officialContentIds };
}

async function mapLimit<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      const value = values[index];
      if (value === undefined) throw new Error(`mapLimit 缺少索引 ${index}。`);
      results[index] = await mapper(value, index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

function imageExtension(
  contentType: string | null,
  sourceUrl: string,
): { extension: string; mimeType: string } {
  const normalized = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  const mapping: Record<string, string> = {
    "image/avif": ".avif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  if (normalized && mapping[normalized]) {
    return { extension: mapping[normalized], mimeType: normalized };
  }
  const sourceExtension = extname(new URL(sourceUrl).pathname).toLowerCase();
  const reverse: Record<string, string> = {
    ".avif": "image/avif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const mimeType = reverse[sourceExtension];
  if (!mimeType) {
    throw new Error(`不支持的图片类型：${contentType ?? sourceUrl}`);
  }
  return { extension: sourceExtension === ".jpeg" ? ".jpg" : sourceExtension, mimeType };
}

function assertImageMagic(bytes: Uint8Array, mimeType: string, sourceUrl: string): void {
  const starts = (...prefix: number[]): boolean =>
    prefix.every((byte, index) => bytes[index] === byte);
  const valid =
    (mimeType === "image/png" && starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) ||
    (mimeType === "image/jpeg" && starts(0xff, 0xd8, 0xff)) ||
    (mimeType === "image/webp" &&
      starts(0x52, 0x49, 0x46, 0x46) &&
      startsAt(bytes, 8, 0x57, 0x45, 0x42, 0x50)) ||
    (mimeType === "image/avif" && startsAt(bytes, 4, 0x66, 0x74, 0x79, 0x70));
  if (!valid) {
    throw new Error(`图片魔数与 Content-Type 不匹配：${sourceUrl}`);
  }
}

function startsAt(bytes: Uint8Array, offset: number, ...prefix: number[]): boolean {
  return prefix.every((byte, index) => bytes[offset + index] === byte);
}

async function readCachedAsset(
  path: string,
  sourceUrl: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const metadataPath = `${path}.json`;
  const [bytes, metadataText] = await Promise.all([readFile(path), readFile(metadataPath, "utf8")]);
  const metadata = JSON.parse(metadataText) as Partial<{
    mimeType: string;
    sha256: string;
    sourceUrl: string;
  }>;
  if (
    metadata.sourceUrl !== sourceUrl ||
    typeof metadata.mimeType !== "string" ||
    typeof metadata.sha256 !== "string" ||
    sha256(bytes) !== metadata.sha256
  ) {
    throw new Error(`素材缓存校验失败：${path}`);
  }
  assertImageMagic(bytes, metadata.mimeType, sourceUrl);
  return { bytes, mimeType: metadata.mimeType };
}

async function downloadAsset(options: CliOptions, draft: CharacterDraft): Promise<AssetResult> {
  const cacheKey = sha256(draft.assetSourceUrl);
  const cachePath = join(options.cacheDir, "assets", `${cacheKey}.bin`);
  let downloaded: { bytes: Uint8Array; mimeType: string } | undefined;
  if (!options.refreshCache) {
    try {
      downloaded = await readCachedAsset(cachePath, draft.assetSourceUrl);
    } catch {
      // 缓存不存在或已损坏时回退到网络。
    }
  }
  if (!downloaded) {
    if (options.offline) {
      throw new Error(`离线模式缺少素材缓存：${draft.id}`);
    }
    const response = await fetchWithRetry(draft.assetSourceUrl);
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > MAX_ASSET_BYTES) {
      throw new Error(`${draft.id} 素材超过 ${MAX_ASSET_BYTES} 字节限制。`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_ASSET_BYTES) {
      throw new Error(`${draft.id} 素材大小异常：${bytes.byteLength}`);
    }
    const { mimeType } = imageExtension(response.headers.get("content-type"), draft.assetSourceUrl);
    assertImageMagic(bytes, mimeType, draft.assetSourceUrl);
    downloaded = { bytes, mimeType };
    await writeAtomicBytes(cachePath, bytes);
    await writeAtomic(
      `${cachePath}.json`,
      jsonText({
        mimeType,
        sha256: sha256(bytes),
        sourceUrl: draft.assetSourceUrl,
      }),
    );
  }

  const digest = sha256(downloaded.bytes);
  const { extension } = imageExtension(downloaded.mimeType, draft.assetSourceUrl);
  const responsiveVariants = await generateResponsiveVariants(downloaded.bytes);
  return {
    bytes: downloaded.bytes,
    characterId: draft.id,
    extension,
    localFileName: `${draft.id}-avatar-${digest.slice(0, 12)}${extension}`,
    mimeType: downloaded.mimeType,
    sha256: digest,
    sourceKind: draft.assetSourceKind,
    sourceUrl: draft.assetSourceUrl,
    responsiveVariants,
  };
}

async function validateAssetHead(draft: CharacterDraft): Promise<number | null> {
  const response = await fetchWithRetry(draft.assetSourceUrl, { method: "HEAD" });
  const { mimeType } = imageExtension(response.headers.get("content-type"), draft.assetSourceUrl);
  if (!mimeType.startsWith("image/")) {
    throw new Error(`${draft.id} HEAD 响应不是图片。`);
  }
  const lengthHeader = response.headers.get("content-length");
  if (!lengthHeader) return null;
  const length = Number(lengthHeader);
  if (!Number.isFinite(length) || length <= 0 || length > MAX_ASSET_BYTES) {
    throw new Error(`${draft.id} HEAD 素材大小异常：${lengthHeader}`);
  }
  return length;
}

function charactersWithAssets(
  drafts: CharacterDraft[],
  assets: AssetResult[] | undefined,
): Character[] {
  const assetsByCharacter = new Map(assets?.map((asset) => [asset.characterId, asset]));
  return drafts.map((draft) => {
    const {
      assetSourceKind: _assetSourceKind,
      assetSourceUrl,
      sourceUpdatedAt,
      ...character
    } = draft;
    const asset = assetsByCharacter.get(draft.id);
    const localPath = asset
      ? `/assets/characters/${asset.localFileName}`
      : `/assets/characters/${draft.id}-avatar-planned.png`;
    const responsive = asset?.responsiveVariants.map((variant) => ({
      width: variant.width,
      avifPath: `/assets/characters/${draft.id}-avatar-${asset.sha256.slice(0, 12)}-${variant.width}.avif`,
      webpPath: `/assets/characters/${draft.id}-avatar-${asset.sha256.slice(0, 12)}-${variant.width}.webp`,
      avifBytes: variant.avifBytes,
      webpBytes: variant.webpBytes,
      avifSha256: variant.avifSha256,
      webpSha256: variant.webpSha256,
    }));
    return CharacterSchema.parse({
      ...character,
      assets: {
        avatarPath: localPath,
        portraitPath: localPath,
        rightsNotice: RIGHTS_NOTICE,
        sha256: asset?.sha256 ?? PLANNED_HASH,
        sourceUpdatedAt,
        sourceUrl: assetSourceUrl,
        ...(responsive ? { responsive } : {}),
      },
    });
  });
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlInteger(value: number | boolean): string {
  return String(typeof value === "boolean" ? Number(value) : value);
}

function generateSql(
  characters: Character[],
  factions: Faction[],
  versions: Version[],
  updatedAtEpochSeconds: number,
): string {
  const versionColumns = ["id", "sort_order", "released_at", "enabled", "created_at", "updated_at"];
  const versionUpdateColumns = versionColumns.filter(
    (column) => !["id", "created_at"].includes(column),
  );
  const versionStatements = versions.map((version) => {
    const values = [
      sqlLiteral(version.id),
      sqlInteger(version.order),
      sqlLiteral(version.releasedAt),
      sqlInteger(true),
      sqlInteger(updatedAtEpochSeconds),
      sqlInteger(updatedAtEpochSeconds),
    ];
    return `INSERT INTO versions (${versionColumns.join(", ")})\nVALUES (${values.join(", ")})\nON CONFLICT(id) DO UPDATE SET\n  ${versionUpdateColumns.map((column) => `${column} = excluded.${column}`).join(",\n  ")};`;
  });
  const activeVersionIds = versions.map((version) => sqlLiteral(version.id)).join(", ");
  const versionSoftDisable = `UPDATE versions\nSET enabled = 0, updated_at = ${updatedAtEpochSeconds}\nWHERE id NOT IN (${activeVersionIds})\n  AND enabled <> 0;`;

  const factionColumns = ["id", "group_id", "names_json", "enabled", "created_at", "updated_at"];
  const factionUpdateColumns = factionColumns.filter(
    (column) => !["id", "created_at"].includes(column),
  );
  const factionStatements = factions.map((faction) => {
    const values = [
      sqlLiteral(faction.id),
      sqlLiteral(faction.groupId),
      sqlLiteral(compactJson(faction.names)),
      sqlInteger(faction.enabled),
      sqlInteger(updatedAtEpochSeconds),
      sqlInteger(updatedAtEpochSeconds),
    ];
    return `INSERT INTO factions (${factionColumns.join(", ")})\nVALUES (${values.join(", ")})\nON CONFLICT(id) DO UPDATE SET\n  ${factionUpdateColumns.map((column) => `${column} = excluded.${column}`).join(",\n  ")};`;
  });
  const activeFactionIds = factions.map((faction) => sqlLiteral(faction.id)).join(", ");
  const factionSoftDisable = `UPDATE factions\nSET enabled = 0, updated_at = ${updatedAtEpochSeconds}\nWHERE id NOT IN (${activeFactionIds})\n  AND enabled <> 0;`;

  const characterColumns = [
    "id",
    "official_id",
    "base_character_id",
    "element",
    "path",
    "rarity",
    "faction_id",
    "faction_group_id",
    "release_version_id",
    "release_order",
    "enabled",
    "target_eligible",
    "source_revision",
    "payload_json",
    "created_at",
    "updated_at",
  ];
  const characterUpdateColumns = characterColumns.filter(
    (column) => !["id", "created_at"].includes(column),
  );
  const characterStatements = characters.map((character) => {
    const values = [
      sqlLiteral(character.id),
      sqlLiteral(character.officialId),
      sqlLiteral(character.baseCharacterId),
      sqlLiteral(character.element),
      sqlLiteral(character.path),
      sqlInteger(character.rarity),
      sqlLiteral(character.factionId),
      sqlLiteral(character.factionGroupId),
      sqlLiteral(character.releaseVersionId),
      sqlInteger(character.releaseOrder),
      sqlInteger(character.enabled),
      sqlInteger(character.targetEligible),
      sqlLiteral(character.sourceRevision),
      sqlLiteral(compactJson(character)),
      sqlInteger(updatedAtEpochSeconds),
      sqlInteger(updatedAtEpochSeconds),
    ];
    return `INSERT INTO characters (${characterColumns.join(", ")})\nVALUES (${values.join(", ")})\nON CONFLICT(id) DO UPDATE SET\n  ${characterUpdateColumns.map((column) => `${column} = excluded.${column}`).join(",\n  ")};`;
  });
  const activeCharacterIds = characters.map((character) => sqlLiteral(character.id)).join(", ");
  const characterSoftDisable = `UPDATE characters\nSET enabled = 0, target_eligible = 0, updated_at = ${updatedAtEpochSeconds}\nWHERE id NOT IN (${activeCharacterIds})\n  AND (enabled <> 0 OR target_eligible <> 0);`;
  return `-- 由 scripts/sync-characters.ts 确定性生成；不要手工修改。\n-- Cloudflare D1 的 --file import 不允许显式 BEGIN/COMMIT；每个 UPSERT 保持为独立小语句。\n-- 先发布版本与阵营，再发布引用它们的角色；各表清单外历史行只软禁用、不删除。\n\n${versionStatements.join("\n\n")}\n\n${versionSoftDisable}\n\n${factionStatements.join("\n\n")}\n\n${factionSoftDisable}\n\n${characterStatements.join("\n\n")}\n\n${characterSoftDisable}\n`;
}

async function writeAtomic(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${crypto.randomUUID()}.tmp`,
  );
  await writeFile(temporary, content, { encoding: "utf8" });
  await replaceFile(temporary, path);
}

async function writeAtomicBytes(path: string, content: Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${crypto.randomUUID()}.tmp`,
  );
  await writeFile(temporary, content);
  await replaceFile(temporary, path);
}

async function replaceFile(temporary: string, target: string): Promise<void> {
  const backup = `${target}.${process.pid}.backup`;
  let targetExisted = false;
  try {
    await stat(target);
    targetExisted = true;
    await rename(target, backup);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  try {
    await rename(temporary, target);
    if (targetExisted) await unlink(backup);
  } catch (error) {
    try {
      await unlink(temporary);
    } catch {
      // 已被 rename 或临时文件不存在时无需处理。
    }
    if (targetExisted) {
      try {
        await rename(backup, target);
      } catch {
        // 保留原始错误，backup 仍在同目录可人工恢复。
      }
    }
    throw error;
  }
}

async function writePublishedOutputs(
  characters: Character[],
  factions: Faction[],
  versions: Version[],
  assets: AssetResult[],
  metadata: Record<string, unknown>,
  sql: string,
): Promise<void> {
  await mkdir(CHARACTER_ASSET_DIR, { recursive: true });
  for (const asset of assets) {
    const path = join(CHARACTER_ASSET_DIR, asset.localFileName);
    try {
      const existing = await readFile(path);
      if (sha256(existing) !== asset.sha256) {
        throw new Error(`内容寻址素材已存在但哈希不匹配：${path}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await writeAtomicBytes(path, asset.bytes);
    }
    for (const variant of asset.responsiveVariants) {
      const prefix = `${asset.characterId}-avatar-${asset.sha256.slice(0, 12)}-${variant.width}`;
      for (const [format, bytes, digest] of [
        ["avif", variant.avif, variant.avifSha256],
        ["webp", variant.webp, variant.webpSha256],
      ] as const) {
        const variantPath = join(CHARACTER_ASSET_DIR, `${prefix}.${format}`);
        try {
          const existing = await readFile(variantPath);
          if (sha256(existing) !== digest) {
            throw new Error(`内容寻址响应式素材已存在但哈希不匹配：${variantPath}`);
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          await writeAtomicBytes(variantPath, bytes);
        }
      }
    }
  }

  const manifest = {
    schemaVersion: 1,
    asOf: metadata.asOf,
    sourceRevision: metadata.sourceRevision,
    rightsNotice: RIGHTS_NOTICE,
    policy:
      "Each audited local thumbnail has deterministic 40/80/160px AVIF and WebP derivatives; the source PNG remains the final fallback.",
    files: assets
      .flatMap((asset) => [
        {
          bytes: asset.bytes.byteLength,
          mimeType: asset.mimeType,
          path: `/assets/characters/${asset.localFileName}`,
          roles: ["avatar", "portrait", "fallback"],
          sha256: asset.sha256,
          sourceKind: asset.sourceKind,
          sourceUrl: asset.sourceUrl,
        },
        ...asset.responsiveVariants.flatMap((variant) => {
          const prefix = `${asset.characterId}-avatar-${asset.sha256.slice(0, 12)}-${variant.width}`;
          return [
            {
              bytes: variant.avifBytes,
              format: "avif",
              mimeType: "image/avif",
              path: `/assets/characters/${prefix}.avif`,
              roles: ["avatar", "responsive"],
              sha256: variant.avifSha256,
              sourceKind: asset.sourceKind,
              sourceUrl: asset.sourceUrl,
              width: variant.width,
            },
            {
              bytes: variant.webpBytes,
              format: "webp",
              mimeType: "image/webp",
              path: `/assets/characters/${prefix}.webp`,
              roles: ["avatar", "responsive"],
              sha256: variant.webpSha256,
              sourceKind: asset.sourceKind,
              sourceUrl: asset.sourceUrl,
              width: variant.width,
            },
          ];
        }),
      ])
      .sort((left, right) => left.path.localeCompare(right.path)),
  };
  const [factionsText, versionsText, metadataText, charactersText, manifestText] =
    await Promise.all([
      formattedJsonText(factions),
      formattedJsonText(versions),
      formattedJsonText(metadata),
      formattedJsonText(characters),
      formattedJsonText(manifest),
    ]);
  const manifestDigest = sha256(manifestText);

  // 先写内容寻址素材，再更新小型清单；抓取/验证失败时不会触碰上次有效数据。
  await writeAtomic(join(GENERATED_DATA_DIR, "factions.json"), factionsText);
  await writeAtomic(join(GENERATED_DATA_DIR, "versions.json"), versionsText);
  await writeAtomic(join(GENERATED_DATA_DIR, "sync-metadata.json"), metadataText);
  await writeAtomic(GENERATED_SQL_PATH, sql);
  await writeAtomic(join(PUBLIC_ASSET_DIR, "manifest.json"), manifestText);
  await writeAtomic(
    join(PUBLIC_ASSET_DIR, "manifest.sha256"),
    `${manifestDigest}  manifest.json\n`,
  );
  await writeAtomic(join(GENERATED_DATA_DIR, "characters.json"), charactersText);
}

function latestSourceEpochSeconds(
  aligned: Map<string, Record<keyof typeof HOYO_LOCALES, OfficialLocalizedRecord>>,
  sources: SourceBundle,
  notices: VersionNotice[],
): number {
  const values = [Date.parse(sources.starCommit.body.commit.committer.date)];
  for (const localized of aligned.values()) {
    for (const locale of Object.keys(HOYO_LOCALES) as Array<keyof typeof HOYO_LOCALES>) {
      values.push(
        parseUtcTimestamp(localized[locale].createdAt, `${locale} source createdAt`).getTime(),
      );
    }
  }
  for (const notice of notices) values.push(Date.parse(notice.releasedAt));
  const latest = Math.max(...values);
  if (!Number.isFinite(latest)) throw new Error("无法确定数据来源更新时间。");
  return Math.floor(latest / 1000);
}

async function main(): Promise<void> {
  if (overrides.schemaVersion !== 1) {
    throw new Error(`不支持的 sync-overrides schemaVersion：${overrides.schemaVersion}`);
  }
  for (const form of overrides.trailblazerForms) {
    if (
      form.mergedOfficialIds.length !== 2 ||
      !form.mergedOfficialIds.every((id) => /^\d+$/.test(id))
    ) {
      throw new Error(`开拓者 ${form.id} 必须包含一对合法男/女游戏 ID。`);
    }
  }
  const options = parseCliOptions(Bun.argv.slice(2));
  console.log(`同步截止日：${options.asOfLabel} UTC${options.dryRun ? "（dry-run）" : ""}`);
  const sources = await loadSources(options);
  const aligned = alignOfficialLocales(sources, options);
  const notices = parseVersionNotices(sources.noticePayload.body, options.asOf);
  const versions = versionsFromNotices(notices);
  const factions = officialFactions(sources);
  const officialSourceDigest = sha256(
    compactJson({
      characters: Object.fromEntries(
        Object.entries(sources.characterPayloads).map(([locale, source]) => [
          locale,
          source.bodySha256,
        ]),
      ),
      factions: Object.fromEntries(
        Object.entries(sources.factionPayloads).map(([locale, source]) => [
          locale,
          source.bodySha256,
        ]),
      ),
      notices: sources.noticePayload.bodySha256,
    }),
  );
  const overrideDigest = sha256(compactJson(overrides));
  const sourceRevision = `hoyo-content-v2-${officialSourceDigest.slice(0, 12)}+starrailres-${sources.starCommit.body.sha.slice(0, 12)}+overrides-${overrideDigest.slice(0, 12)}`;
  const { drafts, mergedOfficialIds, officialContentIds } = buildDrafts(
    aligned,
    sources,
    notices,
    versions,
    sourceRevision,
  );
  const usedFactions = new Set(drafts.map((draft) => draft.factionId));
  for (const factionId of usedFactions) {
    if (!factions.some((faction) => faction.id === factionId)) {
      throw new Error(`角色使用了未生成的阵营：${factionId}`);
    }
  }
  const subfactionAudit = overrides.subfactionDefinitions.map((definition) => ({
    id: definition.id,
    groupId: definition.groupId,
    names: definition.names,
    sourceEntries: definition.sourceOfficialIds.map((officialId) => {
      const contentId = officialContentIds[officialId];
      if (contentId === undefined) {
        throw new Error(`子势力 ${definition.id} 引用未收录角色 ${officialId}。`);
      }
      return { officialId, hoyoverseContentId: contentId };
    }),
  }));

  let assets: AssetResult[] | undefined;
  let plannedAssetBytes: number | null = null;
  if (options.dryRun) {
    const sizes = options.offline
      ? drafts.map(() => null)
      : await mapLimit(drafts, 12, async (draft) => validateAssetHead(draft));
    plannedAssetBytes = sizes.every((size) => size !== null)
      ? sizes.reduce<number>((sum, size) => sum + (size ?? 0), 0)
      : null;
  } else {
    assets = await mapLimit(drafts, 8, async (draft, index) => {
      const asset = await downloadAsset(options, draft);
      if ((index + 1) % 15 === 0 || index + 1 === drafts.length) {
        console.log(`素材已验证：${index + 1}/${drafts.length}`);
      }
      return asset;
    });
  }

  const characters = charactersWithAssets(drafts, assets);
  if (new Set(characters.map((character) => character.id)).size !== characters.length) {
    throw new Error("生成角色 ID 不唯一。");
  }
  const localizedCells = characters.length * Object.keys(HOYO_LOCALES).length;
  const populatedLocalizedCells = characters.reduce(
    (count, character) => count + Object.values(character.names).filter(Boolean).length,
    0,
  );
  if (localizedCells !== populatedLocalizedCells) {
    throw new Error(`三语名称覆盖不完整：${populatedLocalizedCells}/${localizedCells}`);
  }
  const asciiAlias = /^[a-z0-9]+(?: [a-z0-9]+)*$/;
  const pinyinCovered = characters.filter((character) =>
    character.aliases["zh-CN"].some((alias) => asciiAlias.test(alias)),
  ).length;
  const romajiCovered = characters.filter((character) =>
    character.aliases.ja.some((alias) => asciiAlias.test(alias)),
  ).length;
  if (pinyinCovered !== characters.length || romajiCovered !== characters.length) {
    throw new Error(
      `搜索别名覆盖不完整：拼音 ${pinyinCovered}/${characters.length}，罗马字 ${romajiCovered}/${characters.length}。`,
    );
  }
  const hasCloseFactionPair = characters.some((left, leftIndex) =>
    characters
      .slice(leftIndex + 1)
      .some(
        (right) =>
          left.factionId !== right.factionId && left.factionGroupId === right.factionGroupId,
      ),
  );
  if (!hasCloseFactionPair) {
    throw new Error("子势力层级未产生任何同组不同 factionId 角色对。");
  }
  const metadata = {
    schemaVersion: 1,
    asOf: options.asOfLabel,
    sourceRevision,
    sourceUpdatedAt: new Date(
      latestSourceEpochSeconds(aligned, sources, notices) * 1000,
    ).toISOString(),
    policy: {
      roster:
        "HoYoverse character channel entries active by asOf, plus five audited Trailblazer path forms; male/female IDs are merged per path.",
      exclusions:
        "No leak-only, future-dated, expired, or unmatched community-only character is admitted.",
      factions:
        "Official HoYoverse character-page tabs seed the parent groups; reviewed BWiki Character Atlas faction values select the published faction.",
      subfactions:
        "Each character publishes one factionId from BWiki's faction field, never its initial-faction or organization fields. factionGroupId is only the related-group hint.",
      assets:
        "A single official/local fallback thumbnail is downloaded and used for both avatar and portrait to avoid hotlinking and minimize redistribution.",
    },
    coverage: {
      officialContentCharacters: aligned.size,
      mergedTrailblazerForms: overrides.trailblazerForms.length,
      publishedCharacters: characters.length,
      localizedNames: `${populatedLocalizedCells}/${localizedCells}`,
      pinyinSearchAliases: `${pinyinCovered}/${characters.length}`,
      romajiSearchAliases: `${romajiCovered}/${characters.length}`,
      elementPathRarity: `${characters.length}/${characters.length}`,
      faction: `${characters.length}/${characters.length}`,
      distinctFactionHierarchyPairs: new Set(
        characters.map((character) => `${character.factionId}\u0000${character.factionGroupId}`),
      ).size,
      releaseVersion: `${characters.length}/${characters.length}`,
      localAssets: options.dryRun
        ? "URL validation only"
        : `${assets?.length ?? 0}/${characters.length}`,
    },
    mergedOfficialIds,
    subfactionAudit,
    sources: {
      reviewedOverrides: {
        path: "packages/game-data/src/data/sync-overrides.json",
        sha256: overrideDigest,
        use: "Ambiguous IDs, presentation names, search aliases, merged Trailblazer forms, pre-launch release corrections, and reviewed BWiki faction mappings.",
      },
      bwiki: {
        characterAtlas: "https://wiki.biligame.com/sr/%E8%A7%92%E8%89%B2%E5%9B%BE%E9%89%B4",
        semanticApi: "https://wiki.biligame.com/sr/api.php?action=ask&format=json",
        field: "阵营",
        excludedFields: ["初始阵营", "派系"],
        reviewedAt: options.asOfLabel,
      },
      hoyoverse: {
        characterPage: "https://hsr.hoyoverse.com/en-us/character",
        characterApi: Object.fromEntries(
          Object.entries(sources.characterPayloads).map(([locale, source]) => [
            locale,
            source.sourceUrl,
          ]),
        ),
        factionApi: Object.fromEntries(
          Object.entries(sources.factionPayloads).map(([locale, source]) => [
            locale,
            source.sourceUrl,
          ]),
        ),
        versionNoticeApi: sources.noticePayload.sourceUrl,
        contentDigestSha256: officialSourceDigest,
        rights:
          "No open-data or asset license is asserted. Names and images remain with their respective rights holders.",
      },
      starRailRes: {
        commit: sources.starCommit.body.sha,
        commitUrl: sources.starCommit.body.html_url,
        repository: `https://github.com/${STARRAIL_RES_REPOSITORY}`,
        license: `https://github.com/${STARRAIL_RES_REPOSITORY}/blob/${sources.starCommit.body.sha}/LICENSE`,
        use: "Only ID/path/element/rarity facts and Trailblazer fallback thumbnails; official HoYoverse content controls roster membership and public names.",
        rights:
          "Repository code/data is marked AGPL-3.0; the license does not grant rights to underlying HoYoverse game materials.",
      },
    },
    versionNotices: notices,
  };

  if (options.dryRun) {
    console.log(
      `dry-run 通过：${characters.length} 角色，${factions.length} 阵营，${versions.length} 版本，${drafts.length} 个素材 URL。`,
    );
    if (plannedAssetBytes !== null) {
      console.log(`预计素材体积：${(plannedAssetBytes / 1024 / 1024).toFixed(2)} MiB。`);
    }
    return;
  }

  if (!assets) throw new Error("非 dry-run 缺少素材结果。");
  const updatedAtEpochSeconds = latestSourceEpochSeconds(aligned, sources, notices);
  const sql = generateSql(characters, factions, versions, updatedAtEpochSeconds);
  await writePublishedOutputs(characters, factions, versions, assets, metadata, sql);
  console.log(
    `同步完成：${characters.length} 角色，${factions.length} 阵营，${versions.length} 版本，${assets.length} 个本地素材。`,
  );
  console.log(`D1 seed：${relative(REPO_ROOT, GENERATED_SQL_PATH)}`);
}

await main();
