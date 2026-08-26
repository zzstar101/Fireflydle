import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const publicAssets = join(root, "apps", "web", "public", "assets");
const distAssets = join(root, "apps", "web", "dist", "assets");

// 只移除由 public/assets 复制进产物的游戏素材，保留 Vite 生成的 JS 和 CSS。
for (const entry of await readdir(publicAssets, { withFileTypes: true })) {
  if (entry.name === "manifest.json" || entry.name === "manifest.sha256") continue;
  await rm(join(distAssets, entry.name), { recursive: true, force: true });
}
console.log("已从 Pages 产物移除 R2 托管的游戏内容素材。");
