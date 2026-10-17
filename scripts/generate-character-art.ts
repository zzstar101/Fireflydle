/**
 * 生成「高清角色图」素材（见 docs/design/redesign-v2/README.md 第 7 节）。
 *
 * - head：StarRailRes `icon/character/<officialId>.png`（256px 无边框头肩图）
 *         → Real-ESRGAN `realesrgan-x4plus-anime` 放大 4 倍（1024×1024）
 *         → 裁出头肩区域 (152, 8, 872, 728)
 *         → 缩放 224×224 → WebP（quality 80）
 * - portrait：`apps/web/public/assets/portraits/<officialId>.png`（376×512 立绘）
 *         → 同一模型放大 4 倍（1504×2048）
 *         → 缩放 1128×1536 → WebP（quality 84）
 *
 * - cloud：`portrait` 的同一份 376×512 源立绘 → 构建期采样的点云（见下方「点云编码」）
 *
 * 输出：
 *   apps/web/public/assets/character-art/<characterId>-head-<源 SHA-256 前 12 位>.webp
 *   apps/web/public/assets/character-art/<characterId>-portrait-<源 SHA-256 前 12 位>.webp
 *   apps/web/public/assets/character-art/<characterId>-cloud-<源 SHA-256 前 12 位>.json
 *   apps/web/public/assets/character-art/index.json
 *
 * 生成结果会登记进 `assets/manifest.json`，交给现有的 assets:validate / assets:upload 校验
 * 与上传；index.json 同样上传 R2，因为生产环境 `assetUrl()` 会把 `/assets/...` 指向 CDN。
 *
 * 超分依赖本地 Real-ESRGAN ncnn-vulkan 二进制（CI 不跑超分，只校验/上传已生成文件）：
 *   REALESRGAN_BIN     默认 /tmp/ffshots/v3/esr/realesrgan-ncnn-vulkan
 *   REALESRGAN_MODELS  默认 /tmp/ffshots/v3/esr/models
 * 二进制与模型的下载方式见 docs/ASSET_HOSTING.md。
 *
 * 可重复运行：输出文件名带源文件内容哈希，源未变时直接复用已有文件，源变了会生成新文件，
 * 并清掉不再被引用的旧文件与旧 manifest 记录。
 *
 * 用法：
 *   bun run assets:art
 *   bun run assets:art -- --offline        # 只用 icon 缓存，不访问网络
 *   bun run assets:art -- --refresh-icons  # 强制重新下载 StarRailRes icon
 *   bun run assets:art -- --cache-dir=/path/to/cache
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { format as prettierFormat } from "prettier";
import sharp from "sharp";
import type { OverlayOptions } from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const PUBLIC_ASSET_DIR = join(REPO_ROOT, "apps", "web", "public", "assets");
const CHARACTER_ART_DIR = join(PUBLIC_ASSET_DIR, "character-art");
const PORTRAIT_DIR = join(PUBLIC_ASSET_DIR, "portraits");
const MANIFEST_PATH = join(PUBLIC_ASSET_DIR, "manifest.json");
const MANIFEST_SHA_PATH = join(PUBLIC_ASSET_DIR, "manifest.sha256");
const CHARACTERS_PATH = join(
  REPO_ROOT,
  "packages",
  "game-data",
  "src",
  "generated",
  "characters.json",
);

const DEFAULT_CACHE_DIR = join(REPO_ROOT, "tmp", "character-art-cache");
const STARRAIL_RES_BRANCH = "master";
const STARRAIL_RES_ICON_BASE = `https://raw.githubusercontent.com/Mar-7th/StarRailRes/${STARRAIL_RES_BRANCH}/icon/character`;
const DEFAULT_REALESRGAN_BIN = "/tmp/ffshots/v3/esr/realesrgan-ncnn-vulkan";
const DEFAULT_REALESRGAN_MODELS = "/tmp/ffshots/v3/esr/models";
const REALESRGAN_MODEL_NAME = "realesrgan-x4plus-anime";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
/** StarRailRes icon 的边长；裁切框按这个尺寸标定。 */
const HEAD_SOURCE_SIZE = 256;
const UPSCALE_FACTOR = 4;
/** 4 倍超分后 1024×1024 图上的头肩裁切框：left/top/right/bottom = 152/8/872/728。 */
const HEAD_CROP = { left: 152, top: 8, width: 720, height: 720 } as const;
const HEAD_SIZE = 224;
const HEAD_QUALITY = 80;
const PORTRAIT_WIDTH = 1128;
const PORTRAIT_HEIGHT = 1536;
const PORTRAIT_QUALITY = 84;
/** 与 scripts/responsive-assets.ts 一致，固定 effort 保证可复现。 */
const WEBP_EFFORT = 4;

