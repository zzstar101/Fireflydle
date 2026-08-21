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

export const FEEDBACK_STATES = ["exact", "close", "miss", "unavailable", "fog"] as const;
export const FeedbackStateSchema = z.enum(FEEDBACK_STATES);
export type FeedbackState = z.infer<typeof FeedbackStateSchema>;

export const DIRECTIONS = ["none", "higher", "lower"] as const;
export const DirectionSchema = z.enum(DIRECTIONS);
export type Direction = z.infer<typeof DirectionSchema>;

export const CONTENT_MODE_IDS = ["playable", "npc", "currency-wars", "aeon", "portrait"] as const;
export const ContentModeIdSchema = z.enum(CONTENT_MODE_IDS);
export type ContentModeId = z.infer<typeof ContentModeIdSchema>;

export const ACTIVITY_IDS = [
  "daily",
  "practice",
  "weekly",
  "endless",
  "friend-challenge",
  "private-room",
  "ranked-match",
] as const;
export const ActivityIdSchema = z.enum(ACTIVITY_IDS);
export type ActivityId = z.infer<typeof ActivityIdSchema>;

export const ManifestVersionSchema = z
  .string()
  .regex(/^\d+\.\d+(?:\.\d+)?$/, "manifest 版本必须是数字版本");
export type ManifestVersion = z.infer<typeof ManifestVersionSchema>;
export const RuleVersionSchema = ManifestVersionSchema;
export type RuleVersion = z.infer<typeof RuleVersionSchema>;

export const GUESS_FIELDS = ["element", "path", "rarity", "faction", "region", "version"] as const;
/** 字段 ID 来自当前内容模式；GUESS_FIELDS 仅保留给旧多人协议的兼容常量。 */
export const GuessFieldSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
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
  responsive: z
    .array(
      z.object({
        width: z.union([z.literal(40), z.literal(80), z.literal(160)]),
        avifPath: z.string().min(1),
        webpPath: z.string().min(1),
        avifBytes: z.number().int().positive(),
        webpBytes: z.number().int().positive(),
        avifSha256: z.string().regex(/^[a-f0-9]{64}$/),
        webpSha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .superRefine((variants, context) => {
      const widths = variants
        .map((variant) => variant.width)
        .toSorted((left, right) => left - right);
      if (widths.join(",") !== "40,80,160") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "响应式头像必须包含唯一的 40/80/160px 三档变体。",
        });
      }
    })
    .optional(),
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
  regionId: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/)
    .optional(),
  releaseVersionId: z.string().regex(/^\d+\.\d+$/),
  releaseOrder: z.number().int().nonnegative(),
  assets: CharacterAssetSchema,
  enabled: z.boolean(),
  targetEligible: z.boolean(),
  sourceRevision: z.string().min(1),
});
export type Character = z.infer<typeof CharacterSchema>;

export const PlayableGameEntitySummarySchema = CharacterSchema.pick({
  id: true,
  names: true,
  aliases: true,
  element: true,
  path: true,
  rarity: true,
  factionId: true,
  factionGroupId: true,
  regionId: true,
  releaseVersionId: true,
  releaseOrder: true,
  assets: true,
});
export type PlayableGameEntitySummary = z.infer<typeof PlayableGameEntitySummarySchema>;

export const NpcSummarySchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  names: LocalizedTextSchema,
  aliases: LocalizedAliasesSchema,
  regionId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  factionId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  factionGroupId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  debutVersionId: z.string().regex(/^\d+\.\d+$/),
  debutVersionOrder: z.number().int().nonnegative(),
  assets: z.object({
    avatarPath: z.string().min(1),
    portraitPath: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    rightsNotice: z.string().min(1),
  }),
});
export type NpcSummary = z.infer<typeof NpcSummarySchema>;

const CurrencyWarsAssetSchema = z.strictObject({
  avatarPath: z.string().min(1),
  portraitPath: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  rightsNotice: z.string().min(1),
});

const CurrencyWarsCostSchema = z.union([
  z.number().int().min(1).max(5),
  z.array(z.number().int().min(1).max(5)).min(2).max(5),
]);

export const CurrencyWarsUnitSummarySchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  names: LocalizedTextSchema,
  aliases: LocalizedAliasesSchema,
  cost: CurrencyWarsCostSchema,
  position: z.enum(["front", "back", "front-back"]),
  synergies: z
    .array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/))
    .min(1)
    .optional(),
  assets: CurrencyWarsAssetSchema,
});
export type CurrencyWarsUnitSummary = z.infer<typeof CurrencyWarsUnitSummarySchema>;

export const AeonSummarySchema = z.object({
  id: z.string().regex(/^aeon-[a-z0-9-]+$/),
  names: LocalizedTextSchema,
  aliases: LocalizedAliasesSchema,
  assets: z.object({
    imagePath: z.string().min(1),
    focus: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  }),
});
export type AeonSummary = z.infer<typeof AeonSummarySchema>;

export const GameEntitySummarySchema = z.union([
  PlayableGameEntitySummarySchema,
  NpcSummarySchema,
  CurrencyWarsUnitSummarySchema,
  AeonSummarySchema,
]);
export type GameEntitySummary = z.infer<typeof GameEntitySummarySchema>;

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

export const GuessCellSchema = z
  .object({
    field: GuessFieldSchema,
    state: FeedbackStateSchema,
    direction: DirectionSchema,
  })
  .superRefine((cell, context) => {
    if ((cell.state === "unavailable" || cell.state === "fog") && cell.direction !== "none") {
      context.addIssue({
        code: "custom",
        path: ["direction"],
        message: "隐藏或不可比较字段不能有方向",
      });
    }
  });
