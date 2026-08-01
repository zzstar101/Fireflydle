import {
  CharacterSummarySchema,
  GuessResultSchema,
  type Character,
  type CreateGameRequest,
  type CurrentGames,
  type GuessResult,
  type PublicGame,
} from "@fireflydle/contracts";
import {
  ATTEMPTS_BY_DIFFICULTY,
  createGuessResult,
  getBeijingDateKey,
} from "@fireflydle/game-engine";
import { getCharacter, getTargetPool } from "../lib/db";
import { ApiProblem } from "../lib/http";

interface GameRow {
  id: string;
  user_id: string;
  mode: PublicGame["mode"];
  difficulty: PublicGame["difficulty"];
  date_key: string | null;
  target_character_id: string;
  target_payload_json: string;
  max_attempts: number;
  status: PublicGame["status"];
  started_at: number;
  completed_at: number | null;
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
  return db
    .prepare(
      `SELECT g.*, c.payload_json AS target_payload_json
       FROM games g JOIN characters c ON c.id = g.target_character_id
       WHERE g.id = ?`,
    )
    .bind(gameId)
    .first<GameRow>();
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

function toPublicGame(row: GameRow, guesses: GuessResult[], now: number): PublicGame {
  const finished = row.status !== "active";
  return {
    id: row.id,
    mode: row.mode,
    difficulty: row.difficulty,
    dateKey: row.date_key,
    maxAttempts: row.max_attempts,
    guesses,
    status: row.status,
    startedAt: new Date(row.started_at).toISOString(),
    completedAt: row.completed_at === null ? null : new Date(row.completed_at).toISOString(),
    elapsedMs: Math.max(0, (row.completed_at ?? now) - row.started_at),
    answer: finished ? CharacterSummarySchema.parse(JSON.parse(row.target_payload_json)) : null,
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

async function selectDailyTarget(
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

async function selectTarget(
  db: D1Database,
  input: CreateGameRequest,
  now: number,
): Promise<{ targetId: string; dateKey: string | null }> {
  const pool = await getTargetPool(db);
  const candidate = pool[secureRandomIndex(pool.length)];
  if (!candidate) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-pool" });
  if (input.mode === "random") return { targetId: candidate.id, dateKey: null };

  const dateKey = getBeijingDateKey(now);
  return { targetId: await selectDailyTarget(db, pool, dateKey, now), dateKey };
}

export async function createGame(
  db: D1Database,
  userId: string,
  input: CreateGameRequest,
  now = Date.now(),
): Promise<PublicGame> {
  const dateKey = input.mode === "daily" ? getBeijingDateKey(now) : undefined;
  const currentId = await readCurrentGameId(db, userId, input.mode, dateKey);
  if (currentId) return getPublicGame(db, currentId, userId, now);

  const target = await selectTarget(db, input, now);

  const gameId = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO games
           (id, user_id, mode, difficulty, date_key, target_character_id, max_attempts,
            status, started_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      )
      .bind(
        gameId,
        userId,
        input.mode,
        input.difficulty,
        target.dateKey,
        target.targetId,
        ATTEMPTS_BY_DIFFICULTY[input.difficulty],
        now,
        now,
      )
      .run();
  } catch (error) {
    const existingId = await readCurrentGameId(db, userId, input.mode, target.dateKey ?? undefined);
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
  const guess = await getCharacter(db, characterId);
  if (!guess) throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
  const target = JSON.parse(row.target_payload_json) as Character;
  const result = createGuessResult(target, guess, new Date(now));
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
