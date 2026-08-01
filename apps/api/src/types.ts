import type { UserRole } from "@fireflydle/contracts";

export interface AuthUser {
  id: string;
  displayName: string;
  role: UserRole;
  isGuest: boolean;
  hasEmail: boolean;
  emailVerified: boolean;
  elo: number;
  rankedMatches: number;
  leaderboardEligible: boolean;
  createdAt: number;
}

export interface AuthContext {
  sessionId: string;
  token: string;
  expiresAt: number;
  user: AuthUser;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    requestId: string;
    auth: AuthContext | null;
  };
};

export interface RoomPrincipal {
  userId: string;
  displayName: string;
  elo: number;
  rankedMatches: number;
}
