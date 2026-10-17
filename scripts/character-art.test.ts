import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import artIndex from "../apps/web/public/assets/character-art/index.json";
import manifest from "../apps/web/public/assets/manifest.json";
import characters from "../packages/game-data/src/generated/characters.json";
import {
  decodePointCloud,
  encodePointCloud,
  type CharacterPointCloud,
  type PortraitPixels,
} from "./generate-character-art";

/**
 * 高清角色图发布物。
 *
 * 这些文件由 `bun run assets:art`（Real-ESRGAN 超分）生成后入库，
 * CI 不跑超分，所以测试只校验已生成文件与索引、manifest 的一致性；
 * 点云的编码/解码/采样逻辑是纯函数，直接在这里做单元测试。
 */

const publicRoot = new URL("../apps/web/public/", import.meta.url);
const ART_PREFIX = "/assets/character-art/";
const HEAD_SIZE = 224;
const PORTRAIT_WIDTH = 1128;
const PORTRAIT_HEIGHT = 1536;
const HEAD_MAX_BYTES = 64 * 1024;
const PORTRAIT_MAX_BYTES = 700 * 1024;
const HEAD_TOTAL_BUDGET = 4 * 1024 * 1024;
const PORTRAIT_TOTAL_BUDGET = 40 * 1024 * 1024;
/** 点云预算：单文件 64KB 以内，点数落在 4000–8000。 */
const CLOUD_MAX_BYTES = 64 * 1024;
const CLOUD_MIN_POINTS = 4000;
const CLOUD_MAX_POINTS = 8000;
const CLOUD_GRID_WIDTH = 120;
const CLOUD_GRID_HEIGHT = 163;

type CharacterArtIndex = {
  version: number;
  characters: Record<string, { head: string; portrait: string | null; cloud: string | null }>;
  sprite: {
    path: string;
    size: number;
    columns: number;
    rows: number;
    cells: Record<string, number>;
  } | null;
};

type ManifestFile = {
  path: string;
  bytes: number;
  sha256: string;
  width?: number;
  roles?: string[];
};

const index = artIndex as CharacterArtIndex;
const entries = Object.entries(index.characters);
const manifestFiles = manifest.files as ManifestFile[];
const playable = characters.filter((character) => character.enabled !== false);
const playableById = new Map(playable.map((character) => [character.id, character]));

function localPath(logicalPath: string): URL {
  return new URL(`.${logicalPath}`, publicRoot);
}

/** sharp 只接受路径字符串，不接受 URL 对象。 */
function localFilePath(logicalPath: string): string {
  return fileURLToPath(localPath(logicalPath));
}

async function sha256Of(url: URL): Promise<string> {
  return createHash("sha256")
    .update(await readFile(url))
    .digest("hex");
}

/** 取出 `<id>-head-<hash12>.webp` 里的 12 位源哈希。 */
function hashOfName(logicalPath: string): string {
  return /-([a-f0-9]{12})\.webp$/.exec(logicalPath)?.[1] ?? "";
}

/** 取出 `<id>-cloud-<hash12>.json` 里的 12 位源哈希。 */
function cloudHashOfName(logicalPath: string): string {
  return /-([a-f0-9]{12})\.json$/.exec(logicalPath)?.[1] ?? "";
}

/** 取回解码后的归一化点：每 3 个浮点一个点。 */
function pointAt(decoded: ReturnType<typeof decodePointCloud>, index: number): number[] {
  const base = index * 3;
  return [
    decoded.points[base] ?? Number.NaN,
    decoded.points[base + 1] ?? Number.NaN,
    decoded.points[base + 2] ?? Number.NaN,
  ];
}

/** 解码结果存在 Float32Array 里，期望值也要先过一遍 float32 才能精确比较。 */
function f32(value: number): number {
  return Math.fround(value);
}

/** 构造一块纯色（或透明）源像素，避免测试依赖真实图片。 */
function solidPixels(
  width: number,
  height: number,
  rgba: readonly [number, number, number, number],
  hasAlpha = true,
): PortraitPixels {
  const channels = hasAlpha ? 4 : 3;
  const data = new Uint8Array(width * height * channels);
  for (let index = 0; index < width * height; index += 1) {
    const base = index * channels;
    data[base] = rgba[0];
    data[base + 1] = rgba[1];
    data[base + 2] = rgba[2];
    if (hasAlpha) data[base + 3] = rgba[3];
  }
  return { data, width, height, hasAlpha };
}