/**
 * 点云编码（u8-xyb）。
 *
 * 结算「揭晓」阶段要让星尘汇聚成答案立绘（docs/design/redesign-v2/README.md 第 3 节），
 * 所以每个有立绘的角色额外产出一份构建期算好的点云。编码刻意做成浏览器端零依赖：
 * 一行 `atob` 就能解，不需要读像素，`file://` 与跨域环境都不受影响。
 *
 * - 网格最多 `120×163`（列×行，宽高比 0.736，与 376×512 立绘的 0.734 基本一致）；
 *   源图比网格小时按源尺寸收窄，保证不会出现空列。源图按「宽 / 列数」「高 / 行数」
 *   直接切片，每张源图正好覆盖一次，不会漏像素。
 * - 逐格判断：源图带 alpha 时用格内最大 alpha 与阈值比较（透明背景直接出局），
 *   没有 alpha 时退化为亮度阈值，阈值取「全图平均亮度 + 8」，保证剪影能被捕捉。
 * - 点少于一格时无法再补点，所以阈值会逐级放宽（16 → 8 → 4 → 2 → 1）直到至少
 *   `CLOUD_MIN_POINTS` 个格子入选；这一步只依赖源像素，结果仍然确定。
 * - 入选格子里如果超过 `CLOUD_MAX_POINTS` 个，按行优先序等间隔抽样（取模），
 *   避免随机抽样破坏「同一输入同一输出」。
 * - 每个点 3 字节：x、y 各量化到 0..255（`列 / 列数 × 255`，所以最后一列正好 255），
 *   第三字节是格内平均亮度。解码时三个字节都除以 255 归一，不需要再知道网格尺寸。
 * - 约 7000 点时原始字节约 21KB，base64 后约 28KB，远低于 64KB 预算。
 */
const CLOUD_GRID_WIDTH = 120;
const CLOUD_GRID_HEIGHT = 163;
const CLOUD_STRIDE = 3;
const CLOUD_ENCODING = "u8-xyb";
const CLOUD_VERSION = 1;
const CLOUD_MIN_POINTS = 4000;
const CLOUD_MAX_POINTS = 8000;
/** 目标点数，抽样时向它靠拢，落在 4000–8000 区间内。 */
const CLOUD_TARGET_POINTS = 7000;
const CLOUD_ALPHA_THRESHOLD = 16;
const CLOUD_LUMINANCE_MARGIN = 8;
const CLOUD_THRESHOLD_LADDER = [CLOUD_ALPHA_THRESHOLD, 8, 4, 2, 1] as const;

/**
 * 结算·推理回放的雪碧图：
 * - 回放要同时铺开 90+ 个候选头像，逐张请求会打出近百次往返，合成一张后只剩一个请求。
 * - 单格 64px，比前端实际显示的 38px 大一档，方便高分屏（DPR 1.5）取到清晰像素。
 * - 10 列网格，行数按角色数向上取整；单元格按 characterId 字典序行优先分配，
 *   保证同一批输入永远得到同一张图与同一份 cells。
 */
const SPRITE_CELL = 64;
const SPRITE_COLUMNS = 10;
/** 头像在回放里只显示 38px（DPR 1.5 时约 57 设备像素），64px 单格留了一档余量，质量 74 足够。 */
const SPRITE_QUALITY = 74;
/** 雪碧图只生成一次且体积敏感，用比单图更高的压缩强度换体积。 */
const SPRITE_EFFORT = 6;
const SPRITE_NAME_PREFIX = "replay-sprite";

const LOGICAL_PREFIX = "/assets/";
const CHARACTER_ART_LOGICAL_PREFIX = `${LOGICAL_PREFIX}character-art/`;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

interface CliOptions {
  cacheDir: string;
  offline: boolean;
  refreshIcons: boolean;
  help: boolean;
  realesrganBin: string;
  realesrganModels: string;
}

interface Character {
  id: string;
  officialId: string;
  enabled?: boolean;
  rarity: number;
  names: Record<string, string>;
}

interface ManifestFile {
  bytes: number;
  format?: string;
  mimeType: string;
  path: string;
  roles: string[];
  sha256: string;
  sourceKind?: string;
  sourceUrl?: string;
  width?: number;
}

interface AssetManifest {
  schemaVersion: number;
  asOf: string;
  sourceRevision: string;
  rightsNotice: string;
  policy: string;
  files: ManifestFile[];
}

interface CharacterArtEntry {
  head: string;
  portrait: string | null;
  /** 点云 JSON 的逻辑路径；没有立绘时为 null。 */
  cloud: string | null;
}

interface CharacterArtIndex {
  version: number;
  characters: Record<string, CharacterArtEntry>;
  /** 推理回放用的头像雪碧图；没有 head 素材时为 null。 */
  sprite: SpriteEntry | null;
}

/** 雪碧图的索引：单格边长、列数，以及 characterId 到行优先格序号的映射。 */
export interface SpriteEntry {
  path: string;
  size: number;
  columns: number;
  rows: number;
  cells: Record<string, number>;
}

interface SpriteArtifact {
  fileName: string;
  logicalPath: string;
  outputPath: string;
  entry: SpriteEntry;
}

/** `<id>-cloud-<hash>.json` 的内容：自描述头 + base64 点数据。 */
export interface CharacterPointCloud {
  version: number;
  width: number;
  height: number;
  stride: number;
  encoding: string;
  points: string;
}

