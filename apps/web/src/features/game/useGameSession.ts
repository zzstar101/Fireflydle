import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Character,
  CurrentGames,
  Difficulty,
  GameMode,
  PublicGame,
} from "@fireflydle/contracts";
import { characters } from "@fireflydle/game-data";
import {
  ATTEMPTS_BY_DIFFICULTY,
  createGuessResult,
  getBeijingDateKey,
  hasDuplicateGuess,
} from "@fireflydle/game-engine";
import { ApiClientError, apiRequest, ensureSession } from "../../api/client";
import { currentGamesQueryKey } from "./useCurrentGames";

type PlayableMode = Extract<GameMode, "daily" | "random">;
type SessionSource = "server" | "local" | null;

interface GameSession {
  game: PublicGame | null;
  roster: readonly Character[];
  source: SessionSource;
  navigationGameId: string | null;
  busy: boolean;
  errorCode: string | null;
  start: () => Promise<boolean>;
  startOffline: () => boolean;
  submitGuess: (characterId: string) => Promise<void>;
  restart: () => Promise<void>;
  abandonAndRestart: () => Promise<boolean>;
  acknowledgeNavigation: () => void;
  clearError: () => void;
}

interface ServerStartResult {
  game: PublicGame;
  roster: readonly Character[];
}

function errorCodeOf(error: unknown): string {
  return error instanceof ApiClientError ? error.code : "INTERNAL_ERROR";
}

async function startServerGame(
  mode: PlayableMode,
  difficulty: Difficulty,
): Promise<ServerStartResult> {
  // 会话与对局创建必须顺序执行，首次访客请求才能稳定携带身份 cookie。
  await ensureSession();
  const [game, roster] = await Promise.all([
    apiRequest<PublicGame>("/games", {
      method: "POST",
      body: JSON.stringify({ mode, difficulty }),
    }),
    apiRequest<Character[]>("/characters").catch(() => characters),
  ]);
  return { game, roster };
}

function stringHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function targetFor(mode: PlayableMode, difficulty: Difficulty, salt = ""): Character {
  const eligible = characters.filter((character) => character.enabled && character.targetEligible);
  const seed =
    mode === "daily" ? getBeijingDateKey() : `${crypto.randomUUID()}-${difficulty}-${salt}`;
  const target = eligible[stringHash(seed) % eligible.length];
  if (!target) throw new Error("题库为空");
  return target;
}

function createLocalGame(mode: PlayableMode, difficulty: Difficulty): PublicGame {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    mode,
    difficulty,
    dateKey: mode === "daily" ? getBeijingDateKey() : null,
    maxAttempts: ATTEMPTS_BY_DIFFICULTY[difficulty],
    guesses: [],
    status: "active",
    startedAt: now,
    completedAt: null,
    elapsedMs: 0,
    answer: null,
  };
}

