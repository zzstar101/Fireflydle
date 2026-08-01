import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicUser, SessionPayload } from "@fireflydle/contracts";
import { ensureSession } from "../../api/client";

function localGuest(): PublicUser {
  const key = "fireflydle-local-guest-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return {
    id,
    displayName: "Guest",
    role: "player",
    isGuest: true,
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
