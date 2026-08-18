import { readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";

import { CharacterSchema } from "../packages/contracts/src/index.ts";
import { buildPlayableManifest } from "../packages/game-data/src/content-manifest.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const charactersPath = join(root, "packages", "game-data", "src", "generated", "characters.json");
const manifestPath = join(
  root,
  "packages",
  "game-data",
  "src",
  "generated",
  "content-manifest.json",
);

const characters = CharacterSchema.array().parse(
  JSON.parse(await readFile(charactersPath, "utf8")),
);
const manifest = buildPlayableManifest(characters);
const text = await prettierFormat(`${JSON.stringify(manifest, null, 2)}\n`, {
  parser: "json",
  printWidth: 100,
  trailingComma: "all",
});

/** 先写同目录临时文件，再替换目标，避免生成中断留下半份 manifest。 */
async function writeAtomic(path: string, content: string): Promise<void> {
  const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, content, "utf8");
  const backup = `${path}.${process.pid}.backup`;
  let existed = false;
  try {
    await stat(path);
    existed = true;
    await rename(path, backup);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    await rename(temporary, path);
    if (existed) await unlink(backup);
  } catch (error) {
    try {
      await unlink(temporary);
    } catch {
      // 临时文件不存在时无需清理。
    }
    if (existed) await rename(backup, path);
    throw error;
  }
}

await writeAtomic(manifestPath, text);
console.log(`内容 manifest 已生成：${manifestPath}`);
