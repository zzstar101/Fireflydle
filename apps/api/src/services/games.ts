import {
  CharacterSchema,
  AeonSummarySchema,
  CurrencyWarsUnitSummarySchema,
  CurrencyWarsUnitSchema,
  GameEntitySummarySchema,
  NpcSummarySchema,
  FieldDefinitionSchema,
  GuessResultSchema,
  type Character,
  type CreateGameRequest,
  type CurrentGames,
  type FieldDefinition,
  type GuessResult,
  type GameEntitySummary,
  type PublicGame,
  type NpcSummary,
  type CurrencyWarsUnit,
} from "@fireflydle/contracts";
import {
  createGuessResultWithRules,
  createInferenceReview,
  createInferenceReviewForEntities,
  createNpcGuessResult,
  createCurrencyWarsGuessResult,
  createAeonGuessResult,
  compareNpcEntities,
  compareCurrencyWarsUnits,
  CURRENCY_WARS_FIELD_RULES,
  getBeijingDateKey,
  NPC_SNAPSHOT_FIELD_RULES,
  selectSnapshotFieldDefinitions,
  snapshotRulesFromFieldDefinitions,
  type SnapshotFieldRule,
} from "@fireflydle/game-engine";
import {
  contentManifest,
  aeonEntities,
  aeonManifest,
  currencyWarsManifest,
  currencyWarsRuleset,
  currencyWarsUnitSummaries,
  npcEntities,
  npcManifest,
  npcSummary,
} from "@fireflydle/game-data";
import { getCharacterSnapshot, getEnabledCharacters, getTargetPool } from "../lib/db";
import { ApiProblem } from "../lib/http";
import { evaluateGameResult } from "./achievements";

interface GameRow {
  id: string;
  user_id: string;
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
  activityId: "daily" | "practice",
  dateKey?: string,
  modeId: PublicGame["modeId"] = "playable",
): Promise<string | null> {
  const row =
    activityId === "daily"
      ? await db
          .prepare(
            `SELECT id FROM games
             WHERE user_id = ? AND activity_id = 'daily' AND date_key = ? AND mode_id = ?
             ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END,
                      started_at DESC, id DESC
             LIMIT 1`,
          )
          .bind(userId, dateKey, modeId)
          .first<{ id: string }>()
      : await db
          .prepare(
            `SELECT id FROM games
             WHERE user_id = ? AND activity_id = 'practice' AND status = 'active'
               AND mode_id = ?
             ORDER BY started_at DESC, id DESC
             LIMIT 1`,
          )
          .bind(userId, modeId)
          .first<{ id: string }>();
  return row?.id ?? null;
}

