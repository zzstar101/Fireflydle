import {
  CharacterSchema,
  CharacterSummarySchema,
  EndlessLastRoundSchema,
  FieldDefinitionSchema,
  GuessResultSchema,
  type Character,
  type EndlessLeaderboardEntry,
  type EndlessLastRound,
  type FieldDefinition,
  type GuessResult,
  type PublicEndlessRun,
} from "@fireflydle/contracts";
import {
  applyEndlessRoundOutcome,
  createGuessResultWithRules,
  ENDLESS_INITIAL_LIVES,
  ENDLESS_MAX_ATTEMPTS,
  pickFromShuffleBag,
  selectSnapshotFieldDefinitions,
  snapshotRulesFromFieldDefinitions,
  type SnapshotFieldRule,
} from "@fireflydle/game-engine";
import { contentManifest } from "@fireflydle/game-data";
import { getEnabledCharacters, getTargetPool } from "../lib/db";
import { ApiProblem } from "../lib/http";

interface EndlessRunRow {
  id: string;
  user_id: string;
  mode_id: "playable";
  status: "active" | "finished";
  lives: number;
  clears: number;
  total_guesses: number;
  skip_used: number;
  round_number: number;
  current_target_id: string;
  previous_target_id: string | null;
  consumed_target_ids_json: string;
  target_pool_json: string;
  candidate_pool_json: string;
  field_rules_json: string;
  pool_rule_version: string;
  manifest_version: string;
  last_round_json: string | null;
  started_at: number;
  round_started_at: number;
  completed_at: number | null;
  updated_at: number;
}

const playableMode =
  contentManifest.modes.find((mode) => mode.id === "playable") ??
  (() => {
    throw new Error("普通角色模式未注册");
  })();
const fieldRules = snapshotRulesFromFieldDefinitions(playableMode.fields);
const fieldDefinitions = selectSnapshotFieldDefinitions(playableMode.fields);

function secureRandomValue(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return (value[0] ?? 0) / 0x1_0000_0000;
}

async function readRun(db: D1Database, runId: string): Promise<EndlessRunRow | null> {
  return db.prepare("SELECT * FROM endless_runs WHERE id = ?").bind(runId).first<EndlessRunRow>();
}

async function readRoundGuesses(
  db: D1Database,
  runId: string,
  roundNumber: number,
): Promise<GuessResult[]> {
  const rows = await db
    .prepare(
      `SELECT result_json FROM endless_guesses
       WHERE run_id = ? AND round_number = ? ORDER BY ordinal`,
    )
    .bind(runId, roundNumber)
    .all<{ result_json: string }>();
  return rows.results.map((row) => GuessResultSchema.parse(JSON.parse(row.result_json)));
}

function readCandidates(row: EndlessRunRow): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(JSON.parse(row.candidate_pool_json) as Record<string, unknown>).flatMap(
      ([id, payload]) => {
        const parsed = CharacterSchema.safeParse(payload);
        return parsed.success ? [[id, parsed.data] as const] : [];
      },
    ),
  );
}

function readRules(row: EndlessRunRow): SnapshotFieldRule[] {
  const parsed = JSON.parse(row.field_rules_json) as { rules?: unknown };
  if (!Array.isArray(parsed.rules)) return fieldRules;
  const rules = parsed.rules.filter((rule): rule is SnapshotFieldRule => {
    if (typeof rule !== "object" || rule === null) return false;
    const value = rule as { field?: unknown; comparison?: unknown };
    return (
      typeof value.field === "string" &&
      (value.comparison === "exact" ||
        value.comparison === "faction" ||
        value.comparison === "version")
    );
  });
  return rules.length > 0 ? rules : fieldRules;
}

function readDefinitions(row: EndlessRunRow): FieldDefinition[] {
  const parsed = JSON.parse(row.field_rules_json) as { definitions?: unknown };
  const definitions = FieldDefinitionSchema.array().safeParse(parsed.definitions);
  return definitions.success ? definitions.data : fieldDefinitions;
}

