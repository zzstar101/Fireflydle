export type SpecialModeId = "currency-wars" | "aeon";
export type SpecialModePackInspection = "ready" | "missing" | "unsupported";

export interface SpecialModePackDefinition {
  modeId: SpecialModeId;
  version: string;
  cacheName: string;
  metadataPath: string;
}

const CACHE_PREFIX = "fireflydle-mode-";
const PACK_VERSIONS: Record<SpecialModeId, string> = {
  "currency-wars": "1.1.1",
  aeon: "1.0.1",
};

export function specialModePackDefinition(modeId: SpecialModeId): SpecialModePackDefinition {
  const version = PACK_VERSIONS[modeId];
  const encodedVersion = encodeURIComponent(version);
  return {
    modeId,
    version,
    cacheName: `${CACHE_PREFIX}${modeId}-${encodedVersion}`,
    metadataPath: `/__fireflydle/offline-packs/${modeId}/${encodedVersion}.json`,
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
  const metadataResponse = await cache.match(definition.metadataPath);
  if (!metadataResponse) return "missing";
  try {
    const metadata = (await metadataResponse.json()) as { assets?: unknown };
    if (!Array.isArray(metadata.assets)) return "missing";
    const entries = await Promise.all(
      metadata.assets.map((asset) =>
        typeof asset === "string" ? cache.match(asset) : Promise.resolve(undefined),
      ),
    );
    return entries.every(Boolean) ? "ready" : "missing";
  } catch {
    return "missing";
  }
}

export async function prepareSpecialModePack(modeId: SpecialModeId): Promise<void> {
  const downloader = await import("./special-mode-pack-download");
  await downloader.downloadSpecialModePack(modeId);
}
