import { useQuery } from "@tanstack/react-query";
import type { CurrentGames } from "@fireflydle/contracts";
import { apiRequest, ensureSession } from "../../api/client";

export const currentGamesQueryKey = ["games", "current"] as const;

function millisecondsUntilBeijingMidnight(serverNow: string): number {
  const now = Date.parse(serverNow);
  if (!Number.isFinite(now)) return 60_000;
  const shifted = new Date(now + 8 * 60 * 60 * 1_000);
  const nextMidnight =
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1) -
    8 * 60 * 60 * 1_000;
  return Math.max(1_000, nextMidnight - now + 1_000);
}

export function useCurrentGames(enabled = true) {
  return useQuery({
    queryKey: currentGamesQueryKey,
    queryFn: async () => {
      // 首次访客必须先取得会话 cookie，状态查询本身绝不创建游戏。
      await ensureSession();
      return apiRequest<CurrentGames>("/games/current");
    },
    staleTime: 10_000,
    refetchInterval: (query) => {
      const current = query.state.data;
      return current ? millisecondsUntilBeijingMidnight(current.serverNow) : false;
    },
    refetchIntervalInBackground: true,
    retry: false,
    enabled,
  });
}
