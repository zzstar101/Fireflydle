import type {
  ContentModeId,
  FriendChallenge,
  FriendChallengeScore,
  GameEntitySummary,
  PublicGame,
} from "@fireflydle/contracts";
import { GameEntitySummarySchema } from "@fireflydle/contracts";
import { ApiProblem } from "../lib/http";
import { getPublicGame } from "./games";

interface SourceGameRow {
  id: string;
  user_id: string;
  mode_id: ContentModeId;
  pool_rule_version: string;
  manifest_version: string;
  target_character_id: string;
  target_payload_json: string;
  candidate_pool_json: string;
  field_rules_json: string;
  max_attempts: number;
  status: string;
  started_at: number;
  completed_at: number | null;
  guess_count: number;
}

interface ChallengeRow {
  id: string;
  creator_user_id: string;
  mode_id: ContentModeId;
  pool_rule_version: string;
  manifest_version: string;
  target_character_id: string;
  target_payload_json: string;
  candidate_pool_json: string;
  field_rules_json: string;
  max_attempts: number;
  creator_status: "won" | "lost";
  creator_guess_count: number;
  creator_elapsed_ms: number;
  expires_at: number;
}

const CHALLENGE_RETENTION_MS = 90 * 24 * 60 * 60 * 1_000;
const CHALLENGE_MODE_IDS = new Set<ContentModeId>(["playable", "npc", "currency-wars", "aeon"]);

function challengeFieldRules(source: SourceGameRow): string {
  if (source.mode_id !== "aeon") return source.field_rules_json;
  const parsed = JSON.parse(source.field_rules_json) as unknown;
  const snapshot =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  return JSON.stringify({ ...snapshot, aeonRevealSeed: source.id });
}

interface AttemptRow {
  kind: "official" | "practice";
  game_id: string;
  status: PublicGame["status"];
  started_at: number;
  completed_at: number | null;
  guess_count: number;
}

function scoreOf(row: {
  status: string;
  guess_count: number;
  started_at: number;
  completed_at: number | null;
}): FriendChallengeScore | null {
  if ((row.status !== "won" && row.status !== "lost") || row.completed_at === null) return null;
  return {
    status: row.status,
    guessCount: row.guess_count,
    elapsedMs: Math.max(0, row.completed_at - row.started_at),
  };
}

export function compareChallengeScores(
  creator: FriendChallengeScore,
  challenger: FriendChallengeScore,
): NonNullable<FriendChallenge["comparison"]> {
  if (creator.status !== challenger.status) {
    return challenger.status === "won" ? "challenger-won" : "creator-won";
  }
  if (creator.guessCount !== challenger.guessCount) {
    return challenger.guessCount < creator.guessCount ? "challenger-won" : "creator-won";
  }
  if (creator.elapsedMs !== challenger.elapsedMs) {
    return challenger.elapsedMs < creator.elapsedMs ? "challenger-won" : "creator-won";
  }
  return "draw";
}

async function readChallenge(
  db: D1Database,
  challengeId: string,
  now: number,
): Promise<ChallengeRow> {
  const row = await db
    .prepare("SELECT * FROM friend_challenges WHERE id = ?")
    .bind(challengeId)
    .first<ChallengeRow>();
  if (!row) {
    const tombstone = await db
      .prepare("SELECT mode_id FROM friend_challenge_tombstones WHERE id = ?")
      .bind(challengeId)
      .first<{ mode_id: string }>();
    if (tombstone) {
      throw new ApiProblem("CHALLENGE_EXPIRED", 410, { modeId: tombstone.mode_id });
    }
    throw new ApiProblem("NOT_FOUND", 404);
  }
  if (row.expires_at <= now) {
    throw new ApiProblem("CHALLENGE_EXPIRED", 410, { modeId: row.mode_id });
  }
  return row;
}

async function readAttempt(
  db: D1Database,
  challengeId: string,
  userId: string,
  kind?: "official" | "practice",
): Promise<AttemptRow | null> {
  const kindClause = kind ? "AND attempt.kind = ?" : "";
  const statement = db.prepare(
    `SELECT attempt.kind, attempt.game_id, game.status, game.started_at, game.completed_at,
            (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id) AS guess_count
     FROM friend_challenge_attempts attempt
     JOIN games game ON game.id = attempt.game_id
     WHERE attempt.challenge_id = ? AND attempt.user_id = ? ${kindClause}
     ORDER BY CASE WHEN game.status = 'active' THEN 0 ELSE 1 END,
              attempt.created_at DESC
     LIMIT 1`,
  );
  return kind
    ? statement.bind(challengeId, userId, kind).first<AttemptRow>()
    : statement.bind(challengeId, userId).first<AttemptRow>();
}

async function toPublicChallenge(
  db: D1Database,
  row: ChallengeRow,
  userId: string,
  now: number,
): Promise<FriendChallenge> {
  const [official, current] = await Promise.all([
    readAttempt(db, row.id, userId, "official"),
    readAttempt(db, row.id, userId),
  ]);
  const creatorScore: FriendChallengeScore = {
    status: row.creator_status,
    guessCount: row.creator_guess_count,
    elapsedMs: row.creator_elapsed_ms,
  };
  const officialScore = official ? scoreOf(official) : null;
  return {
    id: row.id,
    modeId: row.mode_id,
    activityId: "friend-challenge",
    poolRuleVersion: row.pool_rule_version,
    manifestVersion: row.manifest_version,
    maxAttempts: row.max_attempts,
    creatorScore,
    officialScore,
    comparison: officialScore ? compareChallengeScores(creatorScore, officialScore) : null,
    attempt: current
      ? {
          kind: current.kind,
          game: await getPublicGame(db, current.game_id, userId, now),
        }
      : null,
  };
}