export type GuessCell = z.infer<typeof GuessCellSchema>;

export const GuessResultSchema = z.object({
  character: GameEntitySummarySchema,
  cells: z.array(GuessCellSchema).min(1),
  isCorrect: z.boolean(),
  guessedAt: z.string().datetime(),
});
export type GuessResult = z.infer<typeof GuessResultSchema>;

export const InferenceReviewStepSchema = z.object({
  guessNumber: z.number().int().positive(),
  remainingCandidates: z.number().int().nonnegative(),
  eliminatedCandidates: z.number().int().nonnegative(),
  isBest: z.boolean(),
});
export type InferenceReviewStep = z.infer<typeof InferenceReviewStepSchema>;

export const InferenceReviewSchema = z.object({
  initialCandidates: z.number().int().positive(),
  bestGuessNumber: z.number().int().positive().nullable(),
  steps: z.array(InferenceReviewStepSchema),
});
export type InferenceReview = z.infer<typeof InferenceReviewSchema>;

export const PublicGameSchema = z.object({
  id: z.string().uuid(),
  modeId: ContentModeIdSchema,
  activityId: ActivityIdSchema,
  poolRuleVersion: RuleVersionSchema,
  manifestVersion: ManifestVersionSchema,
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
  answer: GameEntitySummarySchema.nullable(),
  /** 创建对局时绑定的字段定义，旧响应缺失时由客户端使用兼容 manifest。 */
  fieldDefinitions: z.lazy(() => z.array(FieldDefinitionSchema).min(1)).optional(),
  aeonImagePath: z.string().min(1).optional(),
  aeonImageFocus: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional(),
  aeonRevealSeed: z.string().min(1).optional(),
  inferenceReview: InferenceReviewSchema.optional(),
});
export type PublicGame = z.infer<typeof PublicGameSchema>;

export const WeeklyRunSchema = z.object({
  id: z.string().uuid(),
  modeId: ContentModeIdSchema,
  activityId: z.literal("weekly"),
  weekKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEndsAt: z.string().datetime(),
  manifestVersion: ManifestVersionSchema,
  rulesVersion: RuleVersionSchema,
  official: z.boolean(),
  status: z.enum(["active", "completed"]),
  questionCount: z.literal(5),
  correctCount: z.number().int().min(0).max(5),
  failedCount: z.number().int().min(0).max(5),
  totalGuesses: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  games: z.array(PublicGameSchema).max(5),
  currentGame: PublicGameSchema.nullable(),
});
export type WeeklyRun = z.infer<typeof WeeklyRunSchema>;

export const StartWeeklyRunRequestSchema = z.object({
  practice: z.boolean().optional().default(false),
});
export type StartWeeklyRunRequest = z.infer<typeof StartWeeklyRunRequestSchema>;

export const WeeklyLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  displayName: z.string().min(1),
  correctCount: z.number().int().min(0).max(5),
  totalGuesses: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  completedAt: z.string().datetime(),
});
export type WeeklyLeaderboardEntry = z.infer<typeof WeeklyLeaderboardEntrySchema>;

export const WeeklyShareSchema = WeeklyRunSchema.omit({ currentGame: true });
export type WeeklyShare = z.infer<typeof WeeklyShareSchema>;

export const EndlessRoundResultSchema = z.enum(["won", "lost", "skipped"]);
export type EndlessRoundResult = z.infer<typeof EndlessRoundResultSchema>;

export const EndlessLastRoundSchema = z.object({
  roundNumber: z.number().int().positive(),
  result: EndlessRoundResultSchema,
  answer: GameEntitySummarySchema,
  guessCount: z.number().int().nonnegative(),
  completedAt: z.string().datetime(),
});
export type EndlessLastRound = z.infer<typeof EndlessLastRoundSchema>;

export const PublicEndlessRunSchema = z.object({
  id: z.string().uuid(),
  modeId: ContentModeIdSchema,
  activityId: z.literal("endless"),
  poolRuleVersion: RuleVersionSchema.default("1.0.0"),
  manifestVersion: ManifestVersionSchema.default("1.0.0"),
  lives: z.number().int().min(0).max(5),
  clears: z.number().int().nonnegative(),
  totalGuesses: z.number().int().nonnegative(),
  skipAvailable: z.boolean(),
  status: z.enum(["active", "finished"]),
  roundNumber: z.number().int().positive(),
  maxAttempts: z.number().int().positive(),
  guesses: z.array(GuessResultSchema).max(6),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  elapsedMs: z.number().int().nonnegative(),
  bestClears: z.number().int().nonnegative().default(0),
  percentile: z.number().min(0).max(100).nullable().default(null),
  answer: GameEntitySummarySchema.nullable(),
  lastRound: EndlessLastRoundSchema.nullable(),
  fieldDefinitions: z.lazy(() => z.array(FieldDefinitionSchema).min(1)),
  aeonImagePath: z.string().min(1).optional(),
  aeonImageFocus: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional(),
  portraitImagePath: z.string().min(1).optional(),
});
export type PublicEndlessRun = z.infer<typeof PublicEndlessRunSchema>;

