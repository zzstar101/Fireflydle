import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicUser, SessionPayload } from "@fireflydle/contracts";
import { ensureSession, getStableGuestId } from "../../api/client";

function localGuest(): PublicUser {
  return {
    id: getStableGuestId(),
    displayName: "Guest",
    role: "player",
    isGuest: true,
    hasEmail: false,
    emailVerified: false,
    elo: 1000,
    rankedMatches: 0,
    leaderboardEligible: false,
    createdAt: new Date(0).toISOString(),
  };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await ensureSession();
      } catch {
        return { expiresAt: "", user: localGuest() } satisfies SessionPayload;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useRefreshSession() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["session"] });
}
