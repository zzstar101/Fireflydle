import { gzipSync } from "node:zlib";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

interface ManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

const dist = join(import.meta.dir, "..", "apps", "web", "dist");
const html = readFileSync(join(dist, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(dist, ".vite", "manifest.json"), "utf8")) as Record<
  string,
  ManifestEntry
>;

function fail(message: string): never {
  throw new Error(`Web 发布预算失败：${message}`);
}

function staticClosure(startKeys: readonly string[]): Set<string> {
  const visited = new Set<string>();
  const pending = [...startKeys];
  while (pending.length > 0) {
    const key = pending.pop()!;
    if (visited.has(key)) continue;
    const entry = manifest[key];
    if (!entry) fail(`manifest 缺少 ${key}`);
    visited.add(key);
    pending.push(...(entry.imports ?? []));
  }
  return visited;
}

const initialFiles = [...html.matchAll(/(?:src|href)="\/(assets\/[^\"]+\.(?:js|css))"/g)].map(
  (match) => match[1]!,
);
const initialJs = [...new Set(initialFiles.filter((file) => file.endsWith(".js")))];
const initialCss = [...new Set(initialFiles.filter((file) => file.endsWith(".css")))];

function totalBytes(files: readonly string[]): number {
  return files.reduce((total, file) => total + statSync(join(dist, file)).size, 0);
}

function totalGzipBytes(files: readonly string[]): number {
  return files.reduce(
    (total, file) => total + gzipSync(readFileSync(join(dist, file))).byteLength,
    0,
  );
}

const mainKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry);
const hubKey = Object.keys(manifest).find((key) => key.endsWith("/features/hub/HubPage.tsx"));
if (!mainKey || !hubKey) fail("无法定位 main 或 Hub 构建入口");
const firstScreenClosure = staticClosure([mainKey, hubKey]);
const firstScreenSources = [...firstScreenClosure].join("\n");
const forbiddenSources = [
  "NpcModePages",
  "CurrencyWarsModePages",
  "AeonModePages",
  "AeonGuessBoard",
  "special-mode-pack-download",
  "MarkdownContent",
  "AdminPage",
  "share-result-image",
];
for (const source of forbiddenSources) {
  if (firstScreenSources.includes(source)) fail(`首屏静态闭包包含 ${source}`);
}

const initialCode = initialJs.map((file) => readFileSync(join(dist, file), "utf8")).join("\n");
for (const marker of ["currency-wars-targets", "npc-targets", "sourceAssetUrl"]) {
  if (initialCode.includes(marker)) fail(`入口产物包含特殊模式标记 ${marker}`);
}

const initialJsBytes = totalBytes(initialJs);
const initialJsGzipBytes = totalGzipBytes(initialJs);
const initialCssBytes = totalBytes(initialCss);
if (initialJsBytes > 560_000) fail(`初始 JS ${initialJsBytes} B 超过 560000 B`);
if (initialJsGzipBytes > 165_000) fail(`初始 JS gzip ${initialJsGzipBytes} B 超过 165000 B`);
if (initialCssBytes > 25_000) fail(`初始 CSS ${initialCssBytes} B 超过 25000 B`);
if (initialJs.length > 28) fail(`初始 JS 请求数 ${initialJs.length} 超过 28`);

const dynamicSources = Object.entries(manifest)
  .filter(([, entry]) => entry.isDynamicEntry)
  .map(([key]) => key);
for (const modeEntry of ["NpcModePages", "CurrencyWarsModePages", "AeonModePages"]) {
  if (!dynamicSources.some((source) => source.includes(modeEntry))) {
    fail(`${modeEntry} 未形成动态入口`);
  }
}

console.log(
  JSON.stringify(
    {
      initialJsRequests: initialJs.length,
      initialJsBytes,
      initialJsGzipBytes,
      initialCssBytes,
      firstScreenChunks: firstScreenClosure.size,
      dynamicModeEntries: dynamicSources.filter((source) => source.includes("ModePages")),
    },
    null,
    2,
  ),
);