/** 解码后的点云：坐标与亮度都归一到 [0, 1]，每 3 个浮点是一个点。 */
export interface DecodedPointCloud {
  width: number;
  height: number;
  points: Float32Array;
}

/** 供编码器使用的源像素快照（sharp 的 raw 输出）。 */
export interface PortraitPixels {
  data: Uint8Array;
  width: number;
  height: number;
  hasAlpha: boolean;
}

type ArtKind = "head" | "portrait";

interface ArtJob {
  characterId: string;
  kind: ArtKind;
  /** 超分缓存与暂存用的稳定文件名：head 用 characterId，portrait 用 officialId。 */
  sourceKey: string;
  sourceSha256: string;
  sourceKind: string;
  sourceUrl: string;
  fileName: string;
  logicalPath: string;
  outputPath: string;
  /** 只有 portrait 任务有点云文件名；head 为 undefined。 */
  cloudFileName?: string;
  cloudLogicalPath?: string;
  cloudOutputPath?: string;
  sourceBytes: Uint8Array;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    cacheDir: DEFAULT_CACHE_DIR,
    offline: false,
    refreshIcons: false,
    help: false,
    realesrganBin: process.env.REALESRGAN_BIN?.trim() || DEFAULT_REALESRGAN_BIN,
    realesrganModels: process.env.REALESRGAN_MODELS?.trim() || DEFAULT_REALESRGAN_MODELS,
  };

  for (const arg of argv) {
    if (arg === "--offline") {
      options.offline = true;
    } else if (arg === "--refresh-icons") {
      options.refreshIcons = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--cache-dir=")) {
      options.cacheDir = resolve(arg.slice("--cache-dir=".length));
    } else {
      throw new Error(`未知参数：${arg}（--help 查看用法）`);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`生成高清角色图（head + portrait）。

用法：
  bun run assets:art [选项]

选项：
  --offline         只使用缓存中的 StarRailRes icon，不访问网络
  --refresh-icons   忽略 icon 缓存并重新下载
  --cache-dir=DIR   缓存目录（默认 tmp/character-art-cache）
  -h, --help        显示帮助

环境变量：
  REALESRGAN_BIN      Real-ESRGAN 可执行文件（默认 ${DEFAULT_REALESRGAN_BIN}）
  REALESRGAN_MODELS   模型目录（默认 ${DEFAULT_REALESRGAN_MODELS}）`);
}

async function fileExists(path: string): Promise<boolean> {
  const content = await readFile(path).catch(() => null);
  return content !== null;
}

/** 先写同目录临时文件再替换，避免中断留下半份素材。 */
async function atomicWrite(path: string, content: string | Uint8Array): Promise<void> {
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, content);
  await rename(temporary, path);
}

function formattedJsonText(value: unknown): Promise<string> {
  return prettierFormat(`${JSON.stringify(value, null, 2)}\n`, {
    parser: "json",
    printWidth: 100,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
  });
}

function assertPngMagic(bytes: Uint8Array, label: string): void {
  const matches =
    bytes.byteLength >= PNG_MAGIC.length &&
    PNG_MAGIC.every((value, index) => bytes[index] === value);
  if (!matches) {
    throw new Error(`${label} 不是 PNG。`);
  }
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "image/png,image/*;q=0.9,*/*;q=0.1",
          "user-agent": "Fireflydle-data-sync/1.0 (unofficial non-commercial fan project)",
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

async function loadCharacters(): Promise<Character[]> {
  const characters = JSON.parse(await readFile(CHARACTERS_PATH, "utf8")) as Character[];
  const playable = characters.filter((character) => character.enabled !== false);
  if (playable.length !== characters.length) {
    console.log(
      `已启用角色 ${playable.length} 个，跳过 ${characters.length - playable.length} 个未启用角色。`,
    );
  }
  return playable;
}

/**
 * StarRailRes icon 缓存。
 *
 * 缓存命中直接复用；pearl 这类非数字 officialId 没有 StarRailRes icon，返回 null。
 */
async function resolveHeadSource(
  character: Character,
  options: CliOptions,
): Promise<Uint8Array | null> {
  if (!/^\d+$/.test(character.officialId)) {
    console.warn(
      `跳过 ${character.id} 的 head：officialId ${character.officialId} 不是 StarRailRes 数字 ID。`,
    );
    return null;
  }

  const cachePath = join(options.cacheDir, "icons", `${character.id}.png`);

  if (!options.refreshIcons) {
    const cached = await readFile(cachePath).catch(() => null);
    if (cached && cached.byteLength > 0) {
      assertPngMagic(cached, `icon 缓存 ${cachePath}`);
      return cached;
    }
  }

  if (options.offline) {
    console.warn(`跳过 ${character.id} 的 head：离线模式缺少 icon 缓存。`);
    return null;
  }

  const url = `${STARRAIL_RES_ICON_BASE}/${character.officialId}.png`;
  const response = await fetchWithRetry(url);
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_SOURCE_BYTES) {
    throw new Error(`${character.id} 的 icon 超过 ${MAX_SOURCE_BYTES} 字节限制。`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new Error(`${character.id} 的 icon 大小异常：${bytes.byteLength}`);
  }
  assertPngMagic(bytes, url);
  await atomicWrite(cachePath, bytes);
  return bytes;
}

/** 本地 376×512 立绘；没有立绘的角色返回 null（index.json 里 portrait 为 null）。 */
async function resolvePortraitSource(character: Character): Promise<Uint8Array | null> {
  if (!/^\d+$/.test(character.officialId)) {
    return null;
  }
  const sourcePath = join(PORTRAIT_DIR, `${character.officialId}.png`);
  const bytes = await readFile(sourcePath).catch(() => null);
  if (!bytes || bytes.byteLength === 0) {
    return null;
  }
  assertPngMagic(bytes, sourcePath);
  return bytes;
}

function runRealesrgan(inputDir: string, outputDir: string, options: CliOptions): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      options.realesrganBin,
      [
        "-i",
        inputDir,
        "-o",
        outputDir,
        "-f",
        "png",
        "-m",
        options.realesrganModels,
        "-n",
        REALESRGAN_MODEL_NAME,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    child.stdout.resume();
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(
        new Error(
          `无法执行 Real-ESRGAN（REALESRGAN_BIN=${options.realesrganBin}）：${error.message}。` +
            "请按 docs/ASSET_HOSTING.md 下载 ncnn-vulkan 二进制，或用 REALESRGAN_BIN 指定路径。",
        ),
      );
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(`Real-ESRGAN 退出码 ${code}：${stderr.trim().slice(-2000)}`));
    });
  });
}

