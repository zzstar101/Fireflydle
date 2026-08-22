import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const swPath = join(root, "apps", "web", "dist", "sw.js");
const configured =
  process.env.VITE_ASSET_BASE_URL?.trim().replace(/\/+$/, "") || "https://assets.fireflydle.games";
const source = await readFile(swPath, "utf8");
await writeFile(swPath, source.replaceAll("__FIREFLYDLE_ASSET_BASE_URL__", configured), "utf8");
