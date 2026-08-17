import {
  CharacterSchema,
  CharacterSummarySchema,
  FieldDefinitionSchema,
  GuessResultSchema,
  type Character,
  type CreateGameRequest,
  type CurrentGames,
  type FieldDefinition,
  type GuessResult,
  type PublicGame,
} from "@fireflydle/contracts";
import {
  createGuessResultWithRules,
  getBeijingDateKey,
  selectSnapshotFieldDefinitions,
  snapshotRulesFromFieldDefinitions,
  type SnapshotFieldRule,
} from "@fireflydle/game-engine";
import { contentManifest } from "@fireflydle/game-data";
import { getCharacterSnapshot, getEnabledCharacters, getTargetPool } from "../lib/db";
import { ApiProblem } from "../lib/http";

interface GameRow {
  id: string;
  user_id: string;
  mode: PublicGame["mode"];
  difficulty: PublicGame["difficulty"];
  date_key: string | null;
  target_character_id: string;
  max_attempts: number;
  status: PublicGame["status"];
  started_at: number;
  completed_at: number | null;
  mode_id: PublicGame["modeId"];
  activity_id: PublicGame["activityId"];
  pool_rule_version: PublicGame["poolRuleVersion"];
  manifest_version: PublicGame["manifestVersion"];
  target_payload_json: string;
  candidate_pool_json: string;
  field_rules_json: string;
}

interface GuessRow {
  result_json: string;
}

interface DailyTargetRow {
  character_id: string;
  cycle: number;
}

const REPLAY_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

function secureRandomIndex(length: number): number {
  if (length <= 0) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return (value[0] ?? 0) % length;
}

async function readGameRow(db: D1Database, gameId: string): Promise<GameRow | null> {
  return db.prepare(`SELECT * FROM games WHERE id = ?`).bind(gameId).first<GameRow>();
}

async function readGuessResults(db: D1Database, gameId: string): Promise<GuessResult[]> {
  const rows = await db
    .prepare("SELECT result_json FROM game_guesses WHERE game_id = ? ORDER BY ordinal")
    .bind(gameId)
    .all<GuessRow>();
  return rows.results.map((row) => GuessResultSchema.parse(JSON.parse(row.result_json)));
}

async function readCurrentGameId(
  db: D1Database,
  userId: string,
  mode: "daily" | "random",
  dateKey?: string,
): Promise<string | null> {
  const row =
    mode === "daily"
      ? await db
          .prepare(
            `SELECT id FROM games
             WHERE user_id = ? AND mode = 'daily' AND date_key = ?
             ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END,
                      started_at DESC, id DESC
             LIMIT 1`,
          )
          .bind(userId, dateKey)
          .first<{ id: string }>()
      : await db
          .prepare(
            `SELECT id FROM games
             WHERE user_id = ? AND mode = 'random' AND status = 'active'
             ORDER BY started_at DESC, id DESC
             LIMIT 1`,
          )
          .bind(userId)
          .first<{ id: string }>();
  return row?.id ?? null;
}

function fieldDefinitionsForRules(rules: readonly SnapshotFieldRule[]): FieldDefinition[] {
  const seen = new Set<string>();
  return rules.flatMap((rule) => {
    if (seen.has(rule.field)) return [];
    seen.add(rule.field);
    const definition = playableMode!.fields.find((field) => field.id === rule.field);
    return definition ? [definition] : [];
  });
}

function readFieldDefinitions(
  row: GameRow,
  rules: readonly SnapshotFieldRule[],
): FieldDefinition[] {
  const parsed = JSON.parse(row.field_rules_json) as unknown;
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const definitions = FieldDefinitionSchema.array().safeParse(
      (parsed as { definitions?: unknown }).definitions,
    );
    if (definitions.success) {
      const byId = new Map(definitions.data.map((field) => [field.id, field]));
      const ordered = rules.flatMap((rule) => {
        const definition = byId.get(rule.field);
        return definition ? [definition] : [];
      });
      if (ordered.length === rules.length) return ordered;
    }
  }
  return fieldDefinitionsForRules(rules);
}

function toPublicGame(row: GameRow, guesses: GuessResult[], now: number): PublicGame {
  const finished = row.status !== "active";
  const rules = readFieldRules(row);
  return {
    id: row.id,
    mode: row.mode,
    modeId: row.mode_id,
    activityId: row.activity_id,
    poolRuleVersion: row.pool_rule_version,
    manifestVersion: row.manifest_version,
    difficulty: row.difficulty,
    dateKey: row.date_key,
    maxAttempts: row.max_attempts,
    guesses,
    status: row.status,
    startedAt: new Date(row.started_at).toISOString(),
    completedAt: row.completed_at === null ? null : new Date(row.completed_at).toISOString(),
    elapsedMs: Math.max(0, (row.completed_at ?? now) - row.started_at),
    answer: finished ? CharacterSummarySchema.parse(JSON.parse(row.target_payload_json)) : null,
    fieldDefinitions: readFieldDefinitions(row, rules),
  };
}