/**
 * 批量 4 倍超分。
 *
 * 缓存键是「稳定文件名 + 源内容哈希」：源没变就复用已有超分结果，
 * 源变了自动重新超分，不需要手动清缓存。
 */
async function upscaleGroup(
  jobs: ArtJob[],
  kind: ArtKind,
  options: CliOptions,
): Promise<Map<string, string>> {
  const groupDir = join(options.cacheDir, "upscaled", kind);
  await mkdir(groupDir, { recursive: true });

  const resolved = new Map<string, string>();
  const pending: ArtJob[] = [];

  for (const job of jobs) {
    if (resolved.has(job.sourceKey)) continue;
    const cached = join(groupDir, `${job.sourceKey}.png`);
    const metadata = await readFile(`${cached}.json`, "utf8").catch(() => null);
    let cachedHash: string | undefined;
    try {
      cachedHash = metadata
        ? (JSON.parse(metadata) as { sourceSha256?: string }).sourceSha256
        : undefined;
    } catch {
      cachedHash = undefined;
    }
    if (cachedHash === job.sourceSha256 && (await fileExists(cached))) {
      resolved.set(job.sourceKey, cached);
      continue;
    }
    pending.push(job);
  }

  if (pending.length === 0) {
    return resolved;
  }

  const stagingRoot = join(options.cacheDir, "staging", `${kind}-${process.pid}-${Date.now()}`);
  const inputDir = join(stagingRoot, "in");
  const outputDir = join(stagingRoot, "out");
  await mkdir(inputDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  try {
    for (const job of pending) {
      await writeFile(join(inputDir, `${job.sourceKey}.png`), job.sourceBytes);
    }

    const label = kind === "head" ? "头像" : "立绘";
    console.log(`超分 ${pending.length} 张${label}（Real-ESRGAN ${REALESRGAN_MODEL_NAME}）…`);
    await runRealesrgan(inputDir, outputDir, options);

    for (const job of pending) {
      const produced = join(outputDir, `${job.sourceKey}.png`);
      if (!(await fileExists(produced))) {
        throw new Error(`Real-ESRGAN 未生成 ${produced}。`);
      }
      const cached = join(groupDir, `${job.sourceKey}.png`);
      await rename(produced, cached);
      await atomicWrite(
        `${cached}.json`,
        `${JSON.stringify({ model: REALESRGAN_MODEL_NAME, sourceSha256: job.sourceSha256 }, null, 2)}\n`,
      );
      resolved.set(job.sourceKey, cached);
    }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }

  return resolved;
}

async function renderHead(upscaledPath: string, characterId: string): Promise<Uint8Array> {
  const upscaled = HEAD_SOURCE_SIZE * UPSCALE_FACTOR;
  const metadata = await sharp(upscaledPath).metadata();
  if (metadata.width !== upscaled || metadata.height !== upscaled) {
    throw new Error(
      `${characterId} 的超分结果尺寸异常：${metadata.width}×${metadata.height}，期望 ${upscaled}×${upscaled}；` +
        `请确认 StarRailRes icon 是 ${HEAD_SOURCE_SIZE}×${HEAD_SOURCE_SIZE}。`,
    );
  }
  return sharp(upscaledPath)
    .extract(HEAD_CROP)
    .resize(HEAD_SIZE, HEAD_SIZE, { fit: "cover", position: "centre" })
    .webp({ effort: WEBP_EFFORT, quality: HEAD_QUALITY })
    .toBuffer();
}

async function renderPortrait(upscaledPath: string): Promise<Uint8Array> {
  return sharp(upscaledPath)
    .resize(PORTRAIT_WIDTH, PORTRAIT_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ effort: WEBP_EFFORT, quality: PORTRAIT_QUALITY })
    .toBuffer();
}

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
}

