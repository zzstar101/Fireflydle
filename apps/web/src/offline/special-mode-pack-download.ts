import type { ContentManifest } from "@fireflydle/contracts";
import {
  inspectSpecialModePack,
  specialModePackDefinition,
  type SpecialModeId,
} from "./special-mode-pack";

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

async function loadManifest(modeId: SpecialModeId): Promise<ContentManifest> {
  if (modeId === "npc") return (await import("@fireflydle/game-data/npc")).npcManifest;
  if (modeId === "currency-wars") {
    return (await import("@fireflydle/game-data/currency-wars")).currencyWarsManifest;
  }
  return (await import("@fireflydle/game-data/aeon")).aeonManifest;
}

export async function downloadSpecialModePack(modeId: SpecialModeId): Promise<void> {
  if (typeof caches === "undefined" || typeof Response === "undefined") {
    throw new Error("当前浏览器不支持离线包");
  }
  if ((await inspectSpecialModePack(modeId)) === "ready") return;

  const definition = specialModePackDefinition(modeId);
  const manifest = await loadManifest(modeId);
  if (manifest.manifestVersion !== definition.version) {
    throw new Error(`离线包版本未同步：${modeId}`);
  }
  const assets = assetPaths(manifest);
  await caches.delete(definition.cacheName);
  const cache = await caches.open(definition.cacheName);
  try {
    await cache.addAll(assets);
    await cache.put(
      definition.metadataPath,
      new Response(
        JSON.stringify({
          modeId,
          manifestVersion: definition.version,
          manifest,
          assets,
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
    (name) => name.startsWith(`fireflydle-mode-${modeId}-`) && name !== definition.cacheName,
  );
  await Promise.all(oldModeCaches.map((name) => caches.delete(name)));
}
