import { z } from "zod";

export const LOCALES = ["zh-CN", "en", "ja"] as const;
export const LocaleSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof LocaleSchema>;

export const PASSWORD_MIN_LENGTH = 6;

export const ELEMENTS = [
  "physical",
  "fire",
  "ice",
  "lightning",
  "wind",
  "quantum",
  "imaginary",
] as const;
export const ElementSchema = z.enum(ELEMENTS);
export type Element = z.infer<typeof ElementSchema>;

export const PATHS = [
  "destruction",
  "hunt",
  "erudition",
  "harmony",
  "nihility",
  "preservation",
  "abundance",
  "remembrance",
  "elation",
] as const;
export const PathSchema = z.enum(PATHS);
export type Path = z.infer<typeof PathSchema>;

export const DIFFICULTIES = ["casual", "standard", "hard"] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const GAME_MODES = ["daily", "random", "multiplayer"] as const;
export const GameModeSchema = z.enum(GAME_MODES);
export type GameMode = z.infer<typeof GameModeSchema>;

export const FEEDBACK_STATES = ["exact", "close", "miss"] as const;
export const FeedbackStateSchema = z.enum(FEEDBACK_STATES);
export type FeedbackState = z.infer<typeof FeedbackStateSchema>;

export const DIRECTIONS = ["none", "higher", "lower"] as const;
export const DirectionSchema = z.enum(DIRECTIONS);
export type Direction = z.infer<typeof DirectionSchema>;

export const GUESS_FIELDS = ["element", "path", "rarity", "faction", "version"] as const;
export const GuessFieldSchema = z.enum(GUESS_FIELDS);
export type GuessField = z.infer<typeof GuessFieldSchema>;

export const LocalizedTextSchema = z.object({
  "zh-CN": z.string().min(1),
  en: z.string().min(1),
  ja: z.string().min(1),
});
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const LocalizedAliasesSchema = z.object({
  "zh-CN": z.array(z.string()),
  en: z.array(z.string()),
  ja: z.array(z.string()),
});
export type LocalizedAliases = z.infer<typeof LocalizedAliasesSchema>;

export const CharacterAssetSchema = z.object({
  avatarPath: z.string().min(1),
  portraitPath: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceUpdatedAt: z.string().datetime(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  rightsNotice: z.string().min(1),
});
export type CharacterAsset = z.infer<typeof CharacterAssetSchema>;

export const CharacterSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  officialId: z.string().min(1),
  baseCharacterId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  names: LocalizedTextSchema,
  aliases: LocalizedAliasesSchema,
  element: ElementSchema,
  path: PathSchema,
  rarity: z.union([z.literal(4), z.literal(5)]),
  factionId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  factionGroupId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  releaseVersionId: z.string().regex(/^\d+\.\d+$/),
  releaseOrder: z.number().int().nonnegative(),
  assets: CharacterAssetSchema,
  enabled: z.boolean(),
  targetEligible: z.boolean(),
  sourceRevision: z.string().min(1),
});
export type Character = z.infer<typeof CharacterSchema>;

export const CharacterSummarySchema = CharacterSchema.pick({
  id: true,
  names: true,
  aliases: true,
  element: true,
  path: true,
  rarity: true,
  factionId: true,
  factionGroupId: true,
  releaseVersionId: true,
  releaseOrder: true,
  assets: true,
});
export type CharacterSummary = z.infer<typeof CharacterSummarySchema>;

export const FactionSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  groupId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  names: LocalizedTextSchema,
  enabled: z.boolean(),
});
export type Faction = z.infer<typeof FactionSchema>;

export const VersionSchema = z.object({
  id: z.string().regex(/^\d+\.\d+$/),
  order: z.number().int().nonnegative(),
  releasedAt: z.string().datetime(),
});
export type Version = z.infer<typeof VersionSchema>;

export const GuessCellSchema = z.object({
  field: GuessFieldSchema,
  state: FeedbackStateSchema,
  direction: DirectionSchema,
});
export type GuessCell = z.infer<typeof GuessCellSchema>;

