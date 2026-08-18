import {
  PlayableGameEntitySummarySchema,
  CurrencyWarsUnitSummarySchema,
  NpcSummarySchema,
  AeonSummarySchema,
} from "@fireflydle/contracts";
import type {
  Character,
  Direction,
  FeedbackState,
  GuessCell,
  GuessField,
  GuessResult,
  InferenceReview,
  Locale,
  NpcSummary,
  CurrencyWarsUnit,
  CurrencyWarsUnitSummary,
  AeonSummary,
} from "@fireflydle/contracts";
import type { ContentModeId } from "@fireflydle/contracts";

export const MULTIPLAYER_ATTEMPTS = 6;
export const MULTIPLAYER_ROUND_MS = 90_000;
export const RECONNECT_GRACE_MS = 30_000;
export const MAX_CONSECUTIVE_DRAWS = 3;

function cell(field: GuessField, state: FeedbackState, direction: Direction = "none"): GuessCell {
  return { field, state, direction };
}

export type SnapshotFieldRule =
  | { field: string; comparison: "exact" }
  | { field: string; comparison: "faction" }
  | { field: string; comparison: "version" };

export const DEFAULT_SNAPSHOT_FIELD_RULES: readonly SnapshotFieldRule[] = [
  { field: "element", comparison: "exact" },
  { field: "path", comparison: "exact" },
  { field: "rarity", comparison: "exact" },
  { field: "faction", comparison: "faction" },
  { field: "region", comparison: "exact" },
  { field: "version", comparison: "version" },
];

export interface NpcEntitySnapshot {
  id: string;
  names: Record<string, string>;
  aliases?: Record<string, readonly string[]>;
  regionId: string;
  factionId: string;
  factionGroupId: string;
  debutVersionId: string;
  debutVersionOrder: number;
}

export const NPC_SNAPSHOT_FIELD_RULES: readonly SnapshotFieldRule[] = [
  { field: "region", comparison: "exact" },
  { field: "faction", comparison: "faction" },
  { field: "debut-version", comparison: "version" },
];

/** NPC 专用三列判题；不会读取或映射普通角色的元素、命途、稀有度字段。 */
export function compareNpcEntities(
  target: NpcEntitySnapshot,
  guess: NpcEntitySnapshot,
): GuessCell[] {
  const versionDistance = Math.abs(target.debutVersionOrder - guess.debutVersionOrder);
  return [
    cell("region", target.regionId === guess.regionId ? "exact" : "miss"),
    cell(
      "faction",
      target.factionId === guess.factionId
        ? "exact"
        : target.factionGroupId === guess.factionGroupId
          ? "close"
          : "miss",
    ),
    cell(
      "debut-version",
      versionDistance === 0 ? "exact" : versionDistance <= 2 ? "close" : "miss",
      versionDistance === 0
        ? "none"
        : target.debutVersionOrder > guess.debutVersionOrder
          ? "higher"
          : "lower",
    ),
  ];
}

export function createNpcGuessResult(
  target: NpcSummary,
  guess: NpcSummary,
  guessedAt = new Date(),
): GuessResult {
  return {
    character: NpcSummarySchema.parse(guess),
    cells: compareNpcEntities(target, guess),
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
  };
}

export const CURRENCY_WARS_FIELD_RULES: readonly SnapshotFieldRule[] = [
  { field: "cost", comparison: "version" },
  { field: "position", comparison: "exact" },
  { field: "synergies", comparison: "faction" },
];

