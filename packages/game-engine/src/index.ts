import {
  CharacterSummarySchema,
  CurrencyWarsUnitSummarySchema,
  NpcSummarySchema,
} from "@fireflydle/contracts";
import type {
  Character,
  Difficulty,
  Direction,
  FeedbackState,
  GuessCell,
  GuessField,
  GuessResult,
  Locale,
  NpcSummary,
  CurrencyWarsUnit,
  CurrencyWarsUnitSummary,
} from "@fireflydle/contracts";

export const ATTEMPTS_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  casual: 6,
  standard: 6,
  hard: 6,
};

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
  const costDirection =
    target.cost === guess.cost ? "none" : target.cost > guess.cost ? "higher" : "lower";
  const targetSynergies = new Set(target.synergies);
  const sharesSynergy = guess.synergies.some((synergy) => targetSynergies.has(synergy));
  const sameSynergies =
    target.synergies.length === guess.synergies.length &&
    guess.synergies.every((synergy) => targetSynergies.has(synergy));
  return [
    cell("cost", target.cost === guess.cost ? "exact" : "miss", costDirection),
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
    assets: guess.assets,
  });
  return {
    character: summary,
    cells: compareCurrencyWarsUnits(target, guess),
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
  };
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
    character: CharacterSummarySchema.parse(guess),
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
    character: CharacterSummarySchema.parse(guess),
    cells: compareCharactersWithRules(target, guess, rules),
    isCorrect: target.id === guess.id,
    guessedAt: guessedAt.toISOString(),
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

const SHARE_LABELS: Record<
  Locale,
  { title: string; casual: string; standard: string; hard: string; attempts: string; lost: string }
> = {
  "zh-CN": {
    title: "萤一把",
    casual: "休闲",
    standard: "标准",
    hard: "硬核",
    attempts: "次",
    lost: "未猜中",
  },
  en: {
    title: "Fireflydle",
    casual: "Casual",
    standard: "Standard",
    hard: "Hard",
    attempts: "guesses",
    lost: "X",
  },
  ja: {
    title: "Fireflydle",
    casual: "カジュアル",
    standard: "スタンダード",
    hard: "ハード",
    attempts: "回",
    lost: "失敗",
  },
};

const CELL_EMOJI: Record<FeedbackState, string> = {
  exact: "🟩",
  close: "🟨",
  miss: "⬛",
  unavailable: "⬜",
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
  difficulty: Difficulty;
  guesses: readonly GuessResult[];
  won: boolean;
  elapsedMs: number;
  url: string;
}): string {
  const labels = SHARE_LABELS[input.locale];
  const difficultyLabel = labels[input.difficulty];
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
    `${labels.title} ${input.dateKey} · ${difficultyLabel}`,
    `${resultLabel} · ${minutesPart}:${secondsPart}`,
    "",
    grid,
    "",
    input.url,
  ].join("\n");
}