export const EndlessLeaderboardEntrySchema = z.object({
  modeId: ContentModeIdSchema,
  rank: z.number().int().positive(),
  displayName: z.string().min(1),
  isGuest: z.boolean(),
  clears: z.number().int().nonnegative(),
  totalGuesses: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  completedAt: z.string().datetime(),
});
export type EndlessLeaderboardEntry = z.infer<typeof EndlessLeaderboardEntrySchema>;

export const FriendChallengeScoreSchema = z.object({
  status: z.enum(["won", "lost"]),
  guessCount: z.number().int().positive(),
  elapsedMs: z.number().int().nonnegative(),
});
export type FriendChallengeScore = z.infer<typeof FriendChallengeScoreSchema>;

export const FriendChallengeAttemptSchema = z.object({
  kind: z.enum(["official", "practice"]),
  game: PublicGameSchema,
});
export type FriendChallengeAttempt = z.infer<typeof FriendChallengeAttemptSchema>;

export const FriendChallengeSchema = z.object({
  id: z.string().uuid(),
  modeId: ContentModeIdSchema,
  activityId: z.literal("friend-challenge"),
  poolRuleVersion: RuleVersionSchema,
  manifestVersion: ManifestVersionSchema,
  maxAttempts: z.number().int().positive(),
  creatorScore: FriendChallengeScoreSchema,
  officialScore: FriendChallengeScoreSchema.nullable(),
  comparison: z.enum(["creator-won", "challenger-won", "draw"]).nullable(),
  attempt: FriendChallengeAttemptSchema.nullable(),
});
export type FriendChallenge = z.infer<typeof FriendChallengeSchema>;

export const CurrentGamesSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serverNow: z.string().datetime(),
  daily: PublicGameSchema.nullable(),
  practice: PublicGameSchema.nullable(),
});
export type CurrentGames = z.infer<typeof CurrentGamesSchema>;

export const CreateGameRequestSchema = z.strictObject({
  modeId: z.enum(["playable", "npc", "currency-wars", "aeon"]),
  activityId: z.enum(["daily", "practice"]),
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
  playableTutorialCompleted: z.boolean(),
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

export const RoomRoundTimeSecondsSchema = z.union([
  z.null(),
  z.literal(30),
  z.literal(60),
  z.literal(90),
]);
export type RoomRoundTimeSeconds = z.infer<typeof RoomRoundTimeSecondsSchema>;

export const RoomMaxAttemptsSchema = z.union([z.literal(4), z.literal(6), z.literal(8)]);
export type RoomMaxAttempts = z.infer<typeof RoomMaxAttemptsSchema>;

export const RoomModifierSchema = z.enum(["speed", "fog"]).nullable();
export type RoomModifier = z.infer<typeof RoomModifierSchema>;

export const RoomConfigurationSchema = z.strictObject({
  modeId: ContentModeIdSchema,
  activityId: ActivityIdSchema,
  format: MatchFormatSchema,
  roundTimeSeconds: RoomRoundTimeSecondsSchema,
  maxAttempts: RoomMaxAttemptsSchema,
  modifier: RoomModifierSchema.default(null),
});
export type RoomConfiguration = z.infer<typeof RoomConfigurationSchema>;

export const RoomPlayerSchema = z.object({
  playerId: z.string().uuid(),
  displayName: z.string(),
  score: z.number().int().nonnegative(),
  guessesUsed: z.number().int().nonnegative(),
  connected: z.boolean(),
  reconnectPauseUsed: z.boolean(),
});
export type RoomPlayer = z.infer<typeof RoomPlayerSchema>;

export const RatingChangeSchema = z
  .object({
    playerId: z.string().uuid(),
    before: z.number().int(),
    after: z.number().int(),
    delta: z.number().int(),
  })
  .refine((change) => change.after - change.before === change.delta, {
    message: "评分变化必须等于结算后评分减去结算前评分",
  });
export type RatingChange = z.infer<typeof RatingChangeSchema>;

export const MatchFinishReasonSchema = z.enum([
  "score",
  "agreed-draw",
  "disconnect",
  "left",
  "cancelled",
]);
export type MatchFinishReason = z.infer<typeof MatchFinishReasonSchema>;

export const RoundSkipStateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("idle") }),
  z.object({
    status: z.literal("pending"),
    round: z.number().int().positive(),
    requestedByPlayerId: z.string().uuid(),
    expiresAt: z.number().int(),
  }),
  z.object({
    status: z.literal("cancelled"),
    round: z.number().int().positive(),
    requestedByPlayerId: z.string().uuid(),
    reason: z.enum(["declined", "timeout"]),
  }),
  z.object({
    status: z.literal("executed"),
    round: z.number().int().positive(),
    requestedByPlayerId: z.string().uuid(),
    acceptedByPlayerId: z.string().uuid(),
  }),
]);
export type RoundSkipState = z.infer<typeof RoundSkipStateSchema>;