export const GuessResultSchema = z.object({
  character: CharacterSummarySchema,
  cells: z.array(GuessCellSchema).length(GUESS_FIELDS.length),
  isCorrect: z.boolean(),
  guessedAt: z.string().datetime(),
});
export type GuessResult = z.infer<typeof GuessResultSchema>;

export const PublicGameSchema = z.object({
  id: z.string().uuid(),
  mode: GameModeSchema,
  difficulty: DifficultySchema,
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  maxAttempts: z.number().int().positive(),
  guesses: z.array(GuessResultSchema),
  status: z.enum(["active", "won", "lost", "conceded", "expired"]),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  elapsedMs: z.number().int().nonnegative(),
  answer: CharacterSummarySchema.nullable(),
});
export type PublicGame = z.infer<typeof PublicGameSchema>;

export const CurrentGamesSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serverNow: z.string().datetime(),
  daily: PublicGameSchema.nullable(),
  random: PublicGameSchema.nullable(),
});
export type CurrentGames = z.infer<typeof CurrentGamesSchema>;

export const CreateGameRequestSchema = z.object({
  mode: z.enum(["daily", "random"]),
  difficulty: DifficultySchema,
});
export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>;

export const SubmitGuessRequestSchema = z.object({
  characterId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
});
export type SubmitGuessRequest = z.infer<typeof SubmitGuessRequestSchema>;

export const RegisterRequestSchema = z.object({
  loginName: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().trim().min(2).max(24),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
  email: z.string().email().optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  loginName: z.string().trim().min(1).max(32),
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().email(),
});
export const ResetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
});

export const ConfirmEmailVerificationSchema = z.object({
  token: z.string().min(32).max(256),
});

export const UserRoleSchema = z.enum(["player", "moderator", "data-editor", "admin", "owner"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  role: UserRoleSchema,
  isGuest: z.boolean(),
  hasEmail: z.boolean(),
  emailVerified: z.boolean(),
  elo: z.number().int(),
  rankedMatches: z.number().int().nonnegative(),
  leaderboardEligible: z.boolean(),
  createdAt: z.string().datetime(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const SessionPayloadSchema = z.object({
  expiresAt: z.string().datetime(),
  user: PublicUserSchema,
});
export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

export const UpdateDisplayNameRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(24),
});

export const AccountDeletionStatusSchema = z.object({
  scheduledFor: z.string().datetime().nullable(),
  cancellable: z.boolean(),
  status: z.enum(["none", "pending", "cancelled", "completed"]),
  requestedAt: z.string().datetime().nullable(),
  executeAfter: z.string().datetime().nullable(),
});
export type AccountDeletionStatus = z.infer<typeof AccountDeletionStatusSchema>;

export const MatchFormatSchema = z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(7)]);
export type MatchFormat = z.infer<typeof MatchFormatSchema>;

export const RoomPlayerSchema = z.object({
  playerId: z.string().uuid(),
  displayName: z.string(),
  score: z.number().int().nonnegative(),
  guessesUsed: z.number().int().nonnegative(),
  connected: z.boolean(),
  reconnectPauseUsed: z.boolean(),
});
export type RoomPlayer = z.infer<typeof RoomPlayerSchema>;

export const RoomSnapshotSchema = z.object({
  roomId: z.string().uuid(),
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{5}$/),
  format: MatchFormatSchema,
  ranked: z.boolean(),
  state: z.enum(["waiting", "countdown", "playing", "paused", "round-ended", "finished"]),
  round: z.number().int().positive(),
  consecutiveDraws: z.number().int().nonnegative(),
  roundEndsAt: z.number().int().nullable(),
  reconnectDeadline: z.number().int().nullable(),
  players: z.array(RoomPlayerSchema).max(2),
  ownGuesses: z.array(GuessResultSchema),
  opponentFeedback: z.array(z.array(GuessCellSchema)),
  winnerId: z.string().uuid().nullable(),
});
export type RoomSnapshot = z.infer<typeof RoomSnapshotSchema>;

export const ClientRoomMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({
    type: z.literal("guess"),
    characterId: z.string().min(1),
    actionId: z.string().uuid().optional(),
  }),
  z.object({ type: z.literal("leave") }),
  z.object({ type: z.literal("ping"), sentAt: z.number().int() }),
]);
export type ClientRoomMessage = z.infer<typeof ClientRoomMessageSchema>;