export async function getPublicGame(
  db: D1Database,
  gameId: string,
  userId: string,
  now = Date.now(),
): Promise<PublicGame> {
  const row = await readGameRow(db, gameId);
  if (!row || row.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  return toPublicGame(row, await readGuessResults(db, gameId), now);
}

export async function getCurrentGames(
  db: D1Database,
  userId: string,
  now = Date.now(),
): Promise<CurrentGames> {
  const dateKey = getBeijingDateKey(now);
  const [dailyId, randomId] = await Promise.all([
    readCurrentGameId(db, userId, "daily", dateKey),
    readCurrentGameId(db, userId, "random"),
  ]);
  const [daily, random] = await Promise.all([
    dailyId ? getPublicGame(db, dailyId, userId, now) : null,
    randomId ? getPublicGame(db, randomId, userId, now) : null,
  ]);
  return {
    dateKey,
    serverNow: new Date(now).toISOString(),
    daily,
    random,
  };
}

export async function getReplayGame(
  db: D1Database,
  gameId: string,
  now = Date.now(),
): Promise<PublicGame> {
  const row = await readGameRow(db, gameId);
  if (!row) throw new ApiProblem("NOT_FOUND", 404);
  return toPublicGame(row, await readGuessResults(db, gameId), now);
}

async function selectDailyAnchor(
  db: D1Database,
  pool: Character[],
  dateKey: string,
  now: number,
): Promise<string> {
  for (let attempt = 0; attempt < pool.length + 2; attempt += 1) {
    const existing = await db
      .prepare("SELECT character_id, cycle FROM daily_target_schedule WHERE date_key = ?")
      .bind(dateKey)
      .first<DailyTargetRow>();
    if (existing) return existing.character_id;

    const latest = await db
      .prepare("SELECT MAX(cycle) AS cycle FROM daily_target_schedule")
      .first<{ cycle: number }>();
    let cycle = latest?.cycle ?? 0;
    const usedRows = await db
      .prepare("SELECT DISTINCT character_id FROM daily_target_schedule WHERE cycle = ?")
      .bind(cycle)
      .all<{ character_id: string }>();
    const used = new Set(usedRows.results.map((row) => row.character_id));
    let available = pool.filter((character) => !used.has(character.id));
    if (available.length === 0) {
      cycle += 1;
      available = pool;
    }
    const candidate = available[secureRandomIndex(available.length)];
    if (!candidate) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });

    await db
      .prepare(
        `INSERT OR IGNORE INTO daily_target_schedule
           (date_key, character_id, cycle, source, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, 'auto', NULL, ?, ?)`,
      )
      .bind(dateKey, candidate.id, cycle, now, now)
      .run();
  }
  throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "daily-target-contention" });
}