export const RoomSnapshotSchema = z
  .object({
    roomId: z.string().uuid(),
    code: z.string().regex(/^[A-HJ-NP-Z2-9]{5}$/),
    modeId: ContentModeIdSchema,
    activityId: ActivityIdSchema,
    format: MatchFormatSchema,
    configuration: RoomConfigurationSchema,
    ranked: z.boolean(),
    state: z.enum(["waiting", "countdown", "playing", "paused", "round-ended", "finished"]),
    round: z.number().int().positive(),
    consecutiveDraws: z.number().int().nonnegative(),
    roundEndsAt: z.number().int().nullable(),
    nextRoundAt: z.number().int().nullable(),
    reconnectDeadline: z.number().int().nullable(),
    players: z.array(RoomPlayerSchema).max(2),
    ownGuesses: z.array(GuessResultSchema),
    opponentFeedback: z.array(z.array(GuessCellSchema)),
    fogField: GuessFieldSchema.nullable().default(null),
    roundAnswer: GameEntitySummarySchema.nullable(),
    roundWinnerId: z.string().uuid().nullable(),
    roundSkip: RoundSkipStateSchema,
    drawOfferByPlayerId: z.string().uuid().nullable(),
    winnerId: z.string().uuid().nullable(),
    finishReason: MatchFinishReasonSchema.nullable(),
    ratingChanges: z.array(RatingChangeSchema).max(2),
  })
  .superRefine((snapshot, context) => {
    const playerIds = new Set(snapshot.players.map((player) => player.playerId));
    const ratingPlayerIds = new Set(snapshot.ratingChanges.map((change) => change.playerId));
    if (ratingPlayerIds.size !== snapshot.ratingChanges.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ratingChanges"],
        message: "同一玩家只能出现一次评分变化",
      });
    }
    if (snapshot.ratingChanges.some((change) => !playerIds.has(change.playerId))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ratingChanges"],
        message: "评分变化只能引用房间内玩家",
      });
    }
    const shouldExposeSettlement = snapshot.ranked && snapshot.state === "finished";
    if (
      (shouldExposeSettlement && snapshot.ratingChanges.length !== snapshot.players.length) ||
      (!shouldExposeSettlement && snapshot.ratingChanges.length !== 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ratingChanges"],
        message: "只有已结束的正式随机匹配才能返回双方评分变化",
      });
    }
  });
export type RoomSnapshot = z.infer<typeof RoomSnapshotSchema>;

export const ClientRoomMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({
    type: z.literal("guess"),
    characterId: z.string().min(1),
    actionId: z.string().uuid().optional(),
  }),
  z.object({ type: z.literal("offer-draw") }),
  z.object({ type: z.literal("respond-draw"), accepted: z.boolean() }),
  z.object({ type: z.literal("request-skip") }),
  z.object({ type: z.literal("respond-skip"), accepted: z.boolean() }),
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

export const CreateRoomRequestSchema = z
  .preprocess(
    (input) => {
      if (
        typeof input === "object" &&
        input !== null &&
        "modeId" in input &&
        (input as { modeId?: unknown }).modeId === "npc" &&
        !("maxAttempts" in input)
      ) {
        throw new Error("NPC 私人房必须明确猜测次数");
      }
      return input;
    },
    z.strictObject({
      modeId: ContentModeIdSchema.optional().default("playable"),
      activityId: z.literal("private-room").optional().default("private-room"),
      format: MatchFormatSchema.optional().default(3),
      roundTimeSeconds: RoomRoundTimeSecondsSchema.optional().default(90),
      maxAttempts: RoomMaxAttemptsSchema.optional().default(6),
      modifier: RoomModifierSchema.optional().default(null),
    }),
  )
  .superRefine((value, context) => {
    if (value.modeId === "aeon" && value.modifier === "fog") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modifier"],
        message: "星神模式不支持迷雾",
      });
    }
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

export const RoomPreviewResponseSchema = z.object({
  roomId: z.string().uuid(),
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{5}$/),
  configuration: RoomConfigurationSchema,
});
export type RoomPreviewResponse = z.infer<typeof RoomPreviewResponseSchema>;

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

export const EloLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  displayName: z.string().min(1),
  elo: z.number().int(),
  rankedMatches: z.number().int().nonnegative(),
});
export type EloLeaderboardEntry = z.infer<typeof EloLeaderboardEntrySchema>;

export const RecentGameSummarySchema = z.object({
  id: z.string().uuid(),
  modeId: ContentModeIdSchema,
  activityId: ActivityIdSchema,
  result: z.enum(["won", "lost", "conceded", "draw"]),
  guesses: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  playedAt: z.string().datetime(),
  opponentDisplayName: z.string().nullable().optional(),
  scoreFor: z.number().int().nonnegative().optional(),
  scoreAgainst: z.number().int().nonnegative().optional(),
  ranked: z.boolean().optional(),
  inferenceReview: InferenceReviewSchema.optional(),
});

export const DailyCompletionSchema = z.object({
  id: z.string().uuid(),
  dateKey: z.iso.date(),
  result: z.enum(["won", "lost"]),
  guesses: z.number().int().positive(),
  completedAt: z.string().datetime(),
});
export type DailyCompletion = z.infer<typeof DailyCompletionSchema>;

export const GuessDistributionBucketSchema = z.object({
  guesses: z.number().int().positive(),
  count: z.number().int().nonnegative(),
});
export type GuessDistributionBucket = z.infer<typeof GuessDistributionBucketSchema>;