/**
 * 把源像素按 `CLOUD_GRID_WIDTH × CLOUD_GRID_HEIGHT` 采样成点云。
 *
 * 纯函数：不碰文件系统，同样的像素一定得到同样的字节，方便单测直接构造小图验证。
 */
export function encodePointCloud(pixels: PortraitPixels): CharacterPointCloud {
  const { data, width, height, hasAlpha } = pixels;
  if (width <= 0 || height <= 0) {
    throw new Error(`点云采样需要非空图像，收到 ${width}×${height}。`);
  }

  const channels = hasAlpha ? 4 : 3;
  // 源图可能小于网格（例如小尺寸测试图），收窄网格避免出现空列/空行。
  const gridWidth = Math.min(CLOUD_GRID_WIDTH, width);
  const gridHeight = Math.min(CLOUD_GRID_HEIGHT, height);
  const meanLuminance = (() => {
    if (hasAlpha) return 0;
    let total = 0;
    for (let index = 0; index < data.length; index += channels) {
      total += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    }
    return total / (width * height);
  })();

  /** 逐格算「是否入选」与「亮度」，返回行优先序的候选点。 */
  const collect = (threshold: number): { x: number; y: number; brightness: number }[] => {
    const luminanceThreshold = meanLuminance + CLOUD_LUMINANCE_MARGIN;
    const collected: { x: number; y: number; brightness: number }[] = [];

    for (let row = 0; row < gridHeight; row += 1) {
      const top = Math.floor((row * height) / gridHeight);
      const bottom = Math.max(top + 1, Math.floor(((row + 1) * height) / gridHeight));

      for (let column = 0; column < gridWidth; column += 1) {
        const left = Math.floor((column * width) / gridWidth);
        const right = Math.max(left + 1, Math.floor(((column + 1) * width) / gridWidth));

        let peak = 0;
        let total = 0;
        let count = 0;

        for (let y = top; y < bottom && y < height; y += 1) {
          for (let x = left; x < right && x < width; x += 1) {
            const offset = (y * width + x) * channels;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];

            if (hasAlpha) {
              const alpha = data[offset + 3];
              if (alpha > peak) peak = alpha;
              total += alpha;
            } else {
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              if (luminance > peak) peak = luminance;
              total += luminance;
            }
            count += 1;
          }
        }

        if (count === 0) continue;

        const passes = hasAlpha ? peak >= threshold : peak >= luminanceThreshold;
        if (!passes) continue;

        collected.push({ x: column, y: row, brightness: clampByte(total / count) });
      }
    }

    return collected;
  };

  let points = collect(CLOUD_ALPHA_THRESHOLD);
  // 立绘只有几千个格子能被覆盖，小尺寸图更少；点不够时逐级放宽阈值再试。
  for (const threshold of CLOUD_THRESHOLD_LADDER) {
    if (points.length >= CLOUD_MIN_POINTS) break;
    if (threshold === CLOUD_ALPHA_THRESHOLD) continue;
    points = collect(threshold);
  }

  if (points.length > CLOUD_MAX_POINTS) {
    const step = Math.ceil(points.length / CLOUD_TARGET_POINTS);
    const sampled: typeof points = [];
    for (let index = 0; index < points.length; index += step) {
      sampled.push(points[index]);
    }
    points = sampled;
  }

  const bytes = new Uint8Array(points.length * CLOUD_STRIDE);
  points.forEach((point, index) => {
    const base = index * CLOUD_STRIDE;
    bytes[base] = Math.round((point.x / gridWidth) * 255);
    bytes[base + 1] = Math.round((point.y / gridHeight) * 255);
    bytes[base + 2] = point.brightness;
  });

  return {
    version: CLOUD_VERSION,
    width: gridWidth,
    height: gridHeight,
    stride: CLOUD_STRIDE,
    encoding: CLOUD_ENCODING,
    // 浏览器端用 atob 解，所以这里也走标准 base64（不带换行）。
    points: Buffer.from(bytes).toString("base64"),
  };
}

/**
 * `encodePointCloud` 的逆运算，供测试与需要校验的场景使用。
 *
 * 三个字节都是 0..255 的量化值，除以 255 即归一到 [0, 1]，所以解码不依赖 width / height
 * （它们只用来描述网格，方便调用方知道自己拿到的是什么分辨率）。
 */
