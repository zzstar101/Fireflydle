import { CharacterSummarySchema } from "@fireflydle/contracts";
import type {
  Character,
  Difficulty,
  Direction,
  FeedbackState,
  GuessCell,
  GuessField,
  GuessResult,
  Locale,
} from "@fireflydle/contracts";

export const ATTEMPTS_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  casual: 8,
  standard: 6,
  hard: 4,
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
  { field: "version", comparison: "version" },
];

/** 将当前 manifest 的普通角色字段映射为迁移期可用的快照比较规则。 */
export function snapshotRulesFromFieldDefinitions(
  fields: readonly { id: string; comparison?: string }[],
): SnapshotFieldRule[] {
  return fields.flatMap((field): SnapshotFieldRule[] => {
    if (field.id === "faction") return [{ field: field.id, comparison: "faction" as const }];
    if (field.id === "version") return [{ field: field.id, comparison: "version" as const }];
    if (field.id === "element" || field.id === "path" || field.id === "rarity") {
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

export function pickFromShuffleBag<T>(
  items: readonly T[],
  consumedIndexes: ReadonlySet<number>,
  randomValue: number,
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

  const pool = available.length > 0 ? available : items.map((_, index) => index);
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
    exhausted: available.length === 0,
  };
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
