import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicUser, SessionPayload } from "@fireflydle/contracts";
import { ensureSession, getStableGuestId } from "../../api/client";
import { localTestMode } from "../../dev/local-test-mode";

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
    playableTutorialCompleted: false,
    createdAt: new Date(0).toISOString(),
  };
}

export function useSession(enabled = true) {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      if (localTestMode) {
        return {
          expiresAt: "",
          user: { ...localGuest(), playableTutorialCompleted: true },
        } satisfies SessionPayload;
      }
      try {
        const session = await ensureSession();
        if (localTestMode) {
          return {
            ...session,
            user: { ...session.user, playableTutorialCompleted: true },
          };
        }
        return session;
      } catch {
        return { expiresAt: "", user: localGuest() } satisfies SessionPayload;
      }
    },
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useRefreshSession() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["session"] });
}
