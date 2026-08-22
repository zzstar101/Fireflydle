import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const distAssets = join(resolve(import.meta.dir, ".."), "apps", "web", "dist", "assets");
for (const entry of await readdir(distAssets, { withFileTypes: true })) {
  if (entry.name === "manifest.json" || entry.name === "manifest.sha256") continue;
  await rm(join(distAssets, entry.name), { recursive: true, force: true });
}
console.log("已从 Pages 产物移除 R2 托管的游戏内容素材。");