function fieldDefinitionsForRules(
  rules: readonly SnapshotFieldRule[],
  modeId: PublicGame["modeId"] = "playable",
): FieldDefinition[] {
  const seen = new Set<string>();
  const definitions =
    modeId === "npc"
      ? npcMode.fields
      : modeId === "aeon"
        ? aeonMode.fields
        : modeId === "currency-wars"
          ? currencyWarsMode.fields
          : playableMode!.fields;
  return rules.flatMap((rule) => {
    if (seen.has(rule.field)) return [];
    seen.add(rule.field);
    const definition = definitions.find((field) => field.id === rule.field);
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
  return fieldDefinitionsForRules(rules, row.mode_id);
}

function readAeonRevealSeed(row: GameRow): string {
  const parsed = JSON.parse(row.field_rules_json) as unknown;
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const seed = (parsed as { aeonRevealSeed?: unknown }).aeonRevealSeed;
    if (typeof seed === "string" && seed.length > 0) return seed;
  }
  return row.id;
}

function toPublicGame(row: GameRow, guesses: GuessResult[], now: number): PublicGame {
  const finished = row.status !== "active";
  const rules = readFieldRules(row);
  const target = GameEntitySummarySchema.parse(JSON.parse(row.target_payload_json));
  const inferenceReview = finished ? createModeInferenceReview(row, guesses) : null;
  return {
    id: row.id,
    modeId: row.mode_id,
    activityId: row.activity_id,
    poolRuleVersion: row.pool_rule_version,
    manifestVersion: row.manifest_version,
    dateKey: row.date_key,
    maxAttempts: row.max_attempts,
    guesses,
    status: row.status,
    startedAt: new Date(row.started_at).toISOString(),
    completedAt: row.completed_at === null ? null : new Date(row.completed_at).toISOString(),
    elapsedMs: Math.max(0, (row.completed_at ?? now) - row.started_at),
    answer: finished ? target : null,
    ...(row.mode_id === "aeon" && "imagePath" in target.assets
      ? {
          aeonImagePath: target.assets.imagePath,
          aeonImageFocus: target.assets.focus,
          aeonRevealSeed: readAeonRevealSeed(row),
        }
      : {}),
    fieldDefinitions: readFieldDefinitions(row, rules),
    ...(inferenceReview ? { inferenceReview } : {}),
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
  const [dailyId, practiceId] = await Promise.all([
    readCurrentGameId(db, userId, "daily", dateKey),
    readCurrentGameId(db, userId, "practice"),
  ]);
  const [daily, practice] = await Promise.all([
    dailyId ? getPublicGame(db, dailyId, userId, now) : null,
    practiceId ? getPublicGame(db, practiceId, userId, now) : null,
  ]);
  return {
    dateKey,
    serverNow: new Date(now).toISOString(),
    daily,
    practice,
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
  candidateSnapshots: Record<string, GameEntitySummary>;
}> {
  if (input.modeId === "aeon") {
    if (input.activityId !== "practice") {
      throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "aeon-practice-only" });
    }
    const targets = aeonTargetPool.targetIds.flatMap((id) => {
      const entity = aeonById.get(id);
      return entity ? [entity] : [];
    });
    const candidateSnapshots = Object.fromEntries(
      aeonCandidatePool.candidateIds.flatMap((id) => {
        const entity = aeonById.get(id);
        return entity ? [[id, entity] as const] : [];
      }),
    );
    const target = targets[secureRandomIndex(targets.length)];
    if (!target) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-aeon-pool" });
    return { targetId: target.id, dateKey: null, candidateSnapshots };
  }
  if (input.modeId === "currency-wars") {
    if (input.activityId !== "practice")
      throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "currency-wars-practice-only" });
    const targets = currencyWarsTargetPool.targetIds.flatMap((id) => {
      const unit = currencyWarsById.get(id);
      return unit ? [unit] : [];
    });
    const candidateSnapshots = Object.fromEntries(
      currencyWarsCandidatePool.candidateIds.flatMap((id) => {
        const unit = currencyWarsById.get(id);
        return unit ? [[id, unit] as const] : [];
      }),
    );
    const target = targets[secureRandomIndex(targets.length)];
    if (!target)
      throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-currency-wars-pool" });
    return { targetId: target.id, dateKey: null, candidateSnapshots };
  }
  if (input.modeId === "npc") {
    if (input.activityId !== "practice") {
      throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "npc-practice-only" });
    }
    const targets = npcTargetPool.targetIds.flatMap((id) => {
      const entity = npcById.get(id);
      return entity ? [entity] : [];
    });
    const candidateSnapshots = Object.fromEntries(
      npcCandidatePool.candidateIds.flatMap((id) => {
        const entity = npcById.get(id);
        return entity ? [[id, entity] as const] : [];
      }),
    );
    const target = targets[secureRandomIndex(targets.length)];
    if (!target) throw new ApiProblem("INTERNAL_ERROR", 503, { reason: "empty-npc-pool" });
    return { targetId: target.id, dateKey: null, candidateSnapshots };
  }
  const pool = await getTargetPool(db);
  const candidatePool = await getEnabledCharacters(db);
  const candidateSnapshots = Object.fromEntries(candidatePool.map((item) => [item.id, item]));
  if (input.activityId === "practice") {
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
const npcMode =
  npcManifest.modes.find((mode) => mode.id === "npc") ??
  (() => {
    throw new Error("NPC 模式未注册");
  })();
const npcTargetPool =
  npcManifest.pools.find((pool) => pool.id === npcMode.targetPoolId) ??
  (() => {
    throw new Error("NPC 目标池未注册");
  })();
const npcCandidatePool =
  npcManifest.pools.find((pool) => pool.id === npcMode.candidatePoolId) ??
  (() => {
    throw new Error("NPC 候选池未注册");
  })();
const npcById = new Map(npcEntities.map((entity) => [entity.id, npcSummary(entity)]));
const aeonMode =
  aeonManifest.modes.find((mode) => mode.id === "aeon") ??
  (() => {
    throw new Error("星神模式未注册");
  })();
const aeonTargetPool = aeonManifest.pools.find((pool) => pool.id === aeonMode.targetPoolId)!;
const aeonCandidatePool = aeonManifest.pools.find((pool) => pool.id === aeonMode.candidatePoolId)!;
const aeonById = new Map(aeonEntities.map((entity) => [entity.id, entity]));
const currencyWarsMode =
  currencyWarsManifest.modes.find((mode) => mode.id === "currency-wars") ??
  (() => {
    throw new Error("货币战争模式未注册");
  })();
const currencyWarsTargetPool = currencyWarsManifest.pools.find(
  (pool) => pool.id === currencyWarsMode.targetPoolId,
)!;
const currencyWarsCandidatePool = currencyWarsManifest.pools.find(
  (pool) => pool.id === currencyWarsMode.candidatePoolId,
)!;
const currencyWarsById = new Map(currencyWarsUnitSummaries.map((unit) => [unit.id, unit]));

const snapshotFieldRules: readonly SnapshotFieldRule[] = snapshotRulesFromFieldDefinitions(
  playableMode.fields,
);
if (snapshotFieldRules.length === 0) throw new Error("普通角色 manifest 没有可比较字段");

function readCandidateSnapshot(row: GameRow, characterId: string): GameEntitySummary | null {
  const encoded = JSON.parse(row.candidate_pool_json) as unknown;
  if (typeof encoded !== "object" || encoded === null || Array.isArray(encoded)) return null;
  const payload = (encoded as Record<string, unknown>)[characterId];
  const parsed =
    row.mode_id === "npc"
      ? NpcSummarySchema.safeParse(payload)
      : row.mode_id === "aeon"
        ? AeonSummarySchema.safeParse(payload)
        : row.mode_id === "currency-wars"
          ? CurrencyWarsUnitSummarySchema.safeParse(payload)
          : CharacterSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

function hasCandidateSnapshotPool(row: GameRow): boolean {
  const encoded = JSON.parse(row.candidate_pool_json) as unknown;
  return typeof encoded === "object" && encoded !== null && !Array.isArray(encoded);
}

function readPlayableCandidatePool(row: GameRow): Character[] | null {
  const encoded = JSON.parse(row.candidate_pool_json) as unknown;
  if (typeof encoded !== "object" || encoded === null || Array.isArray(encoded)) return null;
  const parsed = CharacterSchema.array().safeParse(Object.values(encoded));
  return parsed.success && parsed.data.length > 0 ? parsed.data : null;
}

function readModeCandidatePool(
  row: GameRow,
): Character[] | NpcSummary[] | CurrencyWarsUnit[] | null {
  const encoded = JSON.parse(row.candidate_pool_json) as unknown;
  if (typeof encoded !== "object" || encoded === null || Array.isArray(encoded)) return null;
  const values = Object.values(encoded);
  if (row.mode_id === "npc") {
    const parsed = NpcSummarySchema.array().safeParse(values);
    return parsed.success && parsed.data.length > 0 ? parsed.data : null;
  }
  if (row.mode_id === "currency-wars") {
    const ids = values.flatMap((value) => {
      const parsed = CurrencyWarsUnitSummarySchema.shape.id.safeParse(
        (value as { id?: unknown }).id,
      );
      return parsed.success ? [parsed.data] : [];
    });
    const units = ids.flatMap((id) => {
      const unit = currencyWarsRuleset.units.find((entry) => entry.id === id);
      return unit ? [unit] : [];
    });
    return units.length > 0 ? units : null;
  }
  if (row.mode_id === "playable") return readPlayableCandidatePool(row);
  return null;
}

function createModeInferenceReview(row: GameRow, guesses: GuessResult[]) {
  const candidates = readModeCandidatePool(row);
  if (!candidates) return null;
  if (row.mode_id === "npc") {
    const npcCandidates = candidates as NpcSummary[];
    return createInferenceReviewForEntities(npcCandidates, guesses, (target, guess) =>
      compareNpcEntities(target, guess),
    );
  }
  if (row.mode_id === "currency-wars") {
    const currencyCandidates = candidates as CurrencyWarsUnit[];
    return createInferenceReviewForEntities(currencyCandidates, guesses, (target, guess) =>
      compareCurrencyWarsUnits(target, guess),
    );
  }
  return createInferenceReview(candidates as Character[], guesses, readFieldRules(row));
}

function readFieldRules(row: GameRow): readonly SnapshotFieldRule[] {
  const parsed = JSON.parse(row.field_rules_json) as unknown;
  const encodedRules = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? (parsed as { rules?: unknown }).rules
      : null;
  const fallbackRules =
    row.mode_id === "npc"
      ? NPC_SNAPSHOT_FIELD_RULES
      : row.mode_id === "aeon"
        ? [{ field: "image", comparison: "exact" as const }]
        : row.mode_id === "currency-wars"
          ? CURRENCY_WARS_FIELD_RULES
          : snapshotFieldRules;
  const definitions =
    row.mode_id === "npc"
      ? npcMode.fields
      : row.mode_id === "aeon"
        ? aeonMode.fields
        : row.mode_id === "currency-wars"
          ? currencyWarsMode.fields
          : playableMode!.fields;
  if (!Array.isArray(encodedRules)) return fallbackRules;
  const rules = encodedRules.filter((rule): rule is SnapshotFieldRule => {
    if (typeof rule !== "object" || rule === null) return false;
    const value = rule as { field?: unknown; comparison?: unknown };
    const definition = definitions.find((field) => field.id === value.field);
    if (!definition) return false;
    if (value.comparison === "faction")
      return value.field === "faction" || value.field === "synergies";
    if (value.comparison === "version") {
      return value.field === "version" || value.field === "debut-version" || value.field === "cost";
    }
    return value.comparison === "exact" && definition.comparison === "exact";
  });
  return rules.length > 0 ? rules : fallbackRules;
}

function readCurrencyWarsUnit(row: GameRow, unitId: string) {
  const parsed = JSON.parse(row.field_rules_json) as unknown;
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const units = CurrencyWarsUnitSchema.array().safeParse(
      (parsed as { currencyWarsUnits?: unknown }).currencyWarsUnits,
    );
    if (units.success) return units.data.find((unit) => unit.id === unitId) ?? null;
  }
  return currencyWarsRuleset.units.find((unit) => unit.id === unitId) ?? null;
}

export async function createGame(
  db: D1Database,
  userId: string,
  input: CreateGameRequest,
  now = Date.now(),
): Promise<PublicGame> {
  if (input.activityId === "daily" && input.modeId !== "playable") {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "daily-playable-only" });
  }
  const dateKey = input.activityId === "daily" ? getBeijingDateKey(now) : undefined;
  const currentId = await readCurrentGameId(db, userId, input.activityId, dateKey, input.modeId);
  if (currentId) return getPublicGame(db, currentId, userId, now);

  const target = await selectTarget(db, userId, input, now);

  const gameId = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO games
           (id, user_id, mode, mode_id, activity_id, pool_rule_version, manifest_version,
            difficulty, date_key, target_character_id, target_payload_json,
            candidate_pool_json, field_rules_json, max_attempts, status, started_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      )
      .bind(
        gameId,
        userId,
        input.activityId === "daily" ? "daily" : "random",
        input.modeId,
        input.activityId,
        input.modeId === "npc"
          ? npcMode.rulesVersion
          : input.modeId === "aeon"
            ? aeonMode.rulesVersion
            : input.modeId === "currency-wars"
              ? currencyWarsMode.rulesVersion
              : playableMode!.rulesVersion,
        input.modeId === "npc"
          ? npcManifest.manifestVersion
          : input.modeId === "aeon"
            ? aeonManifest.manifestVersion
            : input.modeId === "currency-wars"
              ? currencyWarsManifest.manifestVersion
              : contentManifest.manifestVersion,
        "standard",
        target.dateKey,
        target.targetId,
        JSON.stringify(
          (input.modeId === "npc" || input.modeId === "aeon" || input.modeId === "currency-wars"
            ? target.candidateSnapshots[target.targetId]
            : await getCharacterSnapshot(db, target.targetId)) ??
            (() => {
              throw new ApiProblem("NOT_FOUND", 404, { entity: "character" });
            })(),
        ),
        JSON.stringify(target.candidateSnapshots),
        JSON.stringify({
          rules:
            input.modeId === "npc"
              ? NPC_SNAPSHOT_FIELD_RULES
              : input.modeId === "aeon"
                ? [{ field: "image", comparison: "exact" }]
                : input.modeId === "currency-wars"
                  ? CURRENCY_WARS_FIELD_RULES
                  : snapshotFieldRules,
          ...(input.modeId === "currency-wars"
            ? { currencyWarsUnits: currencyWarsRuleset.units }
            : {}),
          definitions:
            input.modeId === "npc"
              ? npcMode.fields
              : input.modeId === "aeon"
                ? aeonMode.fields
                : input.modeId === "currency-wars"
                  ? currencyWarsMode.fields
                  : selectSnapshotFieldDefinitions(playableMode!.fields),
        }),
        input.modeId === "npc"
          ? npcMode.maxAttempts
          : input.modeId === "aeon"
            ? aeonMode.maxAttempts
            : input.modeId === "currency-wars"
              ? currencyWarsMode.maxAttempts
              : playableMode!.maxAttempts,
        now,
        now,
      )
      .run();
  } catch (error) {
    const existingId = await readCurrentGameId(
      db,
      userId,
      input.activityId,
      target.dateKey ?? undefined,
      input.modeId,
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
  let guess: GameEntitySummary | null;
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
  const targetPayload = JSON.parse(row.target_payload_json) as unknown;
  const result =
    row.mode_id === "npc"
      ? createNpcGuessResult(
          NpcSummarySchema.parse(targetPayload),
          NpcSummarySchema.parse(guess),
          new Date(now),
        )
      : row.mode_id === "aeon"
        ? createAeonGuessResult(
            AeonSummarySchema.parse(targetPayload),
            AeonSummarySchema.parse(guess),
            new Date(now),
          )
        : row.mode_id === "currency-wars"
          ? createCurrencyWarsGuessResult(
              readCurrencyWarsUnit(row, JSON.parse(row.target_payload_json).id) ??
                (() => {
                  throw new ApiProblem("INTERNAL_ERROR", 500);
                })(),
              readCurrencyWarsUnit(row, characterId) ??
                (() => {
                  throw new ApiProblem("NOT_FOUND", 404);
                })(),
              new Date(now),
            )
          : createGuessResultWithRules(
              CharacterSchema.parse(targetPayload),
              CharacterSchema.parse(guess),
              readFieldRules(row),
              new Date(now),
            );
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
             (game_id, user_id, mode, mode_id, activity_id, difficulty, date_key, result, guess_count,
              elapsed_ms, completed_at, replay_expires_at)
           SELECT game.id, game.user_id, game.mode, game.mode_id, game.activity_id,
             game.difficulty, game.date_key,
             game.status,
             (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id),
             MAX(0, ? - game.started_at), ?, ?
           FROM games game
           WHERE game.id = ? AND game.user_id = ? AND game.status IN ('won', 'lost')
             AND game.activity_id != 'friend-challenge'
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
  const completed = await readGameRow(db, gameId);
  if (completed?.status === "won" || completed?.status === "lost")
    await evaluateGameResult(db, gameId, now);
  if (completed?.activity_id === "weekly" && completed.status !== "active") {
    await settleWeeklyRun(db, gameId, now);
  }
  return getPublicGame(db, gameId, userId, now);
}

async function settleWeeklyRun(db: D1Database, gameId: string, now: number): Promise<void> {
  const run = await db
    .prepare(
      `SELECT weekly_runs.id, weekly_runs.user_id, weekly_runs.week_key,
              weekly_runs.official, weekly_runs.started_at
       FROM weekly_rounds
       JOIN weekly_runs ON weekly_runs.id = weekly_rounds.run_id
       WHERE weekly_rounds.game_id = ?`,
    )
    .bind(gameId)
    .first<{
      id: string;
      user_id: string;
      week_key: string;
      official: number;
      started_at: number;
    }>();
  if (!run) return;
  const aggregate = await db
    .prepare(
      `SELECT COUNT(*) AS finished_count,
              SUM(CASE WHEN games.status = 'won' THEN 1 ELSE 0 END) AS correct_count,
              SUM(game_results.guess_count) AS total_guesses,
              SUM(game_results.elapsed_ms) AS elapsed_ms
       FROM weekly_rounds
       JOIN games ON games.id = weekly_rounds.game_id
       JOIN game_results ON game_results.game_id = games.id
       WHERE weekly_rounds.run_id = ? AND games.status IN ('won', 'lost')`,
    )
    .bind(run.id)
    .first<{
      finished_count: number;
      correct_count: number;
      total_guesses: number;
      elapsed_ms: number;
    }>();
  const finishedCount = aggregate?.finished_count ?? 0;
  const correctCount = aggregate?.correct_count ?? 0;
  const totalGuesses = aggregate?.total_guesses ?? 0;
  const elapsedMs = aggregate?.elapsed_ms ?? 0;
  const completed = finishedCount === 5;
  await db.batch([
    db
      .prepare(
        `UPDATE weekly_runs SET correct_count = ?, total_guesses = ?,
           status = CASE WHEN ? = 1 THEN 'completed' ELSE status END,
           completed_at = CASE WHEN ? = 1 THEN COALESCE(completed_at, ?) ELSE completed_at END,
           updated_at = ?
         WHERE id = ?`,
      )
      .bind(correctCount, totalGuesses, completed ? 1 : 0, completed ? 1 : 0, now, now, run.id),
    db
      .prepare(
        `INSERT OR IGNORE INTO weekly_scores
           (run_id, user_id, week_key, correct_count, total_guesses, elapsed_ms, completed_at)
         SELECT ?, ?, ?, ?, ?, MAX(0, ? - ?), ?
         WHERE ? = 1 AND ? = 1`,
      )
      .bind(
        run.id,
        run.user_id,
        run.week_key,
        correctCount,
        totalGuesses,
        elapsedMs,
        0,
        now,
        completed ? 1 : 0,
        run.official,
      ),
  ]);
}

/** 周赛允许主动结束当前题，按实际猜测与题内耗时记录失败。 */
export async function forfeitWeeklyGame(
  db: D1Database,
  gameId: string,
  userId: string,
  now = Date.now(),
): Promise<void> {
  const row = await readGameRow(db, gameId);
  if (!row || row.user_id !== userId || row.activity_id !== "weekly") {
    throw new ApiProblem("NOT_FOUND", 404);
  }
  if (row.status !== "active") throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  const guesses = await readGuessResults(db, gameId);
  const [write] = await db.batch([
    db
      .prepare(
        `UPDATE games SET status = 'lost', completed_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND activity_id = 'weekly' AND status = 'active'`,
      )
      .bind(now, now, gameId, userId),
    db
      .prepare(
        `INSERT OR IGNORE INTO game_results
           (game_id, user_id, mode, mode_id, activity_id, difficulty, date_key, result,
            guess_count, elapsed_ms, completed_at, replay_expires_at)
         SELECT id, user_id, mode, mode_id, activity_id, difficulty, date_key, 'lost',
                ?, MAX(0, ? - started_at), ?, ?
         FROM games WHERE id = ? AND user_id = ? AND activity_id = 'weekly'`,
      )
      .bind(guesses.length, now, now, now + REPLAY_RETENTION_MS, gameId, userId),
  ]);
  if ((write?.meta.changes ?? 0) !== 1) throw new ApiProblem("GAME_ALREADY_FINISHED", 409);
  await settleWeeklyRun(db, gameId, now);
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
  if (
    row.activity_id === "daily" ||
    row.activity_id === "weekly" ||
    row.activity_id === "friend-challenge"
  ) {
    throw new ApiProblem("FORBIDDEN", 403, { reason: "challenge-cannot-concede" });
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
           (game_id, user_id, mode, mode_id, activity_id, difficulty, date_key, result, guess_count,
            elapsed_ms, completed_at, replay_expires_at)
         SELECT game.id, game.user_id, game.mode, game.mode_id, game.activity_id,
           game.difficulty, game.date_key,
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
