import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

interface ManifestEntry {
  file: string;
  css?: string[];
  assets?: string[];
}

const dist = join(resolve(import.meta.dir, ".."), "apps", "web", "dist");
const html = await readFile(join(dist, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(join(dist, ".vite", "manifest.json"), "utf8")) as Record<
  string,
  ManifestEntry
>;

const referencedFiles = new Set<string>();
for (const entry of Object.values(manifest)) {
  referencedFiles.add(entry.file);
  for (const file of entry.css ?? []) referencedFiles.add(file);
  for (const file of entry.assets ?? []) referencedFiles.add(file);
}
for (const match of html.matchAll(/(?:src|href)=["']\/([^"'?#]+)[^"']*["']/g)) {
  referencedFiles.add(match[1]!);
}

const missingFiles: string[] = [];
for (const file of referencedFiles) {
  try {
    if (!(await stat(join(dist, file))).isFile()) missingFiles.push(file);
  } catch {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  throw new Error(`Web 发布产物不完整，缺少文件：\n${missingFiles.sort().join("\n")}`);
}

console.log(`Web 发布产物完整性检查通过：${referencedFiles.size} 个引用文件均存在。`);