/** 币战专用判题：费用只给方向，站位 exact/miss，羁绊集合只给三态。 */
export function compareCurrencyWarsUnits(
  target: CurrencyWarsUnit,
  guess: CurrencyWarsUnit,
): GuessCell[] {
  const targetCosts = Array.isArray(target.cost) ? target.cost : [target.cost];
  const guessCosts = Array.isArray(guess.cost) ? guess.cost : [guess.cost];
  const costExact = guessCosts.some((cost) => targetCosts.includes(cost));
  const targetMin = Math.min(...targetCosts);
  const targetMax = Math.max(...targetCosts);
  const guessMin = Math.min(...guessCosts);
  const guessMax = Math.max(...guessCosts);
  const costDirection = costExact
    ? "none"
    : guessMax < targetMin
      ? "higher"
      : guessMin > targetMax
        ? "lower"
        : "none";
  const targetSynergies = new Set(target.synergies);
  const sharesSynergy = guess.synergies.some((synergy) => targetSynergies.has(synergy));
  const sameSynergies =
    target.synergies.length === guess.synergies.length &&
    guess.synergies.every((synergy) => targetSynergies.has(synergy));
  return [
    cell("cost", costExact ? "exact" : "miss", costDirection),
    cell("position", target.position === guess.position ? "exact" : "miss"),
    cell("synergies", sameSynergies ? "exact" : sharesSynergy ? "close" : "miss"),
  ];
}

export function createCurrencyWarsGuessResult(
  target: CurrencyWarsUnit,
  guess: CurrencyWarsUnit,
  guessedAt = new Date(),
): GuessResult {
  const summary: CurrencyWarsUnitSummary = CurrencyWarsUnitSummarySchema.parse({
    id: guess.id,
    names: guess.names,
    aliases: guess.aliases,
    cost: guess.cost,
    position: guess.position,
    synergies: guess.synergies,
    assets: guess.assets,
  });
  return {
    character: summary,
    cells: compareCurrencyWarsUnits(target, guess),
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
  };
}

export function createAeonGuessResult(
  target: AeonSummary,
  guess: AeonSummary,
  guessedAt = new Date(),
): GuessResult {
  return {
    character: AeonSummarySchema.parse(guess),
    cells: [
      { field: "image", state: target.id === guess.id ? "exact" : "miss", direction: "none" },
    ],
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
  };
}

function aeonStringHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function aeonRevealOrder(gameId: string): number[] {
  return Array.from({ length: 16 }, (_, index) => ({
    index,
    key: aeonStringHash(`${gameId}:${index}`),
  }))
    .toSorted((left, right) => left.key - right.key || left.index - right.index)
    .map((value) => value.index);
}

export function aeonRevealedCells(
  gameId: string,
  wrongGuesses: number,
  maxAttempts = 6,
): ReadonlySet<number> {
  const count = wrongGuesses >= maxAttempts ? 16 : Math.min(16, 4 + Math.max(0, wrongGuesses) * 2);
  return new Set(aeonRevealOrder(gameId).slice(0, count));
}

/** 将当前 manifest 的普通角色字段映射为迁移期可用的快照比较规则。 */
export function snapshotRulesFromFieldDefinitions(
  fields: readonly { id: string; comparison?: string }[],
): SnapshotFieldRule[] {
  return fields.flatMap((field): SnapshotFieldRule[] => {
    if (field.id === "faction") return [{ field: field.id, comparison: "faction" as const }];
    if (field.id === "version") return [{ field: field.id, comparison: "version" as const }];
    if (
      field.id === "element" ||
      field.id === "path" ||
      field.id === "rarity" ||
      field.id === "region"
    ) {
      return [{ field: field.id, comparison: "exact" as const }];
    }
    return [];
  });
}

export function selectSnapshotFieldDefinitions<T extends { id: string; comparison?: string }>(
  fields: readonly T[],
): T[] {
  const ids = new Set(snapshotRulesFromFieldDefinitions(fields).map((rule) => rule.field));
  return fields.filter((field) => ids.has(field.id));
}

export function compareCharactersWithRules(
  target: Character,
  guess: Character,
  rules: readonly SnapshotFieldRule[],
): GuessCell[] {
  return rules.map((rule) => {
    if (rule.comparison === "faction") {
      const state: FeedbackState =
        target.factionId === guess.factionId
          ? "exact"
          : target.factionGroupId === guess.factionGroupId
            ? "close"
            : "miss";
      return cell(rule.field, state);
    }
    if (rule.comparison === "version") {
      const distance = Math.abs(target.releaseOrder - guess.releaseOrder);
      const state: FeedbackState = distance === 0 ? "exact" : distance <= 2 ? "close" : "miss";
      const direction: Direction =
        distance === 0 ? "none" : target.releaseOrder > guess.releaseOrder ? "higher" : "lower";
      return cell(rule.field, state, direction);
    }
    const targetValue = characterFieldValue(target, rule.field);
    const guessValue = characterFieldValue(guess, rule.field);
    if (targetValue === undefined || guessValue === undefined) {
      return cell(rule.field, "unavailable");
    }
    return cell(rule.field, targetValue === guessValue ? "exact" : "miss");
  });
}

