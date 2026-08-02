import type { Character, ErrorCode, MatchFormat, RoomSnapshot } from "@fireflydle/contracts";

export interface RoomParticipant {
  userId: string;
  displayName: string;
  isGuest: boolean;
  rating: number;
  rankedMatches: number;
}

export interface InitializeRoomInput {
  roomId: string;
  code: string;
  format: MatchFormat;
  ranked: boolean;
  owner: RoomParticipant;
  opponent?: RoomParticipant;
  characters: Character[];
  targetIds: string[];
  now?: number;
}

export interface JoinRoomInput {
  participant: RoomParticipant;
  now?: number;
}

export type RoomCommandResult =
  { ok: true; snapshot: RoomSnapshot } | { ok: false; code: ErrorCode };

export interface MatchmakingInput {
  participant: RoomParticipant;
  format: MatchFormat;
  ranked: boolean;
  characters: Character[];
  targetIds: string[];
  now?: number;
}

export type MatchmakingResult =
  | { status: "waiting"; ticketId: string }
  | { status: "matched"; ticketId: string; roomId: string; roomCode: string };