describe("立绘点云编码（u8-xyb）", () => {
  it("编码头自描述且每个点恰好 3 字节", () => {
    // 源图比网格大，网格用满 120×163 上限。
    const cloud = encodePointCloud(solidPixels(240, 326, [255, 255, 255, 255]));

    expect(cloud.version).toBe(1);
    expect(cloud.width).toBe(CLOUD_GRID_WIDTH);
    expect(cloud.height).toBe(CLOUD_GRID_HEIGHT);
    expect(cloud.stride).toBe(3);
    expect(cloud.encoding).toBe("u8-xyb");
    expect(cloud.points).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

    const decoded = decodePointCloud(cloud);
    expect(decoded.points.length % 3).toBe(0);
    expect(decoded.points.length / 3).toBeGreaterThanOrEqual(CLOUD_MIN_POINTS);
    expect(decoded.points.length / 3).toBeLessThanOrEqual(CLOUD_MAX_POINTS);
  });

  it("全透明源图不产生任何点", () => {
    const cloud = encodePointCloud(solidPixels(8, 8, [255, 255, 255, 0]));
    expect(cloud.points).toBe("");
    expect(decodePointCloud(cloud).points.length).toBe(0);
  });

  it("alpha 阈值只保留不透明格，亮度取格内平均 alpha", () => {
    // 64×64 图收窄成 64×64 网格（每格一个像素）：左上 8×8 格全透明，
    // 其余 alpha=255。初始阈值 16 就能选出 4032 个点（≥ 4000），
    // 所以低阈值分支不会被触发，正好验证「透明格被排除」。
    const pixels = solidPixels(64, 64, [255, 255, 255, 255]);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        pixels.data[(y * 64 + x) * 4 + 3] = 0;
      }
    }

    const decoded = decodePointCloud(encodePointCloud(pixels));

    expect(decoded.points.length / 3).toBe(64 * 64 - 8 * 8);
    // 行优先序：透明区被跳过，第一个点是 (8, 0)。
    const eighth = f32(Math.round((8 / 64) * 255) / 255);
    expect(pointAt(decoded, 0)).toEqual([eighth, 0, 1]);
    expect(pointAt(decoded, 1)).toEqual([f32(Math.round((9 / 64) * 255) / 255), 0, 1]);
  });

  it("低于 4000 点时逐级放宽阈值再采样", () => {
    // 全图 alpha=3 低于初始阈值 16，低于 4000 点时会一路放宽到阈值 3。
    const decoded = decodePointCloud(encodePointCloud(solidPixels(16, 16, [255, 255, 255, 3])));

    expect(decoded.points.length / 3).toBe(16 * 16);
  });

  it("没有 alpha 通道时按「全图平均亮度 + 8」阈值取剪影", () => {
    // 64×64 图收窄成 64×64 网格：右下 54×54 格是亮部（亮度 255），其余是暗底（亮度 96）。
    // 平均亮度约 226.8，阈值 = 平均值 + 8 ≈ 234.8，所以只有亮部入选，暗底被当作背景丢弃。
    const pixels = solidPixels(64, 64, [96, 96, 96, 255], false);
    for (let y = 10; y < 64; y += 1) {
      for (let x = 10; x < 64; x += 1) {
        const base = (y * 64 + x) * 3;
        pixels.data[base] = 255;
        pixels.data[base + 1] = 255;
        pixels.data[base + 2] = 255;
      }
    }

    const decoded = decodePointCloud(encodePointCloud(pixels));

    expect(decoded.points.length / 3).toBe(54 * 54);
    // 行优先序：暗底被跳过，第一个点是亮部左上角 (10, 10)。
    const tenth = f32(Math.round((10 / 64) * 255) / 255);
    expect(pointAt(decoded, 0)).toEqual([tenth, tenth, 1]);
  });

  it("网格坐标按 255 归一化，四角落在网格边界上", () => {
    const pixels = solidPixels(16, 16, [255, 255, 255, 255]);
    const decoded = decodePointCloud(encodePointCloud(pixels));

    // 行优先序：第一个点是左上角，最后一个是右下角；x/y 量化公式是「列 / 列数 × 255」。
    const lastX = f32(Math.round((15 / 16) * 255) / 255);
    expect(pointAt(decoded, 0)).toEqual([0, 0, 1]);
    expect(pointAt(decoded, decoded.points.length / 3 - 1)).toEqual([lastX, lastX, 1]);
  });

  it("同一输入编码结果完全一致（确定性）", () => {
    const pixels = solidPixels(8, 8, [200, 100, 50, 255]);
    const first = encodePointCloud(pixels);
    const second = encodePointCloud(pixels);

    expect(first).toEqual(second);
    expect(first.points).toBe(second.points);
  });

  it("解码器拒绝未知编码、未知步长与残缺字节", () => {
    const cloud = encodePointCloud(solidPixels(8, 8, [255, 255, 255, 255]));
    const broken: CharacterPointCloud = { ...cloud, encoding: "f32-xyz" };
    const wrongStride: CharacterPointCloud = { ...cloud, stride: 4 };
    const truncated: CharacterPointCloud = { ...cloud, points: "AAA" };

    expect(() => decodePointCloud(broken)).toThrow(/未知的点云编码/);
    expect(() => decodePointCloud(wrongStride)).toThrow(/未知的点云步长/);
    expect(() => decodePointCloud(truncated)).toThrow(/不是 3 的整数倍/);
  });
});

