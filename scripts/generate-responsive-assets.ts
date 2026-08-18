import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format as prettierFormat } from "prettier";

import { generateResponsiveVariants } from "./responsive-assets.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "apps", "web", "public");
const assetsDir = join(publicDir, "assets");
const charactersDir = join(assetsDir, "characters");
const manifestPath = join(assetsDir, "manifest.json");
const charactersPath = join(root, "packages", "game-data", "src", "generated", "characters.json");

type ManifestFile = {
  bytes: number;
  format?: string;
  mimeType: string;
  path: string;
  roles: string[];
  sha256: string;
  sourceKind: string;
  sourceUrl: string;
  width?: number;
};

type Manifest = {
  schemaVersion: number;
  asOf: string;
  sourceRevision: string;
  rightsNotice: string;
  policy: string;
  files: ManifestFile[];
};

type Character = {
  assets: {
    avatarPath: string;
    portraitPath: string;
    [key: string]: unknown;
  };
};

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function atomicWrite(path: string, content: string | Uint8Array): Promise<void> {
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, content);
  await rename(temporary, path);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
const characters = JSON.parse(await readFile(charactersPath, "utf8")) as Character[];
const baseFiles = manifest.files.filter((file) => !file.width && file.roles.includes("avatar"));
if (baseFiles.length !== characters.length) {
  throw new Error(
    `头像基线数量不匹配：manifest=${baseFiles.length}, characters=${characters.length}`,
  );
}

const variantFiles: ManifestFile[] = [];
for (const character of characters) {
  const base = manifest.files.find((file) => file.path === character.assets.avatarPath);
  if (!base) throw new Error(`角色头像未在 manifest 中找到：${character.assets.avatarPath}`);
  const sourcePath = join(publicDir, base.path.replace(/^\//, ""));
  const source = await readFile(sourcePath);
  if (source.byteLength !== base.bytes || sha256(source) !== base.sha256) {
    throw new Error(`角色头像基线哈希不匹配：${base.path}`);
  }
  const variants = await generateResponsiveVariants(source);
  character.assets.responsive = variants.map((variant) => {
    const prefix = `${base.path
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "")}-${variant.width}`;
    const avifPath = `/assets/characters/${prefix}.avif`;
    const webpPath = `/assets/characters/${prefix}.webp`;
    return {
      width: variant.width,
      avifPath,
      webpPath,
      avifBytes: variant.avifBytes,
      webpBytes: variant.webpBytes,
      avifSha256: variant.avifSha256,
      webpSha256: variant.webpSha256,
    };
  });
  for (const variant of variants) {
    const prefix = `${base.path
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "")}-${variant.width}`;
    for (const [format, bytes, digest] of [
      ["avif", variant.avif, variant.avifSha256],
      ["webp", variant.webp, variant.webpSha256],
    ] as const) {
      const fileName = `${prefix}.${format}`;
      const target = join(charactersDir, fileName);
      await atomicWrite(target, bytes);
      variantFiles.push({
        bytes: bytes.byteLength,
        format,
        mimeType: format === "avif" ? "image/avif" : "image/webp",
        path: `/assets/characters/${fileName}`,
        roles: ["avatar", "responsive"],
        sha256: digest,
        sourceKind: base.sourceKind,
        sourceUrl: base.sourceUrl,
        width: variant.width,
      });
    }
  }
}

manifest.policy =
  "Each audited local thumbnail has deterministic 40/80/160px AVIF and WebP derivatives; the source PNG remains the final fallback.";
manifest.files = [
  ...manifest.files
    .filter((file) => file.width === undefined)
    .map((file) =>
      file.roles.includes("fallback") ? file : { ...file, roles: [...file.roles, "fallback"] },
    ),
  ...variantFiles,
].sort((left, right) => left.path.localeCompare(right.path));
const [charactersText, manifestText] = await Promise.all(
  [characters, manifest].map((value) =>
    prettierFormat(`${JSON.stringify(value, null, 2)}\n`, {
      parser: "json",
      printWidth: 100,
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    }),
  ),
);
await atomicWrite(charactersPath, charactersText);
await atomicWrite(manifestPath, manifestText);
await atomicWrite(
  join(assetsDir, "manifest.sha256"),
  `${sha256(new TextEncoder().encode(manifestText))}  manifest.json\n`,
);
console.log(`已生成 ${variantFiles.length} 个响应式头像变体。`);