export function decodePointCloud(cloud: CharacterPointCloud): DecodedPointCloud {
  if (cloud.encoding !== CLOUD_ENCODING) {
    throw new Error(`未知的点云编码：${cloud.encoding}`);
  }
  if (cloud.stride !== CLOUD_STRIDE) {
    throw new Error(`未知的点云步长：${cloud.stride}`);
  }
  if (!Number.isInteger(cloud.width) || !Number.isInteger(cloud.height)) {
    throw new Error(`点云网格尺寸非法：${cloud.width}×${cloud.height}`);
  }

  const bytes = new Uint8Array(Buffer.from(cloud.points, "base64"));
  if (bytes.byteLength % CLOUD_STRIDE !== 0) {
    throw new Error(`点云字节数 ${bytes.byteLength} 不是 ${CLOUD_STRIDE} 的整数倍。`);
  }

  const points = new Float32Array(bytes.byteLength);
  for (let index = 0; index < bytes.byteLength; index += CLOUD_STRIDE) {
    points[index] = bytes[index] / 255;
    points[index + 1] = bytes[index + 1] / 255;
    points[index + 2] = bytes[index + 2] / 255;
  }

  return { width: cloud.width, height: cloud.height, points };
}

/** 从源立绘解码出编码器需要的像素。 */
async function readPortraitPixels(sourceBytes: Uint8Array): Promise<PortraitPixels> {
  const source = sharp(Buffer.from(sourceBytes));
  const metadata = await source.metadata();
  // 源图本来没有 alpha 时保持 3 通道，让编码器走亮度阈值分支。
  const hasAlpha = Boolean(metadata.hasAlpha);
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
    hasAlpha,
  };
}

async function collectJobs(characters: Character[], options: CliOptions): Promise<ArtJob[]> {
  const jobs: ArtJob[] = [];

  for (const character of characters) {
    const headBytes = await resolveHeadSource(character, options);
    if (headBytes) {
      const digest = sha256(headBytes);
      const fileName = `${character.id}-head-${digest.slice(0, 12)}.webp`;
      jobs.push({
        characterId: character.id,
        kind: "head",
        sourceKey: character.id,
        sourceSha256: digest,
        sourceKind: "starrailres-icon-upscaled",
        sourceUrl: `${STARRAIL_RES_ICON_BASE}/${character.officialId}.png`,
        fileName,
        logicalPath: `${CHARACTER_ART_LOGICAL_PREFIX}${fileName}`,
        outputPath: join(CHARACTER_ART_DIR, fileName),
        sourceBytes: headBytes,
      });
    }

    const portraitBytes = await resolvePortraitSource(character);
    if (portraitBytes) {
      const digest = sha256(portraitBytes);
      const fileName = `${character.id}-portrait-${digest.slice(0, 12)}.webp`;
      // 点云与立绘同源，所以复用同一个哈希；源立绘不变时文件名也不变。
      const cloudFileName = `${character.id}-cloud-${digest.slice(0, 12)}.json`;
      jobs.push({
        characterId: character.id,
        kind: "portrait",
        sourceKey: character.officialId,
        sourceSha256: digest,
        sourceKind: "audited-local-portrait-upscaled",
        sourceUrl: `${LOGICAL_PREFIX}portraits/${character.officialId}.png`,
        fileName,
        logicalPath: `${CHARACTER_ART_LOGICAL_PREFIX}${fileName}`,
        outputPath: join(CHARACTER_ART_DIR, fileName),
        cloudFileName,
        cloudLogicalPath: `${CHARACTER_ART_LOGICAL_PREFIX}${cloudFileName}`,
        cloudOutputPath: join(CHARACTER_ART_DIR, cloudFileName),
        sourceBytes: portraitBytes,
      });
    }
  }

  return jobs;
}

async function renderPending(jobs: ArtJob[], options: CliOptions): Promise<number> {
  let rendered = 0;

  for (const kind of ["head", "portrait"] as const) {
    const pending = jobs.filter((job) => job.kind === kind);
    if (pending.length === 0) continue;

    const upscaled = await upscaleGroup(pending, kind, options);
    for (const job of pending) {
      const upscaledPath = upscaled.get(job.sourceKey);
      if (!upscaledPath) {
        throw new Error(`${job.characterId} 缺少超分结果：${job.sourceKey}。`);
      }
      const bytes =
        kind === "head"
          ? await renderHead(upscaledPath, job.characterId)
          : await renderPortrait(upscaledPath);
      await atomicWrite(job.outputPath, bytes);
      rendered += 1;
    }
  }

  return rendered;
}

/** 为所有有立绘的角色生成点云 JSON（与超分结果无关，直接读源立绘）。 */
async function renderPendingClouds(jobs: ArtJob[]): Promise<number> {
  let rendered = 0;

  for (const job of jobs) {
    if (job.kind !== "portrait" || !job.cloudOutputPath) continue;
    const pixels = await readPortraitPixels(job.sourceBytes);
    const cloud = encodePointCloud(pixels);
    await atomicWrite(job.cloudOutputPath, await formattedJsonText(cloud));
    rendered += 1;
  }

  return rendered;
}

/**
 * 生成 index.json。
 *
 * head 是必填字段，所以没有 StarRailRes icon 的角色（当前只有 pearl）不进入索引；
 * 没有立绘的角色 portrait 与 cloud 都是 null。点云跟着立绘走，两者要么都有要么都没有。
 */
