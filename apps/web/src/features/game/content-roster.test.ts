import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { characters, contentManifest } from "@fireflydle/game-data/playable";
import {
  contentRosterQueryKey,
  contentRosterQueryOptions,
  loadContentRoster,
} from "./content-roster";

function apiResponse(data: unknown): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("manifest 版本化题库缓存", () => {
  it("同一发布版本无限保持 fresh，重复进入游戏不会重新请求", async () => {
    const request = vi.fn().mockResolvedValue(apiResponse([{ id: "remote-v1" }]));
    vi.stubGlobal("fetch", request);
    const client = new QueryClient();
    const version = contentManifest.manifestVersion;

    const first = await loadContentRoster(client, "playable", version, characters);
    const second = await loadContentRoster(client, "playable", version, characters);

    expect(first).toBe(second);
    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0]?.[0])).toContain(
      `/api/characters?manifestVersion=${encodeURIComponent(version)}`,
    );
    expect(contentRosterQueryOptions("playable", version, characters)).toMatchObject({
      staleTime: Infinity,
      gcTime: Infinity,
    });
  });

  it("页面刷新后离线时使用随发布包携带的同版本题库", async () => {
    const request = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", request);

    // 新 QueryClient 等价于页面刷新后的新运行时，不依赖刷新前的内存缓存。
    const refreshedClient = new QueryClient();
    const roster = await loadContentRoster(
      refreshedClient,
      "playable",
      contentManifest.manifestVersion,
      characters,
    );

    expect(roster).toBe(characters);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("版本切换创建新缓存身份，进行中的旧版本快照不被替换", async () => {
    const request = vi.fn(async (input: RequestInfo | URL) => {
      const version = new URL(String(input), "https://fireflydle.games").searchParams.get(
        "manifestVersion",
      );
      return apiResponse([{ id: `roster-${version}` }]);
    });
    vi.stubGlobal("fetch", request);
    const client = new QueryClient();

    const startedGameRoster = await loadContentRoster(client, "playable", "1.0.1", characters);
    const nextReleaseRoster = await loadContentRoster(client, "playable", "1.0.2", characters);

    expect(startedGameRoster).toEqual([{ id: "roster-1.0.1" }]);
    expect(nextReleaseRoster).toEqual([{ id: "roster-1.0.2" }]);
    expect(client.getQueryData(contentRosterQueryKey("playable", "1.0.1"))).toBe(startedGameRoster);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