export const PersonalStatsSchema = z.object({
  totalSolved: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
  strongestPath: z
    .object({ id: z.string().min(1), solved: z.number().int().positive() })
    .nullable(),
  strongestElement: z
    .object({ id: z.string().min(1), solved: z.number().int().positive() })
    .nullable(),
  dailyPlayed: z.number().int().nonnegative(),
  dailyWon: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  practicePlayed: z.number().int().nonnegative(),
  practiceWon: z.number().int().nonnegative(),
  rankedPlayed: z.number().int().nonnegative(),
  rankedWon: z.number().int().nonnegative(),
  averageGuesses: z.number().nonnegative(),
  dailyHistory: z.array(DailyCompletionSchema),
  guessDistribution: z.array(GuessDistributionBucketSchema),
  failedDaily: z.number().int().nonnegative(),
  todayCompletions: z.number().int().nonnegative(),
  recent: z.array(RecentGameSummarySchema),
  achievements: z.array(
    z.object({
      id: z.enum([
        "one-shot",
        "daily-seven",
        "win-streak-10",
        "last-guess",
        "first-npc",
        "games-100",
      ]),
      unlockedAt: z.string().datetime().nullable(),
      progress: z.number().int().nonnegative(),
      target: z.number().int().positive(),
    }),
  ),
});
export type PersonalStats = z.infer<typeof PersonalStatsSchema>;
export type AchievementProgress = PersonalStats["achievements"][number];

export const ReplayVisibilitySchema = z.enum(["private", "shared"]);
export const SoloReplayResponseSchema = z.object({
  kind: z.literal("solo"),
  game: PublicGameSchema,
  visibility: ReplayVisibilitySchema,
  expiresAt: z.string().datetime().nullable(),
});

export const MultiplayerReplayPlayerSchema = z.object({
  playerId: z.string().uuid(),
  seat: z.union([z.literal(0), z.literal(1)]),
  displayName: z.string().min(1),
  score: z.number().int().nonnegative(),
  ratingBefore: z.number().int(),
  ratingAfter: z.number().int(),
});

export const MultiplayerReplayGuessSchema = z.object({
  playerId: z.string().uuid(),
  ordinal: z.number().int().positive(),
  result: GuessResultSchema,
});

export const MultiplayerReplayRoundSchema = z.object({
  roundNumber: z.number().int().positive(),
  answer: PlayableGameEntitySummarySchema,
  winnerPlayerId: z.string().uuid().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  guesses: z.array(MultiplayerReplayGuessSchema),
});

export const MultiplayerReplaySchema = z.object({
  id: z.string().uuid(),
  modeId: ContentModeIdSchema,
  activityId: ActivityIdSchema,
  format: MatchFormatSchema,
  ranked: z.boolean(),
  finishReason: MatchFinishReasonSchema,
  winnerPlayerId: z.string().uuid().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  players: z.array(MultiplayerReplayPlayerSchema).length(2),
  rounds: z.array(MultiplayerReplayRoundSchema),
});
export type MultiplayerReplay = z.infer<typeof MultiplayerReplaySchema>;

export const MultiplayerReplayResponseSchema = z.object({
  kind: z.literal("multiplayer"),
  match: MultiplayerReplaySchema,
  visibility: z.literal("private"),
  expiresAt: z.null(),
});

export const ReplayResponseSchema = z.discriminatedUnion("kind", [
  SoloReplayResponseSchema,
  MultiplayerReplayResponseSchema,
]);
export type ReplayResponse = z.infer<typeof ReplayResponseSchema>;

export const ReplayShareResponseSchema = z.object({
  url: z.string().url(),
  visibility: z.literal("shared"),
});
export type ReplayShareResponse = z.infer<typeof ReplayShareResponseSchema>;

export const ANNOUNCEMENT_CATEGORIES = ["update", "notice", "maintenance"] as const;
export const AnnouncementCategorySchema = z.enum(ANNOUNCEMENT_CATEGORIES);
export type AnnouncementCategory = z.infer<typeof AnnouncementCategorySchema>;

export const ANNOUNCEMENT_AUDIENCES = ["all", "registered", "guest"] as const;
export const AnnouncementAudienceSchema = z.enum(ANNOUNCEMENT_AUDIENCES);
export type AnnouncementAudience = z.infer<typeof AnnouncementAudienceSchema>;

export const ANNOUNCEMENT_STATUSES = ["draft", "scheduled", "active", "ended", "archived"] as const;
export const AnnouncementStatusSchema = z.enum(ANNOUNCEMENT_STATUSES);
export type AnnouncementStatus = z.infer<typeof AnnouncementStatusSchema>;

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  category: AnnouncementCategorySchema,
  audience: AnnouncementAudienceSchema,
  status: AnnouncementStatusSchema,
  source: z.enum(["admin", "release"]),
  sourceRef: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
  archivedAt: z.string().datetime().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

export const AnnouncementReadRequestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(20),
});
export type AnnouncementReadRequest = z.infer<typeof AnnouncementReadRequestSchema>;

export const DailyOverrideRequestSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  characterId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
});

const ContentIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const StrictLocalizedTextSchema = z.strictObject({
  "zh-CN": z.string().min(1),
  en: z.string().min(1),
  ja: z.string().min(1),
});
const StrictLocalizedAliasesSchema = z.strictObject({
  "zh-CN": z.array(z.string().min(1)),
  en: z.array(z.string().min(1)),
  ja: z.array(z.string().min(1)),
});

export const FieldValueTypeSchema = z.enum(["enum", "number", "set", "image"]);
export type FieldValueType = z.infer<typeof FieldValueTypeSchema>;
export const FieldComparisonSchema = z.enum(["exact", "direction", "set"]);
export type FieldComparison = z.infer<typeof FieldComparisonSchema>;