function characterFieldValue(character: Character, field: string): unknown {
  switch (field) {
    case "element":
      return character.element;
    case "path":
      return character.path;
    case "rarity":
      return character.rarity;
    case "faction":
      return character.factionId;
    case "region":
      return character.regionId ?? character.factionGroupId;
    case "version":
      return character.releaseVersionId;
    default:
      return (character as unknown as Record<string, unknown>)[field];
  }
}

export function compareCharacters(target: Character, guess: Character): GuessCell[] {
  return compareCharactersWithRules(target, guess, DEFAULT_SNAPSHOT_FIELD_RULES);
}

export function createGuessResult(
  target: Character,
  guess: Character,
  guessedAt = new Date(),
): GuessResult {
  return {
    character: PlayableGameEntitySummarySchema.parse(guess),
    cells: compareCharacters(target, guess),
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
  };
}

export function createGuessResultWithRules(
  target: Character,
  guess: Character,
  rules: readonly SnapshotFieldRule[],
  guessedAt = new Date(),
): GuessResult {
  return {
    character: PlayableGameEntitySummarySchema.parse(guess),
    cells: compareCharactersWithRules(target, guess, rules),
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
  };
}

function sameFeedback(left: readonly GuessCell[], right: readonly GuessCell[]): boolean {
  return (
    left.length === right.length &&
    left.every((cell, index) => {
      const other = right[index];
      return (
        other !== undefined &&
        cell.field === other.field &&
        cell.state === other.state &&
        cell.direction === other.direction
      );
    })
  );
}

/** 使用对局绑定的候选实体与规则重放每一步反馈，计算累计剩余候选。 */
export function createInferenceReview(
  candidates: readonly Character[],
  guesses: readonly GuessResult[],
  rules: readonly SnapshotFieldRule[],
): InferenceReview {
  return createInferenceReviewForEntities(candidates, guesses, (target, guess) =>
    compareCharactersWithRules(target, guess, rules),
  );
}

/** 按模式专用判题器重放结算反馈，候选实体本身不会进入公开复盘。 */
export function createInferenceReviewForEntities<T extends { id: string }>(
  candidates: readonly T[],
  guesses: readonly GuessResult[],
  compare: (target: T, guess: T) => GuessCell[],
): InferenceReview {
  let remaining = [...candidates];
  let bestGuessNumber: number | null = null;
  let largestReduction = -1;
  const steps = guesses.map((result, index) => {
    const before = remaining.length;
    const guess = candidates.find((candidate) => candidate.id === result.character.id);
    remaining = guess
      ? remaining.filter(
          (candidate) =>
            (candidate.id === guess.id) === result.isCorrect &&
            sameFeedback(compare(candidate, guess), result.cells),
        )
      : [];
    const eliminatedCandidates = before - remaining.length;
    if (eliminatedCandidates > largestReduction) {
      largestReduction = eliminatedCandidates;
      bestGuessNumber = index + 1;
    }
    return {
      guessNumber: index + 1,
      remainingCandidates: remaining.length,
      eliminatedCandidates,
      isBest: false,
    };
  });
  return {
    initialCandidates: candidates.length,
    bestGuessNumber,
    steps: steps.map((step) => ({ ...step, isBest: step.guessNumber === bestGuessNumber })),
  };
}

export function hasDuplicateGuess(guesses: readonly GuessResult[], characterId: string): boolean {
  return guesses.some((guess) => guess.character.id === characterId);
}

