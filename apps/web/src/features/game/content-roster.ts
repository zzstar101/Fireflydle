import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { GameEntitySummary } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";

export type RosterContentMode = "playable" | "npc" | "currency-wars" | "aeon";

export function contentRosterQueryKey(contentModeId: RosterContentMode, manifestVersion: string) {
  return ["content-roster", contentModeId, manifestVersion] as const;
}

export function contentRosterRequestPath(
  contentModeId: Exclude<RosterContentMode, "aeon">,
  manifestVersion: string,
): string {
  const resource =
    contentModeId === "npc"
      ? "/npcs"
      : contentModeId === "currency-wars"
        ? "/currency-wars/units"
        : "/characters";
  return `${resource}?manifestVersion=${encodeURIComponent(manifestVersion)}`;
}

export function contentRosterQueryOptions(
  contentModeId: RosterContentMode,
  manifestVersion: string,
  bundledRoster: readonly GameEntitySummary[],
) {
  return queryOptions({
    queryKey: contentRosterQueryKey(contentModeId, manifestVersion),
    queryFn: async (): Promise<readonly GameEntitySummary[]> => {
      if (contentModeId === "aeon") return bundledRoster;
      try {
        return await apiRequest<GameEntitySummary[]>(
          contentRosterRequestPath(contentModeId, manifestVersion),
        );
      } catch {
        // 发布包自带同版本题库；离线或服务端已切换版本时仍可继续当前版本。
        return bundledRoster;
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
  bundledRoster: readonly GameEntitySummary[],
): Promise<readonly GameEntitySummary[]> {
  return queryClient.ensureQueryData(
    contentRosterQueryOptions(contentModeId, manifestVersion, bundledRoster),
  );
}