export const FieldDefinitionSchema = z
  .strictObject({
    id: ContentIdSchema,
    label: StrictLocalizedTextSchema,
    valueType: FieldValueTypeSchema,
    comparison: FieldComparisonSchema,
    required: z.boolean(),
    directional: z.boolean().optional(),
  })
  .superRefine((field, context) => {
    if (field.directional && field.comparison !== "direction") {
      context.addIssue({
        code: "custom",
        path: ["comparison"],
        message: "方向字段必须使用 direction 比较",
      });
    }
    if (!field.directional && field.comparison === "direction") {
      context.addIssue({
        code: "custom",
        path: ["directional"],
        message: "方向比较必须声明 directional",
      });
    }
    if (field.comparison === "direction" && field.valueType !== "number") {
      context.addIssue({ code: "custom", path: ["valueType"], message: "方向比较只支持数值字段" });
    }
    if (field.comparison === "set" && field.valueType !== "set") {
      context.addIssue({ code: "custom", path: ["valueType"], message: "集合比较只支持集合字段" });
    }
    if (field.valueType === "image" && field.comparison !== "exact") {
      context.addIssue({
        code: "custom",
        path: ["comparison"],
        message: "图片字段只支持 exact 比较",
      });
    }
  });
export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;
export const FieldSchema = FieldDefinitionSchema;

export const QuestionPoolDefinitionSchema = z
  .strictObject({
    id: ContentIdSchema,
    modeId: ContentModeIdSchema,
    targetIds: z.array(ContentIdSchema).min(1),
    candidateIds: z.array(ContentIdSchema).min(1),
  })
  .superRefine((pool, context) => {
    if (new Set(pool.targetIds).size !== pool.targetIds.length) {
      context.addIssue({ code: "custom", path: ["targetIds"], message: "目标 ID 不能重复" });
    }
    if (new Set(pool.candidateIds).size !== pool.candidateIds.length) {
      context.addIssue({ code: "custom", path: ["candidateIds"], message: "候选 ID 不能重复" });
    }
  });
export type QuestionPoolDefinition = z.infer<typeof QuestionPoolDefinitionSchema>;
export const QuestionPoolSchema = QuestionPoolDefinitionSchema;

export const ContentModeDefinitionSchema = z
  .strictObject({
    id: ContentModeIdSchema,
    label: StrictLocalizedTextSchema,
    targetPoolId: ContentIdSchema,
    candidatePoolId: ContentIdSchema,
    fields: z.array(FieldDefinitionSchema).min(1),
    maxAttempts: z.number().int().positive(),
    rulesVersion: RuleVersionSchema,
    activities: z.array(ActivityIdSchema).min(1),
  })
  .superRefine((mode, context) => {
    const ids = new Set<string>();
    for (const [index, field] of mode.fields.entries()) {
      if (ids.has(field.id)) {
        context.addIssue({
          code: "custom",
          path: ["fields", index, "id"],
          message: "字段 ID 不能重复",
        });
      }
      ids.add(field.id);
    }
    if (new Set(mode.activities).size !== mode.activities.length) {
      context.addIssue({ code: "custom", path: ["activities"], message: "活动 ID 不能重复" });
    }
  });
export type ContentModeDefinition = z.infer<typeof ContentModeDefinitionSchema>;
export const ContentModeSchema = ContentModeDefinitionSchema;

export const ActivityDefinitionSchema = z.strictObject({
  id: ActivityIdSchema,
  label: StrictLocalizedTextSchema,
  modeIds: z.array(ContentModeIdSchema).min(1),
  enabled: z.boolean(),
});
export type ActivityDefinition = z.infer<typeof ActivityDefinitionSchema>;
export const ActivitySchema = ActivityDefinitionSchema;

const EntitySourceSchema = z.strictObject({
  url: z.string().url(),
  revision: z.string().min(1),
});
const EntityReviewStatusSchema = z.enum(["draft", "approved", "rejected"]);
const EntityAssetsSchema = z.strictObject({
  avatarPath: z.string().min(1),
  portraitPath: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  rightsNotice: z.string().min(1),
});
const EntityEnvelopeSchema = {
  id: ContentIdSchema,
  names: StrictLocalizedTextSchema,
  aliases: StrictLocalizedAliasesSchema,
  source: EntitySourceSchema,
  reviewStatus: EntityReviewStatusSchema,
};

export const PlayableEntityPayloadSchema = z.strictObject({
  element: ElementSchema,
  path: PathSchema,
  rarity: z.union([z.literal(4), z.literal(5)]),
  factionId: ContentIdSchema,
  factionGroupId: ContentIdSchema,
  regionId: ContentIdSchema,
  releaseVersionId: z.string().regex(/^\d+\.\d+$/),
  releaseOrder: z.number().int().nonnegative(),
  assets: EntityAssetsSchema,
});
export type PlayableEntityPayload = z.infer<typeof PlayableEntityPayloadSchema>;

export const NpcEntityPayloadSchema = z.strictObject({
  regionId: ContentIdSchema,
  factionId: ContentIdSchema,
  debutVersionId: z.string().regex(/^\d+\.\d+$/),
  assets: EntityAssetsSchema,
});
export type NpcEntityPayload = z.infer<typeof NpcEntityPayloadSchema>;

export const AeonEntityPayloadSchema = z.strictObject({
  assets: z.strictObject({
    imagePath: z.string().min(1),
    focus: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  }),
});
export type AeonEntityPayload = z.infer<typeof AeonEntityPayloadSchema>;

