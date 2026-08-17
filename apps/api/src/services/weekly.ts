import {
  CharacterSchema,
  type Character,
  type PublicGame,
  type WeeklyRun,
} from "@fireflydle/contracts";
import {
  getBeijingWeekEnd,
  getBeijingWeekKey,
  selectSnapshotFieldDefinitions,
  snapshotRulesFromFieldDefinitions,
} from "@fireflydle/game-engine";
import { contentManifest } from "@fireflydle/game-data";
import { getEnabledCharacters, getTargetPool } from "../lib/db";
import { ApiProblem } from "../lib/http";
import { getPublicGame, getReplayGame } from "./games";

const WEEKLY_QUESTION_COUNT = 5;

interface WeeklyScheduleRow {
  week_key: string;
  manifest_version: string;
  rules_version: string;
  targets_json: string;
  candidate_pool_json: string;
  field_rules_json: string;
}

interface WeeklyRunRow {
  id: string;
  user_id: string;
  week_key: string;
  official: number;
  status: "active" | "completed";
  correct_count: number;
  total_guesses: number;
  started_at: number;
  completed_at: number | null;
}

interface WeeklyRoundRow {
  ordinal: number;
  game_id: string;
  status: PublicGame["status"];
}

const playableMode =
  contentManifest.modes.find((mode) => mode.id === "playable") ??
  (() => {
    throw new Error("普通角色模式未注册");
  })();
const weeklyRules = snapshotRulesFromFieldDefinitions(playableMode.fields);
const weeklyFieldSnapshot = JSON.stringify({
  rules: weeklyRules,
  definitions: selectSnapshotFieldDefinitions(playableMode.fields),
});

async function deterministicTargets(
  pool: readonly Character[],
  weekKey: string,
): Promise<Character[]> {
  const ranked = await Promise.all(
    pool.map(async (character) => ({
      character,
      digest: Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(`${weekKey}\0${character.id}`),
          ),
        ),
      )
        .map((value) => value.toString(16).padStart(2, "0"))
        .join(""),
    })),
  );
  return ranked
    .toSorted((left, right) => left.digest.localeCompare(right.digest))
    .slice(0, WEEKLY_QUESTION_COUNT)
    .map((entry) => entry.character);
}

async function ensureSchedule(
  db: D1Database,
  weekKey: string,
  now: number,
): Promise<WeeklyScheduleRow> {
  const existing = await db
    .prepare("SELECT * FROM weekly_schedules WHERE week_key = ?")
    .bind(weekKey)
    .first<WeeklyScheduleRow>();
  if (existing) return existing;

  const [targetPool, candidatePool] = await Promise.all([
    getTargetPool(db),
    getEnabledCharacters(db),
  ]);
  if (targetPool.length < WEEKLY_QUESTION_COUNT) {
    throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "weekly-pool-too-small" });
  }
  const targets = await deterministicTargets(targetPool, weekKey);
  const candidates = Object.fromEntries(
    candidatePool.map((character) => [character.id, character]),
  );
  await db
    .prepare(
      `INSERT OR IGNORE INTO weekly_schedules
         (week_key, manifest_version, rules_version, targets_json,
          candidate_pool_json, field_rules_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      weekKey,
      contentManifest.manifestVersion,
      playableMode.rulesVersion,
      JSON.stringify(targets),
      JSON.stringify(candidates),
      weeklyFieldSnapshot,
      now,
    )
    .run();
  const stored = await db
    .prepare("SELECT * FROM weekly_schedules WHERE week_key = ?")
    .bind(weekKey)
    .first<WeeklyScheduleRow>();
  if (!stored) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "weekly-schedule" });
  return stored;
}

async function readRun(db: D1Database, runId: string): Promise<WeeklyRunRow | null> {
  return db.prepare("SELECT * FROM weekly_runs WHERE id = ?").bind(runId).first<WeeklyRunRow>();
}

async function ensureNextRound(
  db: D1Database,
  run: WeeklyRunRow,
  schedule: WeeklyScheduleRow,
  now: number,
): Promise<void> {
  if (run.status !== "active") return;
  const rounds = await db
    .prepare(
      `SELECT wr.ordinal, wr.game_id, g.status
       FROM weekly_rounds wr JOIN games g ON g.id = wr.game_id
       WHERE wr.run_id = ? ORDER BY wr.ordinal`,
    )
    .bind(run.id)
    .all<WeeklyRoundRow>();
  const latest = rounds.results.at(-1);
  if (latest?.status === "active" || rounds.results.length >= WEEKLY_QUESTION_COUNT) return;

  const ordinal = rounds.results.length + 1;
  const targets = CharacterSchema.array().parse(JSON.parse(schedule.targets_json));
  const target = targets[ordinal - 1];
  if (!target) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "weekly-target" });
  const gameId = crypto.randomUUID();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO games
             (id, user_id, mode, mode_id, activity_id, pool_rule_version, manifest_version,
              difficulty, date_key, target_character_id, target_payload_json,
              candidate_pool_json, field_rules_json, max_attempts, status, started_at, updated_at)
           VALUES (?, ?, 'random', 'playable', 'weekly', ?, ?, 'standard', ?, ?, ?, ?, ?, ?,
                   'active', ?, ?)`,
        )
        .bind(
          gameId,
          run.user_id,
          schedule.rules_version,
          schedule.manifest_version,
          run.week_key,
          target.id,
          JSON.stringify(target),
          schedule.candidate_pool_json,
          schedule.field_rules_json,
          playableMode.maxAttempts,
          now,
          now,
        ),
      db
        .prepare("INSERT INTO weekly_rounds (run_id, ordinal, game_id) VALUES (?, ?, ?)")
        .bind(run.id, ordinal, gameId),
    ]);
  } catch (error) {
    const raced = await db
      .prepare("SELECT game_id FROM weekly_rounds WHERE run_id = ? AND ordinal = ?")
      .bind(run.id, ordinal)
      .first<{ game_id: string }>();
    if (!raced) throw error;
  }
}

