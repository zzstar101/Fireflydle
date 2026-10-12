import { useQuery } from "@tanstack/react-query";
import { assetUrl } from "./asset-url";

/** scripts/generate-character-art.ts 产出的索引：超分后的头像、半身立绘与回放雪碧图。 */
interface CharacterArtIndex {
  version: 1;
  characters: Record<string, { head: string; portrait: string | null; cloud: string | null }>;
  sprite: CharacterSprite | null;
}

/**
 * 推理回放用的头像雪碧图。回放要同时铺开 90+ 个候选头像，逐张请求会打出近百次往返，
 * 所以构建期把它们拼成一张图，前端只用一个 `background-position` 取格子。
 */
export interface CharacterSprite {
  /** 已经过 assetUrl() 的雪碧图地址。 */
  path: string;
  /** 单格边长（源图像素）。 */
  size: number;
  columns: number;
  rows: number;
  /** characterId → 行优先的格序号。 */
  cells: Record<string, number>;
}

/**
 * 构建期算好的立绘点云（`<id>-cloud-<hash>.json`）。
 *
 * 编码是 `u8-xyb`：每 3 个字节一个点，x / y 是 0..255 的网格坐标，
 * 第三个字节是亮度。三个字节都除以 255 归一到 `[0, 1]`，`points` 是扁平的
 * `[x0, y0, b0, x1, y1, b1, …]`，直接可以喂给 GPU。
 */
export interface CharacterPointCloud {
  version: 1;
  width: number;
  height: number;
  stride: 3;
  encoding: "u8-xyb";
  /** 归一化后的点：每 3 个浮点一个点（x, y, brightness）。 */
  points: Float32Array;
}

const CLOUD_ENCODING = "u8-xyb";
const CLOUD_STRIDE = 3;

async function loadCharacterArtIndex(): Promise<CharacterArtIndex> {
  const response = await fetch(assetUrl("/assets/character-art/index.json"));
  if (!response.ok) throw new Error(`character-art index ${response.status}`);
  return (await response.json()) as CharacterArtIndex;
}

/** 返回角色的高清立绘 URL；索引缺失或该角色没有立绘时为 null（调用方回退到头像）。 */
export function useCharacterPortrait(characterId: string | null | undefined): string | null {
  const { data } = useQuery({
    queryKey: ["character-art-index"],
    queryFn: loadCharacterArtIndex,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    enabled: Boolean(characterId),
  });
  if (!characterId || !data) return null;
  const portrait = data.characters[characterId]?.portrait;
  return portrait ? assetUrl(portrait) : null;
}

/** 返回角色立绘点云的资源路径；没有立绘（因此也没有点云）时为 null。 */
export function useCharacterPointCloudPath(characterId: string | null | undefined): string | null {
  const { data } = useQuery({
    queryKey: ["character-art-index"],
    queryFn: loadCharacterArtIndex,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    enabled: Boolean(characterId),
  });
  if (!characterId || !data) return null;
  const cloud = data.characters[characterId]?.cloud;
  return cloud ? assetUrl(cloud) : null;
}

/** 返回回放用的头像雪碧图；索引缺失或没有雪碧图时为 null（调用方回退到逐个头像）。 */
export function useCharacterSprite(): CharacterSprite | null {
  const { data } = useQuery({
    queryKey: ["character-art-index"],
    queryFn: loadCharacterArtIndex,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  const sprite = data?.sprite;
  if (
    !sprite ||
    typeof sprite.path !== "string" ||
    typeof sprite.size !== "number" ||
    typeof sprite.columns !== "number" ||
    typeof sprite.rows !== "number" ||
    !sprite.cells ||
    sprite.columns <= 0 ||
    sprite.rows <= 0 ||
    sprite.size <= 0
  ) {
    return null;
  }
  return {
    path: assetUrl(sprite.path),
    size: sprite.size,
    columns: sprite.columns,
    rows: sprite.rows,
    cells: sprite.cells,
  };
}

/**
 * 把 `u8-xyb` 点云转成 fx 层要的「二元组 + 长宽比」。
 * 亮度字节暂时丢掉：fx 的着色器自己按种子做闪烁，比静态亮度更贴合星尘质感。
 */
export function toFxPointCloud(cloud: CharacterPointCloud): {
  aspect: number;
  points: Float32Array;
} {
  const count = Math.floor(cloud.points.length / 3);
  const points = new Float32Array(count * 2);
  for (let index = 0; index < count; index += 1) {
    points[index * 2] = cloud.points[index * 3] ?? 0;
    points[index * 2 + 1] = cloud.points[index * 3 + 1] ?? 0;
  }
  return { aspect: cloud.width / cloud.height, points };
}

/** `atob` → `Uint8Array`，只依赖标准库，避免在浏览器里引 Buffer。 */
function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * 加载并解码某个角色的点云。
 *
 * 任何失败（网络错误、JSON 损坏、编码不认识、字节数不是 3 的整数倍）都返回 null，
 * 调用方可以静默回退到「直接淡入真实立绘」。
 */
export async function loadCharacterPointCloud(
  cloudPath: string,
): Promise<CharacterPointCloud | null> {
  try {
    const response = await fetch(assetUrl(cloudPath));
    if (!response.ok) return null;
    const raw = (await response.json()) as Partial<CharacterPointCloud> & { points?: string };
    if (
      raw.encoding !== CLOUD_ENCODING ||
      raw.stride !== CLOUD_STRIDE ||
      typeof raw.points !== "string" ||
      typeof raw.width !== "number" ||
      typeof raw.height !== "number" ||
      raw.width < 2 ||
      raw.height < 2
    ) {
      return null;
    }

    const bytes = decodeBase64(raw.points);
    if (bytes.byteLength === 0 || bytes.byteLength % CLOUD_STRIDE !== 0) return null;

    const points = new Float32Array(bytes.byteLength);
    for (let index = 0; index < bytes.byteLength; index += CLOUD_STRIDE) {
      // `noUncheckedIndexedAccess` 会把逐字节取值判成可能 undefined；循环上界保证三个字节都存在。
      const x = bytes[index] ?? 0;
      const y = bytes[index + 1] ?? 0;
      const brightness = bytes[index + 2] ?? 0;
      points[index] = x / 255;
      points[index + 1] = y / 255;
      points[index + 2] = brightness / 255;
    }

    return {
      version: 1,
      width: raw.width,
      height: raw.height,
      stride: 3,
      encoding: CLOUD_ENCODING,
      points,
    };
  } catch {
    return null;
  }
}