describe("高清角色图（character-art）", () => {
  it("索引覆盖全部有官方图标的可用角色", () => {
    const withIcon = playable.filter((character) => /^\d+$/.test(character.officialId));
    expect(index.version).toBe(1);
    expect(entries.length).toBeGreaterThanOrEqual(92);
    expect(withIcon.length).toBeGreaterThanOrEqual(92);
    expect(new Set(Object.keys(index.characters))).toEqual(new Set(withIcon.map((c) => c.id)));
  });

  it("head 一律存在，portrait 与本地立绘基线一一对应", async () => {
    const portraitCount = entries.filter(([, entry]) => entry.portrait !== null).length;
    expect(portraitCount).toBeGreaterThanOrEqual(90);

    for (const [characterId, entry] of entries) {
      const character = playableById.get(characterId);

      if (!character) throw new Error(`索引中的角色不在 game-data 中：${characterId}`);

      expect(entry.head.startsWith(ART_PREFIX), entry.head).toBe(true);
      expect(entry.head).toContain(`/${characterId}-head-`);
      expect(hashOfName(entry.head), entry.head).toMatch(/^[a-f0-9]{12}$/);

      const portraitSource = localPath(`/assets/portraits/${character.officialId}.png`);
      const hasPortrait = await readFile(portraitSource).then(
        () => true,
        () => false,
      );

      if (entry.portrait === null) {
        expect(hasPortrait, `${characterId} 缺少立绘基线却标记为 null`).toBe(false);
        // 点云跟着立绘走：没有立绘就没有点云。
        expect(entry.cloud, `${characterId} 没有立绘却有点云`).toBeNull();
        continue;
      }

      expect(hasPortrait, `${characterId} 的立绘基线缺失`).toBe(true);
      expect(entry.portrait.startsWith(ART_PREFIX), entry.portrait).toBe(true);
      expect(entry.portrait).toContain(`/${characterId}-portrait-`);
      // 文件名里的哈希取自源立绘字节，源未变时可据此跳过重新超分。
      expect(hashOfName(entry.portrait)).toBe((await sha256Of(portraitSource)).slice(0, 12));

      // 点云与立绘同源：有立绘就必须有点云，且文件名哈希一致。
      expect(entry.cloud, `${characterId} 有立绘却缺少点云引用`).toBeTruthy();
      expect(entry.cloud).toContain(`/${characterId}-cloud-`);
      expect(cloudHashOfName(entry.cloud ?? "")).toBe(hashOfName(entry.portrait));
      await expect(readFile(localPath(entry.cloud ?? ""))).resolves.toBeTruthy();
    }
  });

  it("每份点云都是 u8-xyb、点数在 4000–8000、坐标归一到 [0,1]", async () => {
    for (const [characterId, entry] of entries) {
      if (!entry.cloud) continue;

      const raw = await readFile(localPath(entry.cloud), "utf8");
      const cloud = JSON.parse(raw) as CharacterPointCloud;

      expect(cloud.version, characterId).toBe(1);
      expect(cloud.width, characterId).toBe(CLOUD_GRID_WIDTH);
      expect(cloud.height, characterId).toBe(CLOUD_GRID_HEIGHT);
      expect(cloud.stride, characterId).toBe(3);
      expect(cloud.encoding, characterId).toBe("u8-xyb");

      const bytes = Buffer.from(cloud.points, "base64");
      expect(bytes.byteLength % 3, characterId).toBe(0);
      const pointCount = bytes.byteLength / 3;
      expect(pointCount, characterId).toBeGreaterThanOrEqual(CLOUD_MIN_POINTS);
      expect(pointCount, characterId).toBeLessThanOrEqual(CLOUD_MAX_POINTS);

      const decoded = decodePointCloud(cloud);
      expect(decoded.points.length, characterId).toBe(bytes.byteLength);
      for (let index = 0; index < decoded.points.length; index += 3) {
        const x = decoded.points[index] ?? Number.NaN;
        const y = decoded.points[index + 1] ?? Number.NaN;
        const brightness = decoded.points[index + 2] ?? Number.NaN;
        expect(x, `${characterId} 点 ${index / 3} 的 x`).toBeGreaterThanOrEqual(0);
        expect(x, `${characterId} 点 ${index / 3} 的 x`).toBeLessThanOrEqual(1);
        expect(y, `${characterId} 点 ${index / 3} 的 y`).toBeGreaterThanOrEqual(0);
        expect(y, `${characterId} 点 ${index / 3} 的 y`).toBeLessThanOrEqual(1);
        expect(brightness, `${characterId} 点 ${index / 3} 的亮度`).toBeGreaterThanOrEqual(0);
        expect(brightness, `${characterId} 点 ${index / 3} 的亮度`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("点云单文件不超过 64KB", async () => {
    let totalBytes = 0;

    for (const [, entry] of entries) {
      if (!entry.cloud) continue;
      const bytes = await readFile(localPath(entry.cloud));
      expect(bytes.byteLength, entry.cloud).toBeLessThanOrEqual(CLOUD_MAX_BYTES);
      totalBytes += bytes.byteLength;
    }

    expect(totalBytes).toBeGreaterThan(0);
  });

  it("head 为 224×224 WebP，portrait 为 1128×1536 WebP", async () => {
    for (const [characterId, entry] of entries) {
      const head = await sharp(localFilePath(entry.head)).metadata();
      expect(head.format, characterId).toBe("webp");
      expect([head.width, head.height], characterId).toEqual([HEAD_SIZE, HEAD_SIZE]);
    }

    for (const [, entry] of entries) {
      if (!entry.portrait) continue;
      const portrait = await sharp(localFilePath(entry.portrait)).metadata();
      expect(portrait.format).toBe("webp");
      expect([portrait.width, portrait.height]).toEqual([PORTRAIT_WIDTH, PORTRAIT_HEIGHT]);
    }
  });

  it("回放雪碧图是 head 的合成图，格子覆盖全部头像", async () => {
    const sprite = index.sprite;
    if (!sprite) throw new Error("index.json 缺少 sprite");

    expect(sprite.path.startsWith(`${ART_PREFIX}replay-sprite-`)).toBe(true);
    expect(sprite.path.endsWith(".webp")).toBe(true);

    // 每个有 head 的角色都要有一个格序号，且是行优先、从 0 开始连续的。
    const headIds = entries
      .filter(([, entry]) => entry.head)
      .map(([id]) => id)
      .sort();
    expect(Object.keys(sprite.cells).sort()).toEqual(headIds);
    expect([...Object.values(sprite.cells)].sort((a, b) => a - b)).toEqual(
      headIds.map((_, position) => position),
    );

    const meta = await sharp(localFilePath(sprite.path)).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(sprite.columns * sprite.size);
    expect(meta.height).toBe(sprite.rows * sprite.size);
  });

  it("索引引用的素材都已按原样登记进 manifest", async () => {
    const referenced = new Set(
      entries.flatMap(([, entry]) => {
        const paths = [entry.head];
        if (entry.portrait) paths.push(entry.portrait);
        if (entry.cloud) paths.push(entry.cloud);
        return paths;
      }),
    );
    referenced.add(`${ART_PREFIX}index.json`);
    // 回放雪碧图也是索引引用的素材，同样要登记；它是整批 head 的合成图，不属于任何单个角色。
    if (index.sprite) referenced.add(index.sprite.path);

    for (const path of referenced) {
      const file = manifestFiles.find((candidate) => candidate.path === path);

      if (!file) throw new Error(`manifest 缺少 character-art 素材：${path}`);

      const bytes = await readFile(localPath(path));
      expect(bytes.byteLength, path).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), path).toBe(file.sha256);
      // 带 width 的条目会被 assets:build 当作响应式变体重建，这里必须保持无 width。
      expect(file.width, path).toBeUndefined();
      expect(file.roles, path).toContain("character-art");
      expect(file.roles, path).toContain("fallback");
    }

    const orphans = manifestFiles.filter(
      (file) => file.path.startsWith(ART_PREFIX) && !referenced.has(file.path),
    );
    expect(orphans.map((file) => file.path)).toEqual([]);
  });

  it("高清图体积在预算内", async () => {
    let headBytes = 0;
    let portraitBytes = 0;

    for (const [, entry] of entries) {
      const head = await readFile(localPath(entry.head));
      expect(head.byteLength, entry.head).toBeLessThanOrEqual(HEAD_MAX_BYTES);
      headBytes += head.byteLength;

      if (!entry.portrait) continue;

      const portrait = await readFile(localPath(entry.portrait));
      expect(portrait.byteLength, entry.portrait).toBeLessThanOrEqual(PORTRAIT_MAX_BYTES);
      portraitBytes += portrait.byteLength;
    }

    expect(headBytes).toBeLessThanOrEqual(HEAD_TOTAL_BUDGET);
    expect(portraitBytes).toBeLessThanOrEqual(PORTRAIT_TOTAL_BUDGET);
  });
});