async function publicRun(
  db: D1Database,
  run: WeeklyRunRow,
  schedule: WeeklyScheduleRow,
  now: number,
  shared = false,
): Promise<WeeklyRun> {
  const roundRows = await db
    .prepare("SELECT game_id FROM weekly_rounds WHERE run_id = ? ORDER BY ordinal")
    .bind(run.id)
    .all<{ game_id: string }>();
  const games = await Promise.all(
    roundRows.results.map((round) =>
      shared
        ? getReplayGame(db, round.game_id, now)
        : getPublicGame(db, round.game_id, run.user_id, now),
    ),
  );
  return {
    id: run.id,
    weekKey: run.week_key,
    weekEndsAt: new Date(
      getBeijingWeekEnd(Date.parse(`${run.week_key}T00:00:00+08:00`)),
    ).toISOString(),
    manifestVersion: schedule.manifest_version,
    rulesVersion: schedule.rules_version,
    official: run.official === 1,
    status: run.status,
    questionCount: WEEKLY_QUESTION_COUNT,
    correctCount: run.correct_count,
    totalGuesses: run.total_guesses,
    elapsedMs: Math.max(0, (run.completed_at ?? now) - run.started_at),
    startedAt: new Date(run.started_at).toISOString(),
    completedAt: run.completed_at === null ? null : new Date(run.completed_at).toISOString(),
    games,
    currentGame: games.find((game) => game.status === "active") ?? null,
  };
}

export async function startWeeklyRun(
  db: D1Database,
  userId: string,
  isGuest: boolean,
  practice: boolean,
  now = Date.now(),
): Promise<WeeklyRun> {
  const weekKey = getBeijingWeekKey(now);
  const schedule = await ensureSchedule(db, weekKey, now);
  const official = !isGuest && !practice;
  let run = await db
    .prepare(
      official
        ? "SELECT * FROM weekly_runs WHERE user_id = ? AND week_key = ? AND official = 1"
        : `SELECT * FROM weekly_runs
           WHERE user_id = ? AND week_key = ? AND official = 0 AND status = 'active'
           ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(userId, weekKey)
    .first<WeeklyRunRow>();
  if (!run) {
    const runId = crypto.randomUUID();
    try {
      await db
        .prepare(
          `INSERT INTO weekly_runs
             (id, user_id, week_key, official, status, started_at, updated_at)
           VALUES (?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(runId, userId, weekKey, official ? 1 : 0, now, now)
        .run();
    } catch (error) {
      run = await db
        .prepare(
          official
            ? "SELECT * FROM weekly_runs WHERE user_id = ? AND week_key = ? AND official = 1"
            : `SELECT * FROM weekly_runs
               WHERE user_id = ? AND week_key = ? AND official = 0 AND status = 'active'`,
        )
        .bind(userId, weekKey)
        .first<WeeklyRunRow>();
      if (!run) throw error;
    }
    run ??= await readRun(db, runId);
  }
  if (!run) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "weekly-run" });
  await ensureNextRound(db, run, schedule, now);
  const refreshed = (await readRun(db, run.id)) ?? run;
  return publicRun(db, refreshed, schedule, now);
}

export async function getWeeklyRun(
  db: D1Database,
  runId: string,
  userId: string,
  now = Date.now(),
): Promise<WeeklyRun> {
  const run = await readRun(db, runId);
  if (!run || run.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  const schedule = await ensureSchedule(db, run.week_key, now);
  await ensureNextRound(db, run, schedule, now);
  const refreshed = (await readRun(db, run.id)) ?? run;
  return publicRun(db, refreshed, schedule, now);
}

export async function getCurrentWeeklyRun(
  db: D1Database,
  userId: string,
  now = Date.now(),
): Promise<WeeklyRun | null> {
  const weekKey = getBeijingWeekKey(now);
  const run = await db
    .prepare(
      `SELECT * FROM weekly_runs WHERE user_id = ? AND week_key = ?
       ORDER BY status = 'active' DESC, official DESC, started_at DESC LIMIT 1`,
    )
    .bind(userId, weekKey)
    .first<WeeklyRunRow>();
  if (!run) return null;
  return getWeeklyRun(db, run.id, userId, now);
}

export async function getSharedWeeklyRun(
  db: D1Database,
  tokenHash: string,
  now = Date.now(),
): Promise<Omit<WeeklyRun, "currentGame">> {
  const share = await db
    .prepare(
      `SELECT wr.* FROM weekly_run_shares share
       JOIN weekly_runs wr ON wr.id = share.run_id
       WHERE share.token_hash = ? AND share.revoked_at IS NULL AND share.expires_at > ?
         AND wr.status = 'completed'`,
    )
    .bind(tokenHash, now)
    .first<WeeklyRunRow>();
  if (!share) throw new ApiProblem("NOT_FOUND", 404);
  const schedule = await ensureSchedule(db, share.week_key, now);
  const { currentGame: _currentGame, ...shared } = await publicRun(db, share, schedule, now, true);
  return shared;
}
