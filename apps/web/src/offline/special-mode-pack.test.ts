import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  inspectSpecialModePack,
  prepareSpecialModePack,
  specialModePackDefinition,
} from "./special-mode-pack";
import { aeonManifest } from "@fireflydle/game-data/aeon";
import { currencyWarsManifest } from "@fireflydle/game-data/currency-wars";

class MemoryCache {
  readonly entries = new Map<string, Response>();

  async addAll(requests: readonly string[]) {
    for (const request of requests) {
      const response = await fetch(request);
      if (!response.ok) throw new TypeError(`无法缓存 ${request}`);
      this.entries.set(request, response.clone());
    }
  }

  async match(request: string) {
    return this.entries.get(request)?.clone();
  }

  async put(request: string, response: Response) {
    this.entries.set(request, response.clone());
  }
}

function memoryCacheStorage() {
  const stores = new Map<string, MemoryCache>();
  return {
    stores,
    api: {
      async delete(name: string) {
        return stores.delete(name);
      },
      async keys() {
        return [...stores.keys()];
      },
      async open(name: string) {
        const cache = stores.get(name) ?? new MemoryCache();
        stores.set(name, cache);
        return cache;
      },
    } as unknown as CacheStorage,
  };
}

describe("特殊模式离线包", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("asset", { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["currency-wars", currencyWarsManifest.manifestVersion],
    ["aeon", aeonManifest.manifestVersion],
  ] as const)("%s 轻量包版本与完整 manifest 同步", (modeId, version) => {
    expect(specialModePackDefinition(modeId).version).toBe(version);
  });

  it.each(["currency-wars", "aeon"] as const)(
    "%s 首次准备后完整可用，重复进入不重新获取",
    async (modeId) => {
      const storage = memoryCacheStorage();
      vi.stubGlobal("caches", storage.api);

      await expect(inspectSpecialModePack(modeId)).resolves.toBe("missing");
      await prepareSpecialModePack(modeId);
      await expect(inspectSpecialModePack(modeId)).resolves.toBe("ready");

      const callsAfterFirstEntry = vi.mocked(fetch).mock.calls.length;
      await prepareSpecialModePack(modeId);
      expect(fetch).toHaveBeenCalledTimes(callsAfterFirstEntry);
    },
  );

  it("manifest 变化时建立新包并清除该模式旧版本", async () => {
    const storage = memoryCacheStorage();
    vi.stubGlobal("caches", storage.api);
    const definition = specialModePackDefinition("currency-wars");
    storage.stores.set("fireflydle-mode-currency-wars-0.9.0", new MemoryCache());

    await prepareSpecialModePack("currency-wars");

    expect([...storage.stores.keys()]).toEqual([definition.cacheName]);
  });

  it("素材缺失时不把半包报告为可离线", async () => {
    const storage = memoryCacheStorage();
    vi.stubGlobal("caches", storage.api);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: RequestInfo | URL) =>
        String(request).includes("firefly")
          ? new Response("missing", { status: 404 })
          : new Response("asset", { status: 200 }),
      ),
    );

    await expect(prepareSpecialModePack("currency-wars")).rejects.toThrow();
    await expect(inspectSpecialModePack("currency-wars")).resolves.toBe("missing");
  });
});