export function useGameSession(
  mode: PlayableMode,
  difficulty: Difficulty,
  initialGame: PublicGame | null | undefined,
): GameSession {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<PublicGame | null>(initialGame ?? null);
  const [roster, setRoster] = useState<readonly Character[]>(characters);
  const [sourceState, setSourceState] = useState<SessionSource>(initialGame ? "server" : null);
  const [navigationGameId, setNavigationGameId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const localTargetId = useRef<string | null>(null);
  const submitting = useRef(false);
  const startSequence = useRef(0);
  const sessionEpoch = useRef(0);
  const sessionMode = useRef(mode);

  const game = gameState ?? initialGame ?? null;
  const source = sourceState ?? (initialGame ? "server" : null);

  const writeCurrentCache = useCallback(
    (next: PublicGame | null) => {
      queryClient.setQueryData<CurrentGames>(currentGamesQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          serverNow: new Date().toISOString(),
          [mode]: mode === "random" && next?.status !== "active" ? null : next,
        };
      });
    },
    [mode, queryClient],
  );

  useEffect(() => {
    if (sessionMode.current !== mode) {
      sessionMode.current = mode;
      ++startSequence.current;
      sessionEpoch.current += 1;
      localTargetId.current = null;
      submitting.current = false;
      setRoster(characters);
      setGameState(initialGame ?? null);
      setSourceState(initialGame ? "server" : null);
      setNavigationGameId(null);
      setBusy(false);
      setErrorCode(null);
      return;
    }
    if (initialGame === undefined || sourceState === "local") return;
    setGameState(initialGame);
    setSourceState(initialGame ? "server" : null);
    localTargetId.current = null;
  }, [initialGame, mode, sourceState]);

  const applyServerStart = useCallback(
    (result: ServerStartResult) => {
      sessionEpoch.current += 1;
      setRoster(result.roster);
      setGameState(result.game);
      setSourceState("server");
      setNavigationGameId(result.game.id);
      localTargetId.current = null;
      writeCurrentCache(result.game);
    },
    [writeCurrentCache],
  );

  const start = useCallback(async () => {
    const sequence = ++startSequence.current;
    setBusy(true);
    setErrorCode(null);
    try {
      const result = await startServerGame(mode, difficulty);
      if (sequence !== startSequence.current) return false;
      applyServerStart(result);
      setBusy(false);
      return true;
    } catch (error) {
      if (sequence !== startSequence.current) return false;
      setErrorCode(errorCodeOf(error));
      setBusy(false);
      return false;
    }
  }, [applyServerStart, difficulty, mode]);

  const startOffline = useCallback(() => {
    const target = targetFor(mode, difficulty, String(Date.now()));
    const localGame = createLocalGame(mode, difficulty);
    ++startSequence.current;
    sessionEpoch.current += 1;
    localTargetId.current = target.id;
    setRoster(characters);
    setGameState(localGame);
    setSourceState("local");
    setNavigationGameId(null);
    setErrorCode(null);
    setBusy(false);
    return true;
  }, [difficulty, mode]);

  const submitGuess = useCallback(
    async (characterId: string) => {
      if (!game || game.status !== "active" || submitting.current) return;
      if (hasDuplicateGuess(game.guesses, characterId)) {
        setErrorCode("GAME_DUPLICATE_GUESS");
        return;
      }

      submitting.current = true;
      const requestEpoch = sessionEpoch.current;
      const requestGameId = game.id;
      setBusy(true);
      setErrorCode(null);
      if (source === "server") {
        try {
          const updated = await apiRequest<PublicGame>(`/games/${game.id}/guesses`, {
            method: "POST",
            body: JSON.stringify({ characterId }),
          });
          if (requestEpoch !== sessionEpoch.current || updated.id !== requestGameId) return;
          setGameState(updated);
          writeCurrentCache(updated);
          if (updated.status !== "active") {
            void queryClient.invalidateQueries({ queryKey: ["stats"] });
          }
        } catch (error) {
          setErrorCode(errorCodeOf(error));
        } finally {
          submitting.current = false;
          setBusy(false);
        }
        return;
      }

      const target = characters.find((character) => character.id === localTargetId.current);
      const guess = characters.find((character) => character.id === characterId);
      if (!target || !guess) {
        setErrorCode("NOT_FOUND");
        submitting.current = false;
        setBusy(false);
        return;
      }
      const result = createGuessResult(target, guess);
      const guesses = [...game.guesses, result];
      const ended = result.isCorrect || guesses.length >= game.maxAttempts;
      const completedAt = ended ? new Date().toISOString() : null;
      setGameState({
        ...game,
        guesses,
        status: result.isCorrect ? "won" : ended ? "lost" : "active",
        completedAt,
        elapsedMs: Date.now() - new Date(game.startedAt).getTime(),
        answer: ended ? target : null,
      });
      submitting.current = false;
      setBusy(false);
    },
    [game, queryClient, source, writeCurrentCache],
  );

  const restart = useCallback(async () => {
    if (mode === "daily") return;
    if (source === "local") {
      startOffline();
      return;
    }
    await start();
  }, [mode, source, start, startOffline]);

  const abandonAndRestart = useCallback(async () => {
    if (!game || game.status !== "active" || mode !== "random") return false;
    if (source === "local") {
      startOffline();
      return true;
    }
    sessionEpoch.current += 1;
    setBusy(true);
    setErrorCode(null);
    try {
      const conceded = await apiRequest<PublicGame>(`/games/${game.id}/concede`, {
        method: "POST",
      });
      setGameState(conceded);
      setSourceState("server");
      writeCurrentCache(null);
      const result = await startServerGame(mode, difficulty);
      applyServerStart(result);
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      setBusy(false);
      return true;
    } catch (error) {
      setErrorCode(errorCodeOf(error));
      setBusy(false);
      return false;
    }
  }, [
    applyServerStart,
    difficulty,
    game,
    mode,
    queryClient,
    source,
    startOffline,
    writeCurrentCache,
  ]);

  const clearError = useCallback(() => setErrorCode(null), []);
  const acknowledgeNavigation = useCallback(() => setNavigationGameId(null), []);

  return {
    game,
    roster,
    source,
    navigationGameId,
    busy,
    errorCode,
    start,
    startOffline,
    submitGuess,
    restart,
    abandonAndRestart,
    acknowledgeNavigation,
    clearError,
  };
}
