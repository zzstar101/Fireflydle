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

const manifestStat = await stat(manifestPath);
if (manifestStat.size === 0) throw new Error("assets/manifest.json 为空。");
console.log(`素材校验通过：${manifest.files.length} 个文件。`);