async function toPublicRun(
  db: D1Database,
  row: EndlessRunRow,
  now: number,
): Promise<PublicEndlessRun> {
  const guesses = await readRoundGuesses(db, row.id, row.round_number);
  const candidates = readCandidates(row);
  const finished = row.status === "finished";
  return {
    id: row.id,
    modeId: "playable",
    activityId: "endless",
    lives: row.lives,
    clears: row.clears,
    totalGuesses: row.total_guesses + (finished ? 0 : guesses.length),
    skipAvailable: row.skip_used === 0 && !finished,
    status: row.status,
    roundNumber: row.round_number,
    maxAttempts: ENDLESS_MAX_ATTEMPTS,
    guesses,
    startedAt: new Date(row.started_at).toISOString(),
    completedAt: row.completed_at === null ? null : new Date(row.completed_at).toISOString(),
    elapsedMs: Math.max(0, (row.completed_at ?? now) - row.started_at),
    answer: finished ? CharacterSummarySchema.parse(candidates[row.current_target_id]) : null,
    lastRound:
      row.last_round_json === null
        ? null
        : EndlessLastRoundSchema.parse(JSON.parse(row.last_round_json)),
    fieldDefinitions: readDefinitions(row),
  };
}

function drawTarget(
  targetIds: readonly string[],
  consumedIds: readonly string[],
  previousTargetId?: string | null,
): { targetId: string; consumedIds: string[] } {
  const consumedIndexes = new Set(
    consumedIds.flatMap((id) => {
      const index = targetIds.indexOf(id);
      return index >= 0 ? [index] : [];
    }),
  );
  const previousIndex = previousTargetId ? targetIds.indexOf(previousTargetId) : undefined;
  const picked = pickFromShuffleBag(
    targetIds,
    consumedIndexes,
    secureRandomValue(),
    previousIndex === undefined || previousIndex < 0 ? undefined : previousIndex,
  );
  return {
    targetId: picked.item,
    consumedIds: picked.exhausted ? [picked.item] : [...consumedIds, picked.item],
  };
}

export async function createOrResumeEndlessRun(
  db: D1Database,
  userId: string,
  now = Date.now(),
): Promise<PublicEndlessRun> {
  const active = await db
    .prepare(
      "SELECT * FROM endless_runs WHERE user_id = ? AND mode_id = 'playable' AND status = 'active'",
    )
    .bind(userId)
    .first<EndlessRunRow>();
  if (active) return toPublicRun(db, active, now);

  const [targets, candidates] = await Promise.all([getTargetPool(db), getEnabledCharacters(db)]);
  const targetIds = targets.map((target) => target.id);
  if (targetIds.length === 0) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  const candidateSnapshots = Object.fromEntries(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const first = drawTarget(targetIds, []);
  const runId = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO endless_runs
           (id, user_id, lives, current_target_id, consumed_target_ids_json, target_pool_json,
            candidate_pool_json, field_rules_json, pool_rule_version, manifest_version,
            started_at, round_started_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        runId,
        userId,
        ENDLESS_INITIAL_LIVES,
        first.targetId,
        JSON.stringify(first.consumedIds),
        JSON.stringify(targetIds),
        JSON.stringify(candidateSnapshots),
        JSON.stringify({ rules: fieldRules, definitions: fieldDefinitions }),
        playableMode.rulesVersion,
        contentManifest.manifestVersion,
        now,
        now,
        now,
      )
      .run();
  } catch (error) {
    const existing = await db
      .prepare(
        "SELECT * FROM endless_runs WHERE user_id = ? AND mode_id = 'playable' AND status = 'active'",
      )
      .bind(userId)
      .first<EndlessRunRow>();
    if (existing) return toPublicRun(db, existing, now);
    throw error;
  }
  return getEndlessRun(db, runId, userId, now);
}

