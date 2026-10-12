import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const publicAssets = join(root, "apps", "web", "public", "assets");
const distAssets = join(root, "apps", "web", "dist", "assets");

// 只移除由 public/assets 复制进产物的游戏素材，保留 Vite 生成的 JS 和 CSS。
// manifest.json / manifest.sha256 是前端解析素材的逻辑入口，必须留在 Pages 产物里。
const KEEP_ROOT_ENTRIES = new Set(["manifest.json", "manifest.sha256"]);
// character-art 的超分图片由 R2 托管，但索引体积很小，和 manifest 一样保留同源副本。
const KEEP_NESTED_ENTRIES = new Map([["character-art", new Set(["index.json"])]]);

for (const entry of await readdir(publicAssets, { withFileTypes: true })) {
  if (KEEP_ROOT_ENTRIES.has(entry.name)) continue;
  const keepNested = entry.isDirectory() ? KEEP_NESTED_ENTRIES.get(entry.name) : undefined;
  const target = join(distAssets, entry.name);
  if (keepNested) {
    // 以产物目录为准逐个删除，避免产物里残留 public/assets 之外的旧文件。
    const children = await readdir(target, { withFileTypes: true }).catch(() => []);
    for (const child of children) {
      if (keepNested.has(child.name)) continue;
      await rm(join(target, child.name), { recursive: true, force: true });
    }
    continue;
  }
  await rm(target, { recursive: true, force: true });
}
console.log("已从 Pages 产物移除 R2 托管的游戏内容素材。");