export async function createFriendChallenge(
  db: D1Database,
  sourceGameId: string,
  userId: string,
  now = Date.now(),
): Promise<FriendChallenge> {
  const source = await db
    .prepare(
      `SELECT game.*,
              (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id) AS guess_count
       FROM games game WHERE game.id = ?`,
    )
    .bind(sourceGameId)
    .first<SourceGameRow>();
  if (!source || source.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  if (
    !CHALLENGE_MODE_IDS.has(source.mode_id) ||
    (source.status !== "won" && source.status !== "lost")
  ) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "completed-game-required" });
  }
  if (source.completed_at === null || source.guess_count < 1) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "completed-game-required" });
  }

  const existing = await db
    .prepare("SELECT id FROM friend_challenges WHERE source_game_id = ?")
    .bind(sourceGameId)
    .first<{ id: string }>();
  let challengeId = existing?.id ?? crypto.randomUUID();
  if (!existing) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO friend_challenges
           (id, source_game_id, creator_user_id, mode_id, pool_rule_version, manifest_version,
            target_character_id, target_payload_json, candidate_pool_json, field_rules_json,
            max_attempts, creator_status, creator_guess_count, creator_elapsed_ms, created_at,
            expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        challengeId,
        source.id,
        userId,
        source.mode_id,
        source.pool_rule_version,
        source.manifest_version,
        source.target_character_id,
        source.target_payload_json,
        source.candidate_pool_json,
        challengeFieldRules(source),
        source.max_attempts,
        source.status,
        source.guess_count,
        Math.max(0, source.completed_at - source.started_at),
        now,
        now + CHALLENGE_RETENTION_MS,
      )
      .run();
    const stored = await db
      .prepare("SELECT id FROM friend_challenges WHERE source_game_id = ?")
      .bind(sourceGameId)
      .first<{ id: string }>();
    if (!stored) throw new ApiProblem("INTERNAL_ERROR", 500);
    challengeId = stored.id;
  }
  return getFriendChallenge(db, challengeId, userId, now);
}

export async function getFriendChallenge(
  db: D1Database,
  challengeId: string,
  userId: string,
  now = Date.now(),
): Promise<FriendChallenge> {
  return toPublicChallenge(db, await readChallenge(db, challengeId, now), userId, now);
}

export async function getFriendChallengeCandidates(
  db: D1Database,
  challengeId: string,
  now = Date.now(),
): Promise<GameEntitySummary[]> {
  const challenge = await readChallenge(db, challengeId, now);
  const parsed = JSON.parse(challenge.candidate_pool_json) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ApiProblem("INTERNAL_ERROR", 500, { reason: "invalid-challenge-candidate-pool" });
  }
  return GameEntitySummarySchema.array().parse(Object.values(parsed));
}

export async function startFriendChallenge(
  db: D1Database,
  challengeId: string,
  userId: string,
  now = Date.now(),
): Promise<FriendChallenge> {
  const challenge = await readChallenge(db, challengeId, now);
  let official = await readAttempt(db, challengeId, userId, "official");
  if (official?.status === "active") return toPublicChallenge(db, challenge, userId, now);

  // 未完成而过期的正式局不应永久占用账号的首次正式成绩。
  if (official && !scoreOf(official)) {
    await db
      .prepare(
        `DELETE FROM friend_challenge_attempts
         WHERE challenge_id = ? AND user_id = ? AND kind = 'official'`,
      )
      .bind(challengeId, userId)
      .run();
    official = null;
  }

  const active = await readAttempt(db, challengeId, userId);
  if (active?.status === "active") return toPublicChallenge(db, challenge, userId, now);

  const kind = official && scoreOf(official) ? "practice" : "official";
  const gameId = crypto.randomUUID();
  const attemptId = crypto.randomUUID();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO games
             (id, user_id, mode, mode_id, activity_id, pool_rule_version, manifest_version,
              difficulty, date_key, target_character_id, target_payload_json,
              candidate_pool_json, field_rules_json, max_attempts, status, started_at, updated_at)
           VALUES (?, ?, 'random', ?, 'friend-challenge', ?, ?, 'standard', NULL,
                   ?, ?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(
          gameId,
          userId,
          challenge.mode_id,
          challenge.pool_rule_version,
          challenge.manifest_version,
          challenge.target_character_id,
          challenge.target_payload_json,
          challenge.candidate_pool_json,
          challenge.field_rules_json,
          challenge.max_attempts,
          now,
          now,
        ),
      db
        .prepare(
          `INSERT INTO friend_challenge_attempts
             (id, challenge_id, game_id, user_id, kind, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(attemptId, challengeId, gameId, userId, kind, now),
    ]);
  } catch (error) {
    const raced = await readAttempt(db, challengeId, userId);
    if (!raced) throw error;
  }
  return toPublicChallenge(db, challenge, userId, now);
}
