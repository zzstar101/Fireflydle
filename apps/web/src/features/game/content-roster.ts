import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { GameEntitySummary } from "@fireflydle/contracts";
import { characters, npcEntities, npcSummary } from "@fireflydle/game-data";
import { apiRequest } from "../../api/client";

export type RosterContentMode = "playable" | "npc";

const bundledNpcRoster = npcEntities.map(npcSummary);

export function bundledRosterFor(contentModeId: RosterContentMode): readonly GameEntitySummary[] {
  return contentModeId === "npc" ? bundledNpcRoster : characters;
}

export function contentRosterQueryKey(contentModeId: RosterContentMode, manifestVersion: string) {
  return ["content-roster", contentModeId, manifestVersion] as const;
}

export function contentRosterRequestPath(
  contentModeId: RosterContentMode,
  manifestVersion: string,
): string {
  const resource = contentModeId === "npc" ? "/npcs" : "/characters";
  return `${resource}?manifestVersion=${encodeURIComponent(manifestVersion)}`;
}

export function contentRosterQueryOptions(
  contentModeId: RosterContentMode,
  manifestVersion: string,
) {
  return queryOptions({
    queryKey: contentRosterQueryKey(contentModeId, manifestVersion),
    queryFn: async (): Promise<readonly GameEntitySummary[]> => {
      try {
        return await apiRequest<GameEntitySummary[]>(
          contentRosterRequestPath(contentModeId, manifestVersion),
        );
      } catch {
        // 发布包自带同版本题库；离线或服务端已切换版本时仍可继续当前版本。
        return bundledRosterFor(contentModeId);
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

export function loadContentRoster(
  queryClient: QueryClient,
  contentModeId: RosterContentMode,
  manifestVersion: string,
): Promise<readonly GameEntitySummary[]> {
  return queryClient.ensureQueryData(contentRosterQueryOptions(contentModeId, manifestVersion));
}