export const PlayableEntitySchema = z.strictObject({
  ...EntityEnvelopeSchema,
  kind: z.literal("playable"),
  payload: PlayableEntityPayloadSchema,
});
export const NpcEntitySchema = z.strictObject({
  ...EntityEnvelopeSchema,
  kind: z.literal("npc"),
  payload: NpcEntityPayloadSchema,
});
export const AeonEntitySchema = z.strictObject({
  ...EntityEnvelopeSchema,
  kind: z.literal("aeon"),
  payload: AeonEntityPayloadSchema,
});
export const ContentEntitySchema = z.discriminatedUnion("kind", [
  PlayableEntitySchema,
  NpcEntitySchema,
  AeonEntitySchema,
]);
export type ContentEntity = z.infer<typeof ContentEntitySchema>;

export const SearchIndexTermSchema = z.strictObject({
  value: z.string().min(1),
  normalized: z.string().min(1),
  locale: LocaleSchema,
});
export type SearchIndexTerm = z.infer<typeof SearchIndexTermSchema>;

export const SearchIndexEntrySchema = z
  .strictObject({
    entityId: ContentIdSchema,
    names: z.array(SearchIndexTermSchema).length(LOCALES.length),
    terms: z.array(SearchIndexTermSchema),
  })
  .superRefine((entry, context) => {
    if (new Set(entry.names.map((name) => name.locale)).size !== LOCALES.length) {
      context.addIssue({ code: "custom", path: ["names"], message: "搜索索引必须包含三语名称" });
    }
    const keys = [...entry.names, ...entry.terms].map(
      (term) => `${term.locale}:${term.normalized}`,
    );
    if (new Set(keys).size !== keys.length) {
      context.addIssue({ code: "custom", path: ["terms"], message: "搜索词不能重复" });
    }
  });
export type SearchIndexEntry = z.infer<typeof SearchIndexEntrySchema>;

export const CurrencyWarsUnitSchema = z
  .strictObject({
    id: ContentIdSchema,
    names: StrictLocalizedTextSchema,
    aliases: StrictLocalizedAliasesSchema,
    source: EntitySourceSchema,
    reviewStatus: EntityReviewStatusSchema,
    assets: CurrencyWarsAssetSchema,
    cost: CurrencyWarsCostSchema,
    position: z.enum(["front", "back", "front-back"]),
    synergies: z.array(ContentIdSchema),
  })
  .superRefine((unit, context) => {
    if (new Set(unit.synergies).size !== unit.synergies.length) {
      context.addIssue({ code: "custom", path: ["synergies"], message: "羁绊 ID 不能重复" });
    }
    if (unit.synergies.includes(unit.id)) {
      context.addIssue({ code: "custom", path: ["synergies"], message: "单位不能引用自身羁绊" });
    }
  });
export type CurrencyWarsUnit = z.infer<typeof CurrencyWarsUnitSchema>;

export const CurrencyWarsRulesetSchema = z
  .strictObject({
    id: ContentIdSchema,
    gameVersion: z.string().min(1),
    capturedAt: z.string().datetime(),
    source: EntitySourceSchema,
    units: z.array(CurrencyWarsUnitSchema).min(1),
    synergyDefinitions: z
      .array(
        z.strictObject({
          id: ContentIdSchema,
          names: StrictLocalizedTextSchema,
          type: z.string().min(1),
        }),
      )
      .min(1),
    rulesVersion: RuleVersionSchema,
  })
  .superRefine((ruleset, context) => {
    const ids = new Set<string>();
    for (const [index, unit] of ruleset.units.entries()) {
      if (ids.has(unit.id)) {
        context.addIssue({
          code: "custom",
          path: ["units", index, "id"],
          message: "币战单位 ID 不能重复",
        });
      }
      ids.add(unit.id);
    }
    const synergyIds = new Set(ruleset.synergyDefinitions.map((synergy) => synergy.id));
    if (synergyIds.size !== ruleset.synergyDefinitions.length) {
      context.addIssue({
        code: "custom",
        path: ["synergyDefinitions"],
        message: "羁绊 ID 不能重复",
      });
    }
    for (const [index, unit] of ruleset.units.entries()) {
      for (const synergy of unit.synergies) {
        if (!synergyIds.has(synergy)) {
          context.addIssue({
            code: "custom",
            path: ["units", index, "synergies"],
            message: `未知羁绊 ${synergy}`,
          });
        }
      }
    }
  });
export type CurrencyWarsRuleset = z.infer<typeof CurrencyWarsRulesetSchema>;

