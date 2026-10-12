import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const assetsDir = join(root, "apps", "web", "public", "assets");
const manifestPath = join(assetsDir, "manifest.json");

type ManifestFile = { path: string; bytes: number; sha256: string; mimeType: string };
type AssetManifest = { files: ManifestFile[] };

const expectedMime: Record<string, string> = {
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as AssetManifest;
if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
  throw new Error("assets/manifest.json 没有可发布素材。");
}

const seen = new Set<string>();
for (const entry of manifest.files) {
  if (seen.has(entry.path)) throw new Error(`manifest 存在重复路径：${entry.path}`);
  seen.add(entry.path);
  if (!entry.path.startsWith("/assets/") || entry.path.includes("..")) {
    throw new Error(`manifest 路径必须是安全的逻辑路径：${entry.path}`);
  }
  const localPath = join(assetsDir, entry.path.slice("/assets/".length));
  const contents = await readFile(localPath).catch(() => null);
  if (!contents) throw new Error(`manifest 引用的本地素材不存在：${entry.path}`);
  const digest = createHash("sha256").update(contents).digest("hex");
  if (contents.byteLength !== entry.bytes || digest !== entry.sha256) {
    throw new Error(`素材校验失败：${entry.path}`);
  }
  const mime = expectedMime[extname(entry.path).toLowerCase()];
  if (mime && mime !== entry.mimeType) throw new Error(`素材 MIME 不匹配：${entry.path}`);
}

const CHARACTER_ART_PREFIX = "/assets/character-art/";
const characterArtIndexPath = join(assetsDir, "character-art", "index.json");
const characterArtIndexLogicalPath = `${CHARACTER_ART_PREFIX}index.json`;

type CharacterArtIndex = {
  version?: unknown;
  characters?: Record<string, { head?: unknown; portrait?: unknown; cloud?: unknown }>;
  sprite?: { path?: unknown } | null;
};

const characterArtIndexText = await readFile(characterArtIndexPath, "utf8").catch(() => null);

if (!characterArtIndexText) {
  console.warn("未找到 character-art/index.json，跳过高清角色图索引校验。");
} else {
  let index: CharacterArtIndex;

  try {
    index = JSON.parse(characterArtIndexText) as CharacterArtIndex;
  } catch (error) {
    throw new Error(
      `character-art/index.json 无法解析：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (index.version !== 1) {
    throw new Error(`character-art/index.json version 必须是 1：${String(index.version)}`);
  }

  if (
    !index.characters ||
    typeof index.characters !== "object" ||
    Array.isArray(index.characters)
  ) {
    throw new Error("character-art/index.json 缺少 characters 对象。");
  }

  const referenced = new Set<string>();
  let portraitCount = 0;
  let cloudCount = 0;

  for (const [characterId, entry] of Object.entries(index.characters)) {
    if (typeof entry?.head !== "string" || !entry.head.startsWith(CHARACTER_ART_PREFIX)) {
      throw new Error(`character-art/index.json 的 head 非法：${characterId}`);
    }

    if (!entry.head.endsWith(".webp") || !entry.head.includes(`/${characterId}-head-`)) {
      throw new Error(`character-art/index.json 的 head 命名不符合约定：${entry.head}`);
    }

    referenced.add(entry.head);

    // 立绘点云（结算揭晓用）与立绘同生共死：没有立绘的角色不会有 point cloud。
    if (entry.cloud !== null && entry.cloud !== undefined) {
      if (typeof entry.cloud !== "string" || !entry.cloud.startsWith(CHARACTER_ART_PREFIX)) {
        throw new Error(`character-art/index.json 的 cloud 非法：${characterId}`);
      }

      if (!entry.cloud.endsWith(".json") || !entry.cloud.includes(`/${characterId}-cloud-`)) {
        throw new Error(`character-art/index.json 的 cloud 命名不符合约定：${entry.cloud}`);
      }

      referenced.add(entry.cloud);
      cloudCount += 1;
    }

    if (entry.portrait === null) continue;

    if (typeof entry.portrait !== "string" || !entry.portrait.startsWith(CHARACTER_ART_PREFIX)) {
      throw new Error(`character-art/index.json 的 portrait 非法：${characterId}`);
    }

    if (
      !entry.portrait.endsWith(".webp") ||
      !entry.portrait.includes(`/${characterId}-portrait-`)
    ) {
      throw new Error(`character-art/index.json 的 portrait 命名不符合约定：${entry.portrait}`);
    }

    referenced.add(entry.portrait);
    portraitCount += 1;
  }

  // 推理回放的头像雪碧图（可选）：一张图替代近百个头像请求。
  if (index.sprite !== null && index.sprite !== undefined) {
    const spritePath = index.sprite.path;

    if (typeof spritePath !== "string" || !spritePath.startsWith(CHARACTER_ART_PREFIX)) {
      throw new Error(`character-art/index.json 的 sprite.path 非法：${String(spritePath)}`);
    }

    if (!spritePath.endsWith(".webp") || !spritePath.includes("/replay-sprite-")) {
      throw new Error(`character-art/index.json 的 sprite 命名不符合约定：${spritePath}`);
    }

    referenced.add(spritePath);
  }

  // index.json 是前端加载入口，必须登记以便上传 R2。
  const manifestPaths = new Set(manifest.files.map((file) => file.path));

  if (!manifestPaths.has(characterArtIndexLogicalPath)) {
    throw new Error(`character-art/index.json 未登记到 manifest：${characterArtIndexLogicalPath}`);
  }

  // 索引引用到的素材必须在 manifest 中登记，否则不会被上传。
  for (const path of referenced) {
    if (!manifestPaths.has(path)) {
      throw new Error(`character-art/index.json 引用的素材未登记到 manifest：${path}`);
    }
  }

  // manifest 中登记的 character-art 素材必须都被索引引用，避免上传孤儿文件。
  const orphan = manifest.files.find(
    (file) =>
      file.path.startsWith(CHARACTER_ART_PREFIX) &&
      file.path !== characterArtIndexLogicalPath &&
      !referenced.has(file.path),
  );

  if (orphan) {
    throw new Error(`manifest 中存在未被索引引用的 character-art 素材：${orphan.path}`);
  }

  console.log(
    `角色高清图索引校验通过：${Object.keys(index.characters).length} 个角色，其中 ${portraitCount} 个有立绘、${cloudCount} 个有立绘点云。`,
  );
}

const manifestStat = await stat(manifestPath);
if (manifestStat.size === 0) throw new Error("assets/manifest.json 为空。");
console.log(`素材校验通过：${manifest.files.length} 个文件。`);