export const ServerRoomMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("snapshot"), snapshot: RoomSnapshotSchema }),
  z.object({ type: z.literal("error"), code: z.string(), requestId: z.string().uuid() }),
  z.object({ type: z.literal("pong"), sentAt: z.number().int() }),
]);
export type ServerRoomMessage = z.infer<typeof ServerRoomMessageSchema>;

export const CreateRoomRequestSchema = z.object({
  format: MatchFormatSchema,
});

export const JoinRoomRequestSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NP-Z2-9]{5}$/),
});

export const RoomApiResponseSchema = z.object({
  roomId: z.string().uuid(),
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{5}$/),
  snapshot: RoomSnapshotSchema.optional(),
});
export type RoomApiResponse = z.infer<typeof RoomApiResponseSchema>;

export const MatchmakingResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("waiting"), ticketId: z.string().uuid() }),
  z.object({
    status: z.literal("matched"),
    ticketId: z.string().uuid(),
    roomId: z.string().uuid(),
    roomCode: z.string().regex(/^[A-HJ-NP-Z2-9]{5}$/),
  }),
]);
export type MatchmakingResult = z.infer<typeof MatchmakingResultSchema>;

export const DailyLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  displayName: z.string().min(1),
  guesses: z.number().int().positive(),
  elapsedMs: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
});
export type DailyLeaderboardEntry = z.infer<typeof DailyLeaderboardEntrySchema>;

export const EloLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  displayName: z.string().min(1),
  elo: z.number().int(),
  rankedMatches: z.number().int().nonnegative(),
});
export type EloLeaderboardEntry = z.infer<typeof EloLeaderboardEntrySchema>;

export const RecentGameSummarySchema = z.object({
  id: z.string().uuid(),
  mode: GameModeSchema,
  result: z.enum(["won", "lost", "conceded", "draw"]),
  guesses: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  playedAt: z.string().datetime(),
});

export const PersonalStatsSchema = z.object({
  dailyPlayed: z.number().int().nonnegative(),
  dailyWon: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  randomPlayed: z.number().int().nonnegative(),
  randomWon: z.number().int().nonnegative(),
  rankedPlayed: z.number().int().nonnegative(),
  rankedWon: z.number().int().nonnegative(),
  averageGuesses: z.number().nonnegative(),
  recent: z.array(RecentGameSummarySchema),
});
export type PersonalStats = z.infer<typeof PersonalStatsSchema>;

export const ReplayVisibilitySchema = z.enum(["private", "shared"]);
export const ReplayResponseSchema = z.object({
  game: PublicGameSchema,
  visibility: ReplayVisibilitySchema,
  expiresAt: z.string().datetime().nullable(),
});
export type ReplayResponse = z.infer<typeof ReplayResponseSchema>;

export const ReplayShareResponseSchema = z.object({
  url: z.string().url(),
  visibility: z.literal("shared"),
});
export type ReplayShareResponse = z.infer<typeof ReplayShareResponseSchema>;

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  published: z.boolean(),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

export const DailyOverrideRequestSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  characterId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
});

export const ERROR_CODES = [
  "AUTH_REQUIRED",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_NAME_TAKEN",
  "AUTH_DISPLAY_NAME_TAKEN",
  "AUTH_EMAIL_TAKEN",
  "AUTH_DISPLAY_NAME_COOLDOWN",
  "AUTH_RESET_INVALID",
  "AUTH_EMAIL_UNAVAILABLE",
  "AUTH_RATE_LIMITED",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "GAME_ALREADY_FINISHED",
  "GAME_DUPLICATE_GUESS",
  "GAME_ATTEMPTS_EXHAUSTED",
  "DAILY_ALREADY_COMPLETED",
  "ROOM_NOT_FOUND",
  "ROOM_FULL",
  "ROOM_NOT_PLAYING",
  "ROOM_RECONNECT_EXPIRED",
  "RATE_LIMITED",
  "FORBIDDEN",
  "INTERNAL_ERROR",
] as const;
export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: ErrorCodeSchema,
    requestId: z.string().uuid(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