async function personalizedDailyIndex(
  poolLength: number,
  dateKey: string,
  userId: string,
  anchorCharacterId: string,
): Promise<number> {
  const input = new TextEncoder().encode(`${dateKey}\0${userId}\0${anchorCharacterId}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return new DataView(digest).getUint32(0, false) % poolLength;
}

async function selectTarget(
  db: D1Database,
  userId: string,
  input: CreateGameRequest,
  now: number,
): Promise<{
  targetId: string;
  dateKey: string | null;
  candidateSnapshots: Record<string, Character>;
}> {
  const pool = await getTargetPool(db);
  const candidatePool = await getEnabledCharacters(db);
  const candidateSnapshots = Object.fromEntries(candidatePool.map((item) => [item.id, item]));
  if (input.mode === "random") {
    const candidate = pool[secureRandomIndex(pool.length)];
    if (!candidate) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
    return { targetId: candidate.id, dateKey: null, candidateSnapshots };
  }

  const dateKey = getBeijingDateKey(now);
  const anchorCharacterId = await selectDailyAnchor(db, pool, dateKey, now);
  const target =
    pool[await personalizedDailyIndex(pool.length, dateKey, userId, anchorCharacterId)];
  if (!target) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  return { targetId: target.id, dateKey, candidateSnapshots };
}

const playableMode = contentManifest.modes.find((mode) => mode.id === "playable");
if (!playableMode) throw new Error("普通角色模式未注册");

const snapshotFieldRules: readonly SnapshotFieldRule[] = snapshotRulesFromFieldDefinitions(
  playableMode.fields,
);
if (snapshotFieldRules.length === 0) throw new Error("普通角色 manifest 没有可比较字段");

function readCandidateSnapshot(row: GameRow, characterId: string): Character | null {
  const encoded = JSON.parse(row.candidate_pool_json) as unknown;
  if (typeof encoded !== "object" || encoded === null || Array.isArray(encoded)) return null;
  const payload = (encoded as Record<string, unknown>)[characterId];
  const parsed = CharacterSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

function hasCandidateSnapshotPool(row: GameRow): boolean {
  const encoded = JSON.parse(row.candidate_pool_json) as unknown;
  return typeof encoded === "object" && encoded !== null && !Array.isArray(encoded);
}

function readFieldRules(row: GameRow): readonly SnapshotFieldRule[] {
  const parsed = JSON.parse(row.field_rules_json) as unknown;
  const encodedRules = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? (parsed as { rules?: unknown }).rules
      : null;
  if (!Array.isArray(encodedRules)) return snapshotFieldRules;
  const rules = encodedRules.filter((rule): rule is SnapshotFieldRule => {
    if (typeof rule !== "object" || rule === null) return false;
    const value = rule as { field?: unknown; comparison?: unknown };
    const definition = playableMode!.fields.find((field) => field.id === value.field);
    if (!definition) return false;
    if (value.comparison === "faction") return value.field === "faction";
    if (value.comparison === "version") return value.field === "version";
    return value.comparison === "exact" && definition.comparison === "exact";
  });
  return rules.length > 0 ? rules : snapshotFieldRules;
}

export async function createGame(
  db: D1Database,
  userId: string,
  input: CreateGameRequest,
  now = Date.now(),
): Promise<PublicGame> {
  const normalizedInput: CreateGameRequest = { mode: input.mode, difficulty: "standard" };
  const dateKey = normalizedInput.mode === "daily" ? getBeijingDateKey(now) : undefined;
  const currentId = await readCurrentGameId(db, userId, normalizedInput.mode, dateKey);
  if (currentId) return getPublicGame(db, currentId, userId, now);

  const target = await selectTarget(db, userId, normalizedInput, now);

  const gameId = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO games
           (id, user_id, mode, mode_id, activity_id, pool_rule_version, manifest_version,
            difficulty, date_key, target_character_id, target_payload_json,
            candidate_pool_json, field_rules_json, max_attempts, status, started_at, updated_at)
         VALUES (?, ?, ?, 'playable', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      )
      .bind(
        gameId,
        userId,
        normalizedInput.mode,
        normalizedInput.mode === "daily" ? "daily" : "practice",
        playableMode!.rulesVersion,
        contentManifest.manifestVersion,
        normalizedInput.difficulty,
        target.dateKey,
        target.targetId,
        JSON.stringify(
          (await getCharacterSnapshot(db, target.targetId)) ??
            (() => {
              throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
            })(),
        ),
        JSON.stringify(target.candidateSnapshots),
        JSON.stringify({
          rules: snapshotFieldRules,
          definitions: selectSnapshotFieldDefinitions(playableMode!.fields),
        }),
        playableMode!.maxAttempts,
        now,
        now,
      )
      .run();
  } catch (error) {
    const existingId = await readCurrentGameId(
      db,
      userId,
      normalizedInput.mode,
      target.dateKey ?? undefined,
    );
    if (existingId) return getPublicGame(db, existingId, userId, now);
    throw error;
  }
  return getPublicGame(db, gameId, userId, now);
}

export async function submitGameGuess(
  db: D1Database,
  gameId: string,
  userId: string,
  characterId: string,
  now = Date.now(),
): Promise<PublicGame> {
  const row = await readGameRow(db, gameId);
  if (!row || row.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  if (row.status !== "active") throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  const existingGuesses = await readGuessResults(db, gameId);
  if (existingGuesses.some((guess) => guess.character.id === characterId)) {
    throw new ApiProblem("GAME_DUPLICATE_GUESS", 409);
  }
  if (existingGuesses.length >= row.max_attempts) {
    throw new ApiProblem("GAME_ATTEMPTS_EXHAUSTED", 409);
  }
  let guess: Character | null;
  if (hasCandidateSnapshotPool(row)) {
    guess = readCandidateSnapshot(row, characterId);
  } else {
    const legacyIds = JSON.parse(row.candidate_pool_json) as unknown;
    if (!Array.isArray(legacyIds) || !legacyIds.includes(characterId)) {
      throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
    }
    guess = await getCharacterSnapshot(db, characterId);
  }
  if (!guess) throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
  const target = JSON.parse(row.target_payload_json) as Character;
  const result = createGuessResultWithRules(target, guess, readFieldRules(row), new Date(now));
  const guessId = crypto.randomUUID();
  const correct = result.isCorrect ? 1 : 0;

  const throwCurrentConflict = async (): Promise<never> => {
    const current = await readGameRow(db, gameId);
    if (!current || current.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
    if (current.status !== "active") throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
    const currentGuesses = await readGuessResults(db, gameId);
    if (currentGuesses.some((item) => item.character.id === characterId)) {
      throw new ApiProblem("GAME_DUPLICATE_GUESS", 409);
    }
    if (currentGuesses.length >= current.max_attempts) {
      throw new ApiProblem("GAME_ATTEMPTS_EXHAUSTED", 409);
    }
    throw new ApiProblem("GAME_ALREADY_FINISHED", 409, { reason: "state-contention" });
  };

  try {
    const [guessWrite] = await db.batch([
      db
        .prepare(
          `INSERT INTO game_guesses
             (id, game_id, ordinal, character_id, result_json, guessed_at)
           SELECT ?, game.id,
             (SELECT COUNT(*) + 1 FROM game_guesses WHERE game_id = game.id),
             ?, ?, ?
           FROM games game
           WHERE game.id = ? AND game.user_id = ? AND game.status = 'active'
             AND NOT EXISTS (
               SELECT 1 FROM game_guesses duplicate
               WHERE duplicate.game_id = game.id AND duplicate.character_id = ?
             )
             AND (
               SELECT COUNT(*) FROM game_guesses existing
               WHERE existing.game_id = game.id
             ) < game.max_attempts`,
        )
        .bind(guessId, characterId, JSON.stringify(result), now, gameId, userId, characterId),
      db
        .prepare(
          `UPDATE games SET
             status = CASE
               WHEN ? = 1 THEN 'won'
               WHEN (
                 SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id
               ) >= max_attempts THEN 'lost'
               ELSE 'active'
             END,
             completed_at = CASE
               WHEN ? = 1 OR (
                 SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id
               ) >= max_attempts THEN ?
               ELSE NULL
             END,
             updated_at = ?
           WHERE id = ? AND user_id = ? AND status = 'active'
             AND EXISTS (SELECT 1 FROM game_guesses WHERE id = ?)`,
        )
        .bind(correct, correct, now, now, gameId, userId, guessId),
      db
        .prepare(
          `INSERT OR IGNORE INTO game_results
             (game_id, user_id, mode, difficulty, date_key, result, guess_count,
              elapsed_ms, completed_at, replay_expires_at)
           SELECT game.id, game.user_id, game.mode, game.difficulty, game.date_key,
             game.status,
             (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id),
             MAX(0, ? - game.started_at), ?, ?
           FROM games game
           WHERE game.id = ? AND game.user_id = ? AND game.status IN ('won', 'lost')
             AND EXISTS (SELECT 1 FROM game_guesses WHERE id = ?)`,
        )
        .bind(now, now, now + REPLAY_RETENTION_MS, gameId, userId, guessId),
    ]);
    if ((guessWrite?.meta.changes ?? 0) !== 1) await throwCurrentConflict();
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      await throwCurrentConflict();
    }
    throw error;
  }
  return getPublicGame(db, gameId, userId, now);
}

export async function concedeGame(
  db: D1Database,
  gameId: string,
  userId: string,
  now = Date.now(),
): Promise<PublicGame> {
  const row = await readGameRow(db, gameId);
  if (!row || row.user_id !== userId) throw new ApiProblem("NOT_FOUND", 404);
  if (row.status !== "active") throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  if (row.mode === "daily") {
    throw new ApiProblem("FORBIDDEN", 403, { reason: "daily-cannot-concede" });
  }
  const [statusWrite] = await db.batch([
    db
      .prepare(
        `UPDATE games SET status = 'conceded', completed_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND status = 'active'`,
      )
      .bind(now, now, gameId, userId),
    db
      .prepare(
        `INSERT OR IGNORE INTO game_results
           (game_id, user_id, mode, difficulty, date_key, result, guess_count,
            elapsed_ms, completed_at, replay_expires_at)
         SELECT game.id, game.user_id, game.mode, game.difficulty, game.date_key,
           'conceded',
           (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id),
           MAX(0, ? - game.started_at), ?, ?
         FROM games game
         WHERE game.id = ? AND game.user_id = ? AND game.status = 'conceded'
           AND game.completed_at = ?`,
      )
      .bind(now, now, now + REPLAY_RETENTION_MS, gameId, userId, now),
  ]);
  if ((statusWrite?.meta.changes ?? 0) !== 1) {
    throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  }
  return getPublicGame(db, gameId, userId, now);
}
