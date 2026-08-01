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

export function compareCharacters(target: Character, guess: Character): GuessCell[] {
  const factionState: FeedbackState =
    target.factionId === guess.factionId
      ? "exact"
      : target.factionGroupId === guess.factionGroupId
        ? "close"
        : "miss";

  const versionDistance = Math.abs(target.releaseOrder - guess.releaseOrder);
  const versionState: FeedbackState =
    versionDistance === 0 ? "exact" : versionDistance <= 2 ? "close" : "miss";
  const versionDirection: Direction =
    versionDistance === 0 ? "none" : target.releaseOrder > guess.releaseOrder ? "higher" : "lower";

  return [
    cell("element", target.element === guess.element ? "exact" : "miss"),
    cell("path", target.path === guess.path ? "exact" : "miss"),
    cell("rarity", target.rarity === guess.rarity ? "exact" : "miss"),
    cell("faction", factionState),
    cell("version", versionState, versionDirection),
  ];
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
};

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