export function getBeijingDateKey(timestamp = Date.now()): string {
  const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
  return new Date(timestamp + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}

/** 返回包含给定时刻的北京时间周一，作为周赛稳定键。 */
export function getBeijingWeekKey(timestamp = Date.now()): string {
  const beijing = new Date(timestamp + 8 * 60 * 60 * 1_000);
  const daysSinceMonday = (beijing.getUTCDay() + 6) % 7;
  beijing.setUTCDate(beijing.getUTCDate() - daysSinceMonday);
  return beijing.toISOString().slice(0, 10);
}

/** 返回北京时间下一个周一 00:00 对应的 UTC 时间戳。 */
export function getBeijingWeekEnd(timestamp = Date.now()): number {
  return (
    Date.parse(`${getBeijingWeekKey(timestamp)}T00:00:00.000+08:00`) + 7 * 24 * 60 * 60 * 1_000
  );
}

export const WEEKLY_MODE_ROTATION = ["playable", "currency-wars", "aeon"] as const;

/** 以 2026-08-17 北京时间周一为普通角色周，按固定顺序逐周循环。 */
export function getWeeklyModeId(timestamp = Date.now()): ContentModeId {
  const anchor = Date.parse("2026-08-17T00:00:00.000+08:00");
  const weekStart = Date.parse(`${getBeijingWeekKey(timestamp)}T00:00:00.000+08:00`);
  const weekOffset = Math.floor((weekStart - anchor) / (7 * 24 * 60 * 60 * 1_000));
  const index =
    ((weekOffset % WEEKLY_MODE_ROTATION.length) + WEEKLY_MODE_ROTATION.length) %
    WEEKLY_MODE_ROTATION.length;
  return WEEKLY_MODE_ROTATION[index]!;
}

export function pickFromShuffleBag<T>(
  items: readonly T[],
  consumedIndexes: ReadonlySet<number>,
  randomValue: number,
  previousIndex?: number,
): { item: T; index: number; exhausted: boolean } {
  if (items.length === 0) {
    throw new Error("题库不能为空");
  }

  const available: number[] = [];
  for (let index = 0; index < items.length; index += 1) {
    if (!consumedIndexes.has(index)) {
      available.push(index);
    }
  }

  const exhausted = available.length === 0;
  const resetPool = items
    .map((_, index) => index)
    .filter((index) => items.length === 1 || index !== previousIndex);
  const pool = exhausted ? resetPool : available;
  const normalized = Math.min(Math.max(randomValue, 0), 0.999999999999);
  const selectedIndex = pool[Math.floor(normalized * pool.length)];

  if (selectedIndex === undefined) {
    throw new Error("无法从题库选择角色");
  }

  const selected = items[selectedIndex];
  if (selected === undefined) {
    throw new Error("题库索引无效");
  }

  return {
    item: selected,
    index: selectedIndex,
    exhausted,
  };
}

export const ENDLESS_INITIAL_LIVES = 5;
export const ENDLESS_MAX_ATTEMPTS = 6;

export interface EndlessScore {
  lives: number;
  clears: number;
  totalGuesses: number;
}

export function applyEndlessRoundOutcome(
  score: EndlessScore,
  round: { outcome: "won" | "lost" | "skipped"; guessesUsed: number },
): EndlessScore {
  return {
    lives: Math.max(0, score.lives - (round.outcome === "won" ? 0 : 1)),
    clears: score.clears + (round.outcome === "won" ? 1 : 0),
    totalGuesses: score.totalGuesses + Math.max(0, round.guessesUsed),
  };
}

export function compareEndlessLeaderboardEntries(
  left: Pick<EndlessScore, "clears" | "totalGuesses"> & { elapsedMs: number },
  right: Pick<EndlessScore, "clears" | "totalGuesses"> & { elapsedMs: number },
): number {
  return (
    right.clears - left.clears ||
    left.totalGuesses - right.totalGuesses ||
    left.elapsedMs - right.elapsedMs
  );
}

export interface EloResult {
  winnerRating: number;
  loserRating: number;
  delta: number;
}

export function calculateElo(
  winnerRating: number,
  loserRating: number,
  winnerMatches: number,
  loserMatches: number,
): EloResult {
  const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const winnerK = winnerMatches < 10 ? 48 : 32;
  const loserK = loserMatches < 10 ? 48 : 32;
  const winnerDelta = Math.max(1, Math.round(winnerK * (1 - expectedWinner)));
  const loserDelta = Math.max(1, Math.round(loserK * expectedWinner));

  return {
    winnerRating: winnerRating + winnerDelta,
    loserRating: Math.max(100, loserRating - loserDelta),
    delta: winnerDelta,
  };
}

export function getMatchmakingRange(waitingMs: number): number {
  if (waitingMs < 15_000) return 100;
  if (waitingMs < 30_000) return 200;
  if (waitingMs < 60_000) return 350;
  return 600;
}

export function canMatchRatings(left: number, right: number, longestWaitingMs: number): boolean {
  return Math.abs(left - right) <= getMatchmakingRange(longestWaitingMs);
}

const SHARE_LABELS: Record<Locale, { title: string; attempts: string; lost: string }> = {
  "zh-CN": {
    title: "萤一把",
    attempts: "次",
    lost: "未猜中",
  },
  en: {
    title: "Fireflydle",
    attempts: "guesses",
    lost: "X",
  },
  ja: {
    title: "Fireflydle",
    attempts: "回",
    lost: "失敗",
  },
};

const CELL_EMOJI: Record<FeedbackState, string> = {
  exact: "🟩",
  close: "🟨",
  miss: "⬛",
  unavailable: "⬜",
  fog: "🌫️",
};

export type FieldComparisonKind = "exact" | "version" | "direction" | "set";
export interface FieldComparisonOptions {
  kind: FieldComparisonKind;
  targetOrder?: number;
  guessOrder?: number;
}

export interface FieldComparisonResult {
  state: FeedbackState;
  direction: Direction;
}

/** 对所有内容模式共享的最小反馈规则，不读取平台或题库实现。 */
export function compareFieldValues(
  targetValue: unknown,
  guessValue: unknown,
  options: FieldComparisonOptions,
): FieldComparisonResult {
  if (
    targetValue === undefined ||
    targetValue === null ||
    guessValue === undefined ||
    guessValue === null
  ) {
    return { state: "unavailable", direction: "none" };
  }

  if (options.kind === "version") {
    if (options.targetOrder === undefined || options.guessOrder === undefined) {
      return { state: "unavailable", direction: "none" };
    }
    const distance = Math.abs(options.targetOrder - options.guessOrder);
    const direction: Direction =
      distance === 0 ? "none" : options.targetOrder > options.guessOrder ? "higher" : "lower";
    return { state: distance === 0 ? "exact" : distance <= 2 ? "close" : "miss", direction };
  }

  if (options.kind === "set") {
    if (!Array.isArray(targetValue) || !Array.isArray(guessValue)) {
      return { state: "unavailable", direction: "none" };
    }
    const targetSet = new Set(targetValue);
    const guessSet = new Set(guessValue);
    const same =
      targetSet.size === guessSet.size && [...targetSet].every((value) => guessSet.has(value));
    if (same) return { state: "exact", direction: "none" };
    return {
      state: [...guessSet].some((value) => targetSet.has(value)) ? "close" : "miss",
      direction: "none",
    };
  }

  if (targetValue === guessValue) return { state: "exact", direction: "none" };
  if (
    options.kind === "direction" &&
    typeof targetValue === "number" &&
    typeof guessValue === "number"
  ) {
    return {
      state: "miss",
      direction: targetValue > guessValue ? "higher" : "lower",
    };
  }
  return { state: "miss", direction: "none" };
}

export function createSpoilerFreeShareText(input: {
  locale: Locale;
  dateKey: string;
  guesses: readonly GuessResult[];
  won: boolean;
  elapsedMs: number;
  url: string;
}): string {
  const labels = SHARE_LABELS[input.locale];
  const resultLabel = input.won ? `${input.guesses.length} ${labels.attempts}` : labels.lost;
  const seconds = Math.max(0, Math.floor(input.elapsedMs / 1000));
  const minutesPart = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secondsPart = (seconds % 60).toString().padStart(2, "0");
  const grid = input.guesses
    .map((guess) => guess.cells.map((guessCell) => CELL_EMOJI[guessCell.state]).join(""))
    .join("\n");

  return [
    `${labels.title} ${input.dateKey}`,
    `${resultLabel} · ${minutesPart}:${secondsPart}`,
    "",
    grid,
    "",
    input.url,
  ].join("\n");
}
