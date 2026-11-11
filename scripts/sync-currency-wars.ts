import { readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";

import { CharacterSchema, ContentManifestSchema } from "../packages/contracts/src/index.ts";

interface CurrencyWarsSource {
  gameVersion: string;
  capturedAt: string;
  source: { url: string; revision: string };
  traits: Array<{
    id: string;
    names: { "zh-CN": string; en: string; ja: string };
    type: "faction" | "school" | "independent";
  }>;
  units: Array<{
    characterId: string;
    avatarId: number;
    roleIds: number[];
    cost: number | number[];
    position: "front" | "back" | "front-back";
    traitIds: string[];
    displayName?: string;
  }>;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(
  root,
  "packages",
  "game-data",
  "src",
  "data",
  "currency-wars-4.7-source.json",
);
const charactersPath = join(root, "packages", "game-data", "src", "generated", "characters.json");
const manifestPath = join(
  root,
  "packages",
  "game-data",
  "src",
  "data",
  "currency-wars-manifest.json",
);

const source = JSON.parse(await readFile(sourcePath, "utf8")) as CurrencyWarsSource;
const characters = CharacterSchema.array().parse(
  JSON.parse(await readFile(charactersPath, "utf8")),
);
const characterById = new Map(characters.map((character) => [character.id, character]));
const traitIds = new Set(source.traits.map((trait) => trait.id));

if (source.units.length !== 60) {
  throw new Error(`4.7 货币战争应有 60 个可玩单位，实际 ${source.units.length}`);
}
if (new Set(source.units.map((unit) => unit.characterId)).size !== source.units.length) {
  throw new Error("货币战争来源中存在重复角色");
}

const units = source.units
  .map((unit) => {
    const character = characterById.get(unit.characterId);
    if (!character) throw new Error(`找不到货币战争角色：${unit.characterId}`);
    if (unit.traitIds.some((traitId) => !traitIds.has(traitId))) {
      throw new Error(`${unit.characterId} 引用了未知羁绊`);
    }
    return {
      id: `cw-${character.id}`,
      names: unit.displayName ? { ...character.names, "zh-CN": unit.displayName } : character.names,
      aliases: character.aliases,
      source: source.source,
      reviewStatus: "approved" as const,
      cost: unit.cost,
      position: unit.position,
      synergies: unit.traitIds,
      assets: {
        avatarPath: character.assets.avatarPath,
        portraitPath: character.assets.portraitPath,
        sha256: character.assets.sha256,
        rightsNotice: "仅用于游戏内题目展示",
      },
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id));

const existing = ContentManifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
const mode = existing.modes.find((entry) => entry.id === "currency-wars");
if (!mode) throw new Error("现有 manifest 缺少 currency-wars 模式");
const ids = units.map((unit) => unit.id);

const manifest = {
  ...existing,
  manifestVersion: "2.0.0",
  generatedAt: source.capturedAt,
  modes: existing.modes.map((entry) =>
    entry.id === "currency-wars" ? { ...entry, rulesVersion: "2.0.0" } : entry,
  ),
  pools: existing.pools.map((pool) =>
    pool.modeId === "currency-wars" ? { ...pool, targetIds: ids, candidateIds: ids } : pool,
  ),
  currencyWars: {
    id: "currency-wars-gridfight-4-7",
    gameVersion: source.gameVersion,
    capturedAt: source.capturedAt,
    source: source.source,
    rulesVersion: "2.0.0",
    synergyDefinitions: source.traits.map((trait) => ({
      id: trait.id,
      names: trait.names,
      type: trait.type,
    })),
    units,
  },
};

ContentManifestSchema.parse(manifest);

const text = await prettierFormat(`${JSON.stringify(manifest, null, 2)}\n`, {
  parser: "json",
  printWidth: 100,
});

async function writeAtomic(path: string, content: string): Promise<void> {
  const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, content, "utf8");
  await rename(temporary, path);
  await unlink(temporary).catch(() => undefined);
}

await stat(manifestPath);
await writeAtomic(manifestPath, text);
console.log(`货币战争 4.7 manifest 已生成：${units.length} 个单位，${source.traits.length} 个羁绊`);
