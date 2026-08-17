import type {
  Character,
  ContentModeId,
  ErrorCode,
  FieldDefinition,
  MatchFormat,
  RoomConfiguration,
  RoomSnapshot,
} from "@fireflydle/contracts";
import type { SnapshotFieldRule } from "@fireflydle/game-engine";

export interface MultiplayerContentSnapshot {
  modeId: ContentModeId;
  poolRuleVersion: string;
  manifestVersion: string;
  candidateSnapshots: Record<string, Character>;
  targetIds: string[];
  fieldRules: {
    rules: SnapshotFieldRule[];
    definitions: FieldDefinition[];
  };
}

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
  configuration?: RoomConfiguration;
  ranked: boolean;
  owner: RoomParticipant;
  opponent?: RoomParticipant;
  contentSnapshot: MultiplayerContentSnapshot;
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
  contentSnapshot: MultiplayerContentSnapshot;
  now?: number;
}

export type MatchmakingResult =
  | { status: "waiting"; ticketId: string }
  | { status: "matched"; ticketId: string; roomId: string; roomCode: string };