export async function getEndlessRun(
  db: D1Database,
  runId: string,
  userId: string,
  now = Date.now(),
): Promise<PublicEndlessRun> {
  const row = await readRun(db, runId);
  if (!row || row.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  return toPublicRun(db, row, now);
}

async function finishRound(
  db: D1Database,
  row: EndlessRunRow,
  result: "won" | "lost" | "skipped",
  guessCount: number,
  now: number,
): Promise<void> {
  const candidates = readCandidates(row);
  const answer = candidates[row.current_target_id];
  if (!answer) throw new ApiProblem("INTERNAL_ERROR", 500, { reason: "missing-target-snapshot" });
  const score = applyEndlessRoundOutcome(
    { lives: row.lives, clears: row.clears, totalGuesses: row.total_guesses },
    { outcome: result, guessesUsed: guessCount },
  );
  const lastRound: EndlessLastRound = {
    roundNumber: row.round_number,
    result,
    answer: CharacterSummarySchema.parse(answer),
    guessCount,
    completedAt: new Date(now).toISOString(),
  };
  if (score.lives === 0) {
    await db
      .prepare(
        `UPDATE endless_runs
         SET lives = 0, clears = ?, total_guesses = ?, status = 'finished',
             last_round_json = ?, completed_at = ?, updated_at = ?
         WHERE id = ? AND status = 'active'`,
      )
      .bind(score.clears, score.totalGuesses, JSON.stringify(lastRound), now, now, row.id)
      .run();
    return;
  }

  const targetIds = JSON.parse(row.target_pool_json) as string[];
  const consumedIds = JSON.parse(row.consumed_target_ids_json) as string[];
  const next = drawTarget(targetIds, consumedIds, row.current_target_id);
  await db
    .prepare(
      `UPDATE endless_runs
       SET lives = ?, clears = ?, total_guesses = ?, round_number = round_number + 1,
           previous_target_id = current_target_id, current_target_id = ?,
           consumed_target_ids_json = ?, last_round_json = ?, round_started_at = ?, updated_at = ?
       WHERE id = ? AND status = 'active'`,
    )
    .bind(
      score.lives,
      score.clears,
      score.totalGuesses,
      next.targetId,
      JSON.stringify(next.consumedIds),
      JSON.stringify(lastRound),
      now,
      now,
      row.id,
    )
    .run();
}

export async function submitEndlessGuess(
  db: D1Database,
  runId: string,
  userId: string,
  characterId: string,
  now = Date.now(),
): Promise<PublicEndlessRun> {
  const row = await readRun(db, runId);
  if (!row || row.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  if (row.status !== "active") throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  const guesses = await readRoundGuesses(db, row.id, row.round_number);
  if (guesses.some((guess) => guess.character.id === characterId)) {
    throw new ApiProblem("GAME_DUPLICATE_GUESS", 409);
  }
  const candidates = readCandidates(row);
  const target = candidates[row.current_target_id];
  const guess = candidates[characterId];
  if (!target || !guess) throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
  const result = createGuessResultWithRules(target, guess, readRules(row), new Date(now));
  const ordinal = guesses.length + 1;
  await db
    .prepare(
      `INSERT INTO endless_guesses
         (id, run_id, round_number, ordinal, character_id, result_json, guessed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      row.id,
      row.round_number,
      ordinal,
      characterId,
      JSON.stringify(result),
      now,
    )
    .run();
  if (result.isCorrect || ordinal >= ENDLESS_MAX_ATTEMPTS) {
    await finishRound(db, row, result.isCorrect ? "won" : "lost", ordinal, now);
  } else {
    await db.prepare("UPDATE endless_runs SET updated_at = ? WHERE id = ?").bind(now, row.id).run();
  }
  return getEndlessRun(db, row.id, userId, now);
}

export async function skipEndlessRound(
  db: D1Database,
  runId: string,
  userId: string,
  now = Date.now(),
): Promise<PublicEndlessRun> {
  const row = await readRun(db, runId);
  if (!row || row.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  if (row.status !== "active") throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  if (row.skip_used === 1) throw new ApiProblem("ENDLESS_SKIP_USED", 409);
  const guesses = await readRoundGuesses(db, row.id, row.round_number);
  const updated = await db
    .prepare("UPDATE endless_runs SET skip_used = 1, updated_at = ? WHERE id = ? AND skip_used = 0")
    .bind(now, row.id)
    .run();
  if (updated.meta.changes !== 1) throw new ApiProblem("ENDLESS_SKIP_USED", 409);
  await finishRound(db, { ...row, skip_used: 1 }, "skipped", guesses.length, now);
  return getEndlessRun(db, row.id, userId, now);
}

export async function getEndlessLeaderboard(db: D1Database): Promise<EndlessLeaderboardEntry[]> {
  const rows = await db
    .prepare(
      `SELECT u.display_name, u.is_guest, er.clears, er.total_guesses,
              er.started_at, er.completed_at
       FROM endless_runs er
       JOIN users u ON u.id = er.user_id
       WHERE er.mode_id = 'playable' AND er.status = 'finished'
         AND u.merged_into_user_id IS NULL
       ORDER BY er.clears DESC, er.total_guesses ASC,
                (er.completed_at - er.started_at) ASC, er.completed_at ASC, er.id ASC
       LIMIT 100`,
    )
    .all<{
      display_name: string;
      is_guest: number;
      clears: number;
      total_guesses: number;
      started_at: number;
      completed_at: number;
    }>();
  return rows.results.map((row, index) => ({
    rank: index + 1,
    displayName: row.display_name,
    isGuest: row.is_guest === 1,
    clears: row.clears,
    totalGuesses: row.total_guesses,
    elapsedMs: Math.max(0, row.completed_at - row.started_at),
    completedAt: new Date(row.completed_at).toISOString(),
  }));
}