export const ContentManifestSchema = z
  .strictObject({
    manifestVersion: ManifestVersionSchema,
    generatedAt: z.string().datetime(),
    modes: z.array(ContentModeDefinitionSchema).min(1),
    activities: z.array(ActivityDefinitionSchema).min(1),
    pools: z.array(QuestionPoolDefinitionSchema).min(1),
    entities: z.array(ContentEntitySchema).default([]),
    searchIndex: z.array(SearchIndexEntrySchema).default([]),
    currencyWars: CurrencyWarsRulesetSchema.optional(),
  })
  .superRefine((manifest, context) => {
    const modeIds = new Set<string>();
    for (const [index, mode] of manifest.modes.entries()) {
      if (modeIds.has(mode.id)) {
        context.addIssue({
          code: "custom",
          path: ["modes", index, "id"],
          message: "模式 ID 不能重复",
        });
      }
      modeIds.add(mode.id);
    }

    const activityIds = new Set<string>();
    for (const [index, activity] of manifest.activities.entries()) {
      if (activityIds.has(activity.id)) {
        context.addIssue({
          code: "custom",
          path: ["activities", index, "id"],
          message: "活动 ID 不能重复",
        });
      }
      activityIds.add(activity.id);
      for (const modeId of activity.modeIds) {
        if (!modeIds.has(modeId)) {
          context.addIssue({
            code: "custom",
            path: ["activities", index, "modeIds"],
            message: `活动引用未知模式 ${modeId}`,
          });
        }
      }
      for (const mode of manifest.modes) {
        if (mode.activities.includes(activity.id) !== activity.modeIds.includes(mode.id)) {
          context.addIssue({
            code: "custom",
            path: ["activities", index, "modeIds"],
            message: "模式与活动引用必须双向一致",
          });
        }
      }
    }

    const poolIds = new Set<string>();
    const poolsById = new Map<string, QuestionPoolDefinition>();
    for (const [index, pool] of manifest.pools.entries()) {
      if (poolIds.has(pool.id)) {
        context.addIssue({
          code: "custom",
          path: ["pools", index, "id"],
          message: "题池 ID 不能重复",
        });
      }
      poolIds.add(pool.id);
      poolsById.set(pool.id, pool);
      if (!modeIds.has(pool.modeId)) {
        context.addIssue({
          code: "custom",
          path: ["pools", index, "modeId"],
          message: `题池引用未知模式 ${pool.modeId}`,
        });
      }
      const candidates = new Set(pool.candidateIds);
      for (const targetId of pool.targetIds) {
        if (!candidates.has(targetId)) {
          context.addIssue({
            code: "custom",
            path: ["pools", index, "targetIds"],
            message: "目标必须属于候选池",
          });
        }
      }
    }

    const entityIds = new Set<string>();
    const entitiesById = new Map<string, ContentEntity>();
    for (const [index, entity] of manifest.entities.entries()) {
      if (entityIds.has(entity.id)) {
        context.addIssue({
          code: "custom",
          path: ["entities", index, "id"],
          message: "实体 ID 不能重复",
        });
      }
      entityIds.add(entity.id);
      entitiesById.set(entity.id, entity);
    }

    const indexedEntityIds = new Set<string>();
    for (const [index, entry] of manifest.searchIndex.entries()) {
      if (indexedEntityIds.has(entry.entityId)) {
        context.addIssue({
          code: "custom",
          path: ["searchIndex", index, "entityId"],
          message: "搜索索引实体 ID 不能重复",
        });
      }
      indexedEntityIds.add(entry.entityId);
      if (!entityIds.has(entry.entityId)) {
        context.addIssue({
          code: "custom",
          path: ["searchIndex", index, "entityId"],
          message: `搜索索引引用未知实体 ${entry.entityId}`,
        });
      }
    }

    for (const [index, mode] of manifest.modes.entries()) {
      const targetPool = poolsById.get(mode.targetPoolId);
      const candidatePool = poolsById.get(mode.candidatePoolId);
      if (!targetPool || !candidatePool) {
        context.addIssue({
          code: "custom",
          path: ["modes", index],
          message: "模式必须引用已注册题池",
        });
      } else if (targetPool.modeId !== mode.id || candidatePool.modeId !== mode.id) {
        context.addIssue({
          code: "custom",
          path: ["modes", index],
          message: "模式与题池类型不兼容",
        });
      }
      if (mode.id === "currency-wars" && !manifest.currencyWars) {
        context.addIssue({
          code: "custom",
          path: ["currencyWars"],
          message: "币战模式必须绑定独立规则快照",
        });
      }
      for (const activityId of mode.activities) {
        if (!activityIds.has(activityId)) {
          context.addIssue({
            code: "custom",
            path: ["modes", index, "activities"],
            message: `模式引用未知活动 ${activityId}`,
          });
        }
      }
    }

    const currencyUnitIds = new Set(manifest.currencyWars?.units.map((unit) => unit.id) ?? []);
    {
      for (const [index, pool] of manifest.pools.entries()) {
        for (const entityId of [...pool.targetIds, ...pool.candidateIds]) {
          const known =
            pool.modeId === "currency-wars"
              ? currencyUnitIds.has(entityId)
              : entityIds.has(entityId);
          if (!known) {
            context.addIssue({
              code: "custom",
              path: ["pools", index],
              message: `题池引用未知实体 ${entityId}`,
            });
          }
        }
        const mode = manifest.modes.find((entry) => entry.id === pool.modeId);
        const expectedKind = pool.modeId === "currency-wars" ? undefined : pool.modeId;
        for (const entityId of pool.candidateIds) {
          const entity = entitiesById.get(entityId);
          if (entity && expectedKind && entity.kind !== expectedKind) {
            context.addIssue({
              code: "custom",
              path: ["pools", index],
              message: `题池 ${mode?.id ?? pool.modeId} 包含不兼容实体`,
            });
          }
        }
        for (const entityId of pool.targetIds) {
          const entity = entitiesById.get(entityId);
          if (entity && entity.reviewStatus !== "approved") {
            context.addIssue({
              code: "custom",
              path: ["pools", index],
              message: "正式目标必须通过审核",
            });
          }
        }
      }
    }
  });
export type ContentManifest = z.infer<typeof ContentManifestSchema>;
/** ManifestSchema 是内容发布 seam 的兼容别名；新代码优先使用 ContentManifestSchema。 */
export const ManifestSchema = ContentManifestSchema;
/** 兼容后续迁移期间使用的信封命名。 */
export const ContentManifestEnvelopeSchema = ContentManifestSchema;
export const ManifestEnvelopeSchema = ContentManifestSchema;

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
  "ENDLESS_SKIP_USED",
  "CHALLENGE_EXPIRED",
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