function buildIndex(jobs: ArtJob[], sprite: SpriteArtifact | null): CharacterArtIndex {
  const characters: Record<string, CharacterArtEntry> = {};
  const headIds = new Set<string>();

  for (const job of jobs) {
    if (job.kind !== "head") continue;
    characters[job.characterId] = { head: job.logicalPath, portrait: null, cloud: null };
    headIds.add(job.characterId);
  }

  for (const job of jobs) {
    if (job.kind !== "portrait") continue;
    const entry = characters[job.characterId];
    if (!entry) {
      console.warn(
        `警告：${job.characterId} 有立绘但没有 head，无法写入 index.json（head 是必填字段）。`,
      );
      continue;
    }
    entry.portrait = job.logicalPath;
    entry.cloud = job.cloudLogicalPath ?? null;
  }

  return { version: 1, characters, sprite: sprite?.entry ?? null };
}

/**
 * 把全部 head 缩到 64px 拼成一张雪碧图。
 * 文件名带输入哈希，所以 head 源没变时会直接复用已存在的文件，不重写、不产生 diff。
 */
async function renderSprite(jobs: ArtJob[]): Promise<SpriteArtifact | null> {
  const heads = jobs
    .filter((job) => job.kind === "head")
    .sort((left, right) => left.characterId.localeCompare(right.characterId));

  if (heads.length === 0) return null;

  const columns = SPRITE_COLUMNS;
  const rows = Math.ceil(heads.length / columns);
  // 指纹要带上编码参数：改了单格尺寸或压缩参数，产物就不同，必须换文件名。
  const fingerprint = await sha256(
    new TextEncoder().encode(
      [
        `cell:${SPRITE_CELL}`,
        `columns:${columns}`,
        `quality:${SPRITE_QUALITY}`,
        `effort:${SPRITE_EFFORT}`,
        ...heads.map((job) => `${job.characterId}:${job.sourceSha256}`),
      ].join("\n"),
    ),
  );
  const fileName = `${SPRITE_NAME_PREFIX}-${fingerprint.slice(0, 12)}.webp`;
  const outputPath = join(CHARACTER_ART_DIR, fileName);

  const cells: Record<string, number> = {};
  heads.forEach((job, index) => {
    cells[job.characterId] = index;
  });

  const entry: SpriteEntry = {
    path: `${CHARACTER_ART_LOGICAL_PREFIX}${fileName}`,
    size: SPRITE_CELL,
    columns,
    rows,
    cells,
  };

  if (await fileExists(outputPath)) {
    return { fileName, logicalPath: entry.path, outputPath, entry };
  }

  const composites: OverlayOptions[] = [];
  for (const [index, job] of heads.entries()) {
    const cell = await sharp(await readFile(job.outputPath))
      .resize(SPRITE_CELL, SPRITE_CELL, { fit: "cover" })
      .toBuffer();
    composites.push({
      input: cell,
      left: (index % columns) * SPRITE_CELL,
      top: Math.floor(index / columns) * SPRITE_CELL,
    });
  }

  const bytes = await sharp({
    create: {
      width: columns * SPRITE_CELL,
      height: rows * SPRITE_CELL,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .webp({ quality: SPRITE_QUALITY, effort: SPRITE_EFFORT })
    .toBuffer();

  await atomicWrite(outputPath, bytes);
  return { fileName, logicalPath: entry.path, outputPath, entry };
}

/** 把本次生成结果登记进 assets/manifest.json，并同步 manifest.sha256。 */
async function updateManifest(jobs: ArtJob[], sprite: SpriteArtifact | null): Promise<number> {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as AssetManifest;

  const artFiles: ManifestFile[] = [];
  for (const job of jobs) {
    const bytes = await readFile(job.outputPath);
    artFiles.push({
      bytes: bytes.byteLength,
      format: "webp",
      mimeType: "image/webp",
      path: job.logicalPath,
      // 与现有非响应式素材一致带上 "fallback"：assets:build 会给所有非响应式条目补这个角色，
      // 这里预先写好，保证 assets:build 之后 manifest 不发生变化。
      roles: ["character-art", job.kind, "fallback"],
      sha256: sha256(bytes),
      sourceKind: job.sourceKind,
      sourceUrl: job.sourceUrl,
    });

    if (!job.cloudLogicalPath || !job.cloudOutputPath) continue;
    const cloudBytes = await readFile(job.cloudOutputPath);
    artFiles.push({
      bytes: cloudBytes.byteLength,
      format: "json",
      mimeType: "application/json",
      path: job.cloudLogicalPath,
      // 同样带 "fallback"，理由与图片一致（保持 assets:build 稳定）。
      roles: ["character-art", "portrait-cloud", "fallback"],
      sha256: sha256(cloudBytes),
      sourceKind: `${job.sourceKind}-point-cloud`,
      sourceUrl: job.sourceUrl,
    });
  }

  const indexPath = `${CHARACTER_ART_LOGICAL_PREFIX}index.json`;
  const indexBytes = await readFile(join(CHARACTER_ART_DIR, "index.json"));
  artFiles.push({
    bytes: indexBytes.byteLength,
    format: "json",
    mimeType: "application/json",
    path: indexPath,
    roles: ["character-art", "index", "fallback"],
    sha256: sha256(indexBytes),
  });

  if (sprite) {
    const spriteBytes = await readFile(sprite.outputPath);
    artFiles.push({
      bytes: spriteBytes.byteLength,
      format: "webp",
      mimeType: "image/webp",
      path: sprite.logicalPath,
      // 同样带 "fallback"，保证 assets:build 之后 manifest 不发生变化。
      roles: ["character-art", "sprite", "fallback"],
      sha256: sha256(spriteBytes),
      sourceKind: "sprite-sheet",
      sourceUrl: sprite.logicalPath,
    });
  }

  const files = [
    ...manifest.files.filter((file) => !file.path.startsWith(CHARACTER_ART_LOGICAL_PREFIX)),
    ...artFiles,
  ].sort((left, right) => left.path.localeCompare(right.path));

  const text = await formattedJsonText({ ...manifest, files });
  await atomicWrite(MANIFEST_PATH, text);
  await atomicWrite(
    MANIFEST_SHA_PATH,
    `${sha256(new TextEncoder().encode(text))}  manifest.json\n`,
  );

  return artFiles.length;
}

/** 删除不再被引用的旧图片与旧点云（源变了会换文件名）。index.json 与雪碧图不在清理范围内。 */
async function pruneStaleArt(jobs: ArtJob[], sprite: SpriteArtifact | null): Promise<number> {
  const expected = new Set(jobs.map((job) => job.fileName));
  for (const job of jobs) {
    if (job.cloudFileName) expected.add(job.cloudFileName);
  }
  // 雪碧图由 renderSprite 自己维护文件名，prune 时只保留当前这一个。
  if (sprite) expected.add(sprite.fileName);
  let removed = 0;

  for (const entry of await readdir(CHARACTER_ART_DIR, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name === "index.json") continue;
    const isArt = entry.name.endsWith(".webp");
    const isCloud = entry.name.endsWith(".json") && entry.name.includes("-cloud-");
    if (!isArt && !isCloud) continue;
    if (expected.has(entry.name)) continue;
    await rm(join(CHARACTER_ART_DIR, entry.name), { force: true });
    removed += 1;
  }

  return removed;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  await mkdir(CHARACTER_ART_DIR, { recursive: true });
  await mkdir(join(options.cacheDir, "icons"), { recursive: true });

  const characters = await loadCharacters();
  const jobs = await collectJobs(characters, options);

  const reusable = new Set<string>();
  for (const job of jobs) {
    if (await fileExists(job.outputPath)) {
      reusable.add(job.outputPath);
    }
  }

  const pending = jobs.filter((job) => !reusable.has(job.outputPath));
  const rendered = await renderPending(pending, options);

  const pendingClouds: ArtJob[] = [];
  for (const job of jobs) {
    if (!job.cloudOutputPath) continue;
    if (await fileExists(job.cloudOutputPath)) continue;
    pendingClouds.push(job);
  }
  const clouds = await renderPendingClouds(pendingClouds);

  // 雪碧图必须放在 head 之后：它读的是刚生成的 head 文件。
  const sprite = await renderSprite(jobs);

  const index = buildIndex(jobs, sprite);
  await atomicWrite(join(CHARACTER_ART_DIR, "index.json"), await formattedJsonText(index));

  const manifestEntries = await updateManifest(jobs, sprite);
  const removed = await pruneStaleArt(jobs, sprite);

  const headCount = jobs.filter((job) => job.kind === "head").length;
  const portraitCount = jobs.filter((job) => job.kind === "portrait").length;
  const cloudCount = jobs.filter((job) => job.cloudOutputPath).length;
  const outputPaths = jobs.flatMap((job) =>
    job.cloudOutputPath ? [job.outputPath, job.cloudOutputPath] : [job.outputPath],
  );
  if (sprite) outputPaths.push(sprite.outputPath);
  const totalBytes = (
    await Promise.all(outputPaths.map(async (path) => (await readFile(path)).byteLength))
  ).reduce((sum, value) => sum + value, 0);

  console.log(
    `高清角色图生成完成：head ${headCount}，portrait ${portraitCount}，cloud ${cloudCount}（新生成 ${rendered}，复用 ${reusable.size}，新点云 ${clouds}，清理旧文件 ${removed}）。`,
  );
  console.log(
    `索引：${CHARACTER_ART_LOGICAL_PREFIX}index.json（${Object.keys(index.characters).length} 个角色，其中 ${portraitCount} 个有立绘与点云）。`,
  );
  if (sprite) {
    console.log(
      `推理回放雪碧图：${sprite.logicalPath}（${sprite.entry.columns}×${sprite.entry.rows} 格，单格 ${sprite.entry.size}px）。`,
    );
  }
  console.log(
    `已登记 ${manifestEntries} 条记录到 assets/manifest.json，素材合计 ${totalBytes} 字节。`,
  );
}

// 只在直接执行时跑生成流程；被测试 import 时只暴露纯函数。
if (import.meta.main) {
  await main();
}
