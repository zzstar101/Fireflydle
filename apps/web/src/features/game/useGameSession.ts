import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  ActivityId,
  CurrentGames,
  GameEntitySummary,
  PublicGame,
} from "@fireflydle/contracts";
import {
  getBeijingDateKey,
  hasDuplicateGuess,
  selectSnapshotFieldDefinitions,
} from "@fireflydle/game-engine";
import { ApiClientError, apiRequest, ensureSession } from "../../api/client";
import { loadContentRoster } from "./content-roster";
import type { SoloModeRuntime } from "./mode-runtime";
import { currentGamesQueryKey } from "./useCurrentGames";

type SoloActivity = Extract<ActivityId, "daily" | "practice">;
type SessionSource = "server" | "local" | null;
const LOCAL_PLAYER_SEED_KEY = "fireflydle-local-player-seed";

interface GameSession {
  game: PublicGame | null;
  roster: readonly GameEntitySummary[];
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
  roster: readonly GameEntitySummary[];
}

function errorCodeOf(error: unknown): string {
  return error instanceof ApiClientError ? error.code : "INTERNAL_ERROR";
}

async function startServerGame(
  queryClient: QueryClient,
  activityId: SoloActivity,
  runtime: SoloModeRuntime,
): Promise<ServerStartResult> {
  // 会话与对局创建必须顺序执行，首次访客请求才能稳定携带身份 cookie。
  await ensureSession();
  const game = await apiRequest<PublicGame>("/games", {
    method: "POST",
    body: JSON.stringify({ modeId: runtime.contentModeId, activityId }),
  });
  const roster =
    runtime.contentModeId === "aeon"
      ? runtime.roster
      : await loadContentRoster(
          queryClient,
          runtime.contentModeId,
          game.manifestVersion,
          runtime.roster,
        );
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

function localPlayerSeed(): string {
  const existing = window.localStorage.getItem(LOCAL_PLAYER_SEED_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(LOCAL_PLAYER_SEED_KEY, created);
  return created;
}

function targetFor(
  activityId: SoloActivity,
  runtime: SoloModeRuntime,
  salt = "",
): GameEntitySummary {
  const eligible = runtime.roster.filter((entity) => {
    const flags = entity as GameEntitySummary & { enabled?: boolean; targetEligible?: boolean };
    return flags.targetEligible === undefined || (flags.enabled !== false && flags.targetEligible);
  });
  const seed =
    activityId === "daily"
      ? `${getBeijingDateKey()}-${localPlayerSeed()}`
      : `${crypto.randomUUID()}-${salt}`;
  const target = eligible[stringHash(seed) % eligible.length];
  if (!target) throw new Error("题库为空");
  return target;
}

function createLocalGame(
  activityId: SoloActivity,
  runtime: SoloModeRuntime,
  target: GameEntitySummary,
): PublicGame {
  const contentModeId = runtime.contentModeId;
  const mode = runtime.manifest.modes.find((item) => item.id === contentModeId);
  if (!mode) throw new Error(`内容模式未注册：${contentModeId}`);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    modeId: contentModeId,
    activityId,
    poolRuleVersion: mode.rulesVersion,
    manifestVersion: runtime.manifest.manifestVersion,
    dateKey: activityId === "daily" ? getBeijingDateKey() : null,
    maxAttempts: mode.maxAttempts,
    guesses: [],
    status: "active",
    startedAt: now,
    completedAt: null,
    elapsedMs: 0,
    answer: null,
    ...(contentModeId === "aeon" && "imagePath" in target.assets
      ? { aeonImagePath: target.assets.imagePath, aeonImageFocus: target.assets.focus }
      : {}),
    fieldDefinitions:
      contentModeId === "playable" ? selectSnapshotFieldDefinitions(mode.fields) : mode.fields,
  };
}

export function useGameSession(
  activityId: SoloActivity,
  initialGame: PublicGame | null | undefined,
  runtime: SoloModeRuntime,
): GameSession {
  const contentModeId = runtime.contentModeId;
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<PublicGame | null>(initialGame ?? null);
  const [roster, setRoster] = useState<readonly GameEntitySummary[]>(runtime.roster);
  const [sourceState, setSourceState] = useState<SessionSource>(initialGame ? "server" : null);
  const [navigationGameId, setNavigationGameId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const localTargetId = useRef<string | null>(null);
  const submitting = useRef(false);
  const startSequence = useRef(0);
  const sessionEpoch = useRef(0);
  const sessionActivity = useRef(activityId);

  const game = gameState ?? initialGame ?? null;
  const source = sourceState ?? (initialGame ? "server" : null);

  const writeCurrentCache = useCallback(
    (next: PublicGame | null) => {
      if (contentModeId !== "playable") return;
      queryClient.setQueryData<CurrentGames>(currentGamesQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          serverNow: new Date().toISOString(),
          [activityId]: activityId === "practice" && next?.status !== "active" ? null : next,
        };
      });
    },
    [activityId, contentModeId, queryClient],
  );

  useEffect(() => {
    if (sessionActivity.current !== activityId) {
      sessionActivity.current = activityId;
      ++startSequence.current;
      sessionEpoch.current += 1;
      localTargetId.current = null;
      submitting.current = false;
      setRoster(runtime.roster);
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
  }, [activityId, contentModeId, initialGame, runtime.roster, sourceState]);

  useEffect(() => {
    if (!initialGame || sourceState === "local") return;
    let cancelled = false;
    const rosterPromise =
      contentModeId === "aeon"
        ? Promise.resolve(runtime.roster)
        : loadContentRoster(
            queryClient,
            contentModeId,
            initialGame.manifestVersion,
            runtime.roster,
          );
    void rosterPromise.then((snapshotRoster) => {
      if (!cancelled) setRoster(snapshotRoster);
    });
    return () => {
      cancelled = true;
    };
  }, [
    contentModeId,
    initialGame?.id,
    initialGame?.manifestVersion,
    queryClient,
    runtime.roster,
    sourceState,
  ]);

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
      const result = await startServerGame(queryClient, activityId, runtime);
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
  }, [activityId, applyServerStart, queryClient, runtime]);

  const startOffline = useCallback(() => {
    const target = targetFor(activityId, runtime, String(Date.now()));
    const localGame = createLocalGame(activityId, runtime, target);
    ++startSequence.current;
    sessionEpoch.current += 1;
    localTargetId.current = target.id;
    setRoster(runtime.roster);
    setGameState(localGame);
    setSourceState("local");
    setNavigationGameId(null);
    setErrorCode(null);
    setBusy(false);
    return true;
  }, [activityId, runtime]);

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

      const localRoster = runtime.roster;
      const target = localRoster.find((entity) => entity.id === localTargetId.current);
      const guess = localRoster.find((entity) => entity.id === characterId);
      if (!target || !guess) {
        setErrorCode("NOT_FOUND");
        submitting.current = false;
        setBusy(false);
        return;
      }
      const result = runtime.createGuessResult(target, guess);
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
    [game, queryClient, runtime, source, writeCurrentCache],
  );

  const restart = useCallback(async () => {
    if (activityId === "daily") return;
    if (source === "local") {
      startOffline();
      return;
    }
    await start();
  }, [activityId, source, start, startOffline]);

  const abandonAndRestart = useCallback(async () => {
    if (!game || game.status !== "active" || activityId !== "practice") return false;
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
      const result = await startServerGame(queryClient, activityId, runtime);
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
    activityId,
    game,
    queryClient,
    runtime,
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
