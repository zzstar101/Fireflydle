import type { ContentManifest } from "@fireflydle/contracts";
import { aeonManifest, currencyWarsManifest, npcManifest } from "@fireflydle/game-data";

export type SpecialModeId = "npc" | "currency-wars" | "aeon";
export type SpecialModePackInspection = "ready" | "missing" | "unsupported";

interface SpecialModePackDefinition {
  modeId: SpecialModeId;
  version: string;
  cacheName: string;
  metadataPath: string;
  assets: readonly string[];
  manifest: ContentManifest;
}

const CACHE_PREFIX = "fireflydle-mode-";

function assetPaths(manifest: ContentManifest): string[] {
  const paths = new Set<string>();
  for (const entity of manifest.entities) {
    if (!("assets" in entity.payload)) continue;
    const assets = entity.payload.assets;
    if ("avatarPath" in assets) paths.add(assets.avatarPath);
    if ("portraitPath" in assets) paths.add(assets.portraitPath);
    if ("imagePath" in assets) paths.add(assets.imagePath);
  }
  if (manifest.currencyWars) {
    for (const unit of manifest.currencyWars.units) {
      paths.add(unit.assets.avatarPath);
      paths.add(unit.assets.portraitPath);
    }
  }
  return [...paths].sort();
}

function manifestFor(modeId: SpecialModeId): ContentManifest {
  if (modeId === "npc") return npcManifest;
  if (modeId === "currency-wars") return currencyWarsManifest;
  return aeonManifest;
}

export function specialModePackDefinition(modeId: SpecialModeId): SpecialModePackDefinition {
  const manifest = manifestFor(modeId);
  const encodedVersion = encodeURIComponent(manifest.manifestVersion);
  return {
    modeId,
    version: manifest.manifestVersion,
    cacheName: `${CACHE_PREFIX}${modeId}-${encodedVersion}`,
    metadataPath: `/__fireflydle/offline-packs/${modeId}/${encodedVersion}.json`,
    assets: assetPaths(manifest),
    manifest,
  };
}

function supportsModePacks(): boolean {
  return typeof caches !== "undefined" && typeof Response !== "undefined";
}

export async function inspectSpecialModePack(
  modeId: SpecialModeId,
): Promise<SpecialModePackInspection> {
  if (!supportsModePacks()) return "unsupported";
  const definition = specialModePackDefinition(modeId);
  const cacheNames = await caches.keys();
  if (!cacheNames.includes(definition.cacheName)) return "missing";
  const cache = await caches.open(definition.cacheName);
  const entries = await Promise.all([
    cache.match(definition.metadataPath),
    ...definition.assets.map((asset) => cache.match(asset)),
  ]);
  return entries.every(Boolean) ? "ready" : "missing";
}

export async function prepareSpecialModePack(modeId: SpecialModeId): Promise<void> {
  if (!supportsModePacks()) throw new Error("当前浏览器不支持离线包");
  if ((await inspectSpecialModePack(modeId)) === "ready") return;

  const definition = specialModePackDefinition(modeId);
  await caches.delete(definition.cacheName);
  const cache = await caches.open(definition.cacheName);
  try {
    await cache.addAll(definition.assets);
    await cache.put(
      definition.metadataPath,
      new Response(
        JSON.stringify({
          modeId,
          manifestVersion: definition.version,
          manifest: definition.manifest,
          assets: definition.assets,
        }),
        { headers: { "content-type": "application/json; charset=utf-8" } },
      ),
    );
  } catch (error) {
    await caches.delete(definition.cacheName);
    throw error;
  }

  const cacheNames = await caches.keys();
  const oldModeCaches = cacheNames.filter(
    (name) => name.startsWith(`${CACHE_PREFIX}${modeId}-`) && name !== definition.cacheName,
  );
  await Promise.all(oldModeCaches.map((name) => caches.delete(name)));
}
