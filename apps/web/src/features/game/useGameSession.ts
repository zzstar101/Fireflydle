import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  Character,
  CurrentGames,
  Difficulty,
  GameMode,
  GameEntitySummary,
  NpcSummary,
  PublicGame,
} from "@fireflydle/contracts";
import { characters, contentManifest, npcManifest } from "@fireflydle/game-data";
import {
  ATTEMPTS_BY_DIFFICULTY,
  createGuessResultWithRules,
  createNpcGuessResult,
  getBeijingDateKey,
  hasDuplicateGuess,
  selectSnapshotFieldDefinitions,
  snapshotRulesFromFieldDefinitions,
} from "@fireflydle/game-engine";
import { ApiClientError, apiRequest, ensureSession } from "../../api/client";
import { bundledRosterFor, loadContentRoster } from "./content-roster";
import { currentGamesQueryKey } from "./useCurrentGames";

type PlayableMode = Extract<GameMode, "daily" | "random">;
type SoloContentMode = "playable" | "npc";
type SessionSource = "server" | "local" | null;
const LOCAL_PLAYER_SEED_KEY = "fireflydle-local-player-seed";
const playableMode =
  contentManifest.modes.find((item) => item.id === "playable") ??
  (() => {
    throw new Error("普通角色模式未注册");
  })();
const playableFieldDefinitions = playableMode.fields;
const snapshotFieldRules = snapshotRulesFromFieldDefinitions(playableFieldDefinitions);
const npcMode =
  npcManifest.modes.find((item) => item.id === "npc") ??
  (() => {
    throw new Error("NPC 模式未注册");
  })();
function rosterFor(contentModeId: SoloContentMode): readonly GameEntitySummary[] {
  return bundledRosterFor(contentModeId);
}

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
  mode: PlayableMode,
  difficulty: Difficulty,
  contentModeId: SoloContentMode,
): Promise<ServerStartResult> {
  // 会话与对局创建必须顺序执行，首次访客请求才能稳定携带身份 cookie。
  await ensureSession();
  const game = await apiRequest<PublicGame>("/games", {
    method: "POST",
    body: JSON.stringify({ mode, difficulty, modeId: contentModeId }),
  });
  const roster = await loadContentRoster(queryClient, contentModeId, game.manifestVersion);
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
  mode: PlayableMode,
  difficulty: Difficulty,
  contentModeId: SoloContentMode,
  salt = "",
): GameEntitySummary {
  const eligible =
    contentModeId === "npc"
      ? rosterFor("npc")
      : characters.filter((character) => character.enabled && character.targetEligible);
  const seed =
    mode === "daily"
      ? `${getBeijingDateKey()}-${localPlayerSeed()}`
      : `${crypto.randomUUID()}-${difficulty}-${salt}`;
  const target = eligible[stringHash(seed) % eligible.length];
  if (!target) throw new Error("题库为空");
  return target;
}

function createLocalGame(
  mode: PlayableMode,
  difficulty: Difficulty,
  contentModeId: SoloContentMode,
): PublicGame {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    mode,
    modeId: contentModeId,
    activityId: mode === "daily" ? "daily" : "practice",
    poolRuleVersion: contentModeId === "npc" ? npcMode.rulesVersion : playableMode.rulesVersion,
    manifestVersion:
      contentModeId === "npc" ? npcManifest.manifestVersion : contentManifest.manifestVersion,
    difficulty,
    dateKey: mode === "daily" ? getBeijingDateKey() : null,
    maxAttempts: contentModeId === "npc" ? npcMode.maxAttempts : ATTEMPTS_BY_DIFFICULTY[difficulty],
    guesses: [],
    status: "active",
    startedAt: now,
    completedAt: null,
    elapsedMs: 0,
    answer: null,
    fieldDefinitions:
      contentModeId === "npc"
        ? npcMode.fields
        : selectSnapshotFieldDefinitions(playableFieldDefinitions),
  };
}

export function useGameSession(
  mode: PlayableMode,
  difficulty: Difficulty,
  initialGame: PublicGame | null | undefined,
  contentModeId: SoloContentMode = "playable",
): GameSession {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<PublicGame | null>(initialGame ?? null);
  const [roster, setRoster] = useState<readonly GameEntitySummary[]>(rosterFor(contentModeId));
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
      if (contentModeId === "npc") return;
      queryClient.setQueryData<CurrentGames>(currentGamesQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          serverNow: new Date().toISOString(),
          [mode]: mode === "random" && next?.status !== "active" ? null : next,
        };
      });
    },
    [contentModeId, mode, queryClient],
  );

  useEffect(() => {
    if (sessionMode.current !== mode) {
      sessionMode.current = mode;
      ++startSequence.current;
      sessionEpoch.current += 1;
      localTargetId.current = null;
      submitting.current = false;
      setRoster(rosterFor(contentModeId));
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
  }, [contentModeId, initialGame, mode, sourceState]);

  useEffect(() => {
    if (!initialGame || sourceState === "local") return;
    let cancelled = false;
    void loadContentRoster(queryClient, contentModeId, initialGame.manifestVersion).then(
      (snapshotRoster) => {
        if (!cancelled) setRoster(snapshotRoster);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [contentModeId, initialGame?.id, initialGame?.manifestVersion, queryClient, sourceState]);

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
      const result = await startServerGame(queryClient, mode, difficulty, contentModeId);
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
  }, [applyServerStart, contentModeId, difficulty, mode, queryClient]);

  const startOffline = useCallback(() => {
    const target = targetFor(mode, difficulty, contentModeId, String(Date.now()));
    const localGame = createLocalGame(mode, difficulty, contentModeId);
    ++startSequence.current;
    sessionEpoch.current += 1;
    localTargetId.current = target.id;
    setRoster(rosterFor(contentModeId));
    setGameState(localGame);
    setSourceState("local");
    setNavigationGameId(null);
    setErrorCode(null);
    setBusy(false);
    return true;
  }, [contentModeId, difficulty, mode]);

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

      const localRoster = rosterFor(contentModeId);
      const target = localRoster.find((entity) => entity.id === localTargetId.current);
      const guess = localRoster.find((entity) => entity.id === characterId);
      if (!target || !guess) {
        setErrorCode("NOT_FOUND");
        submitting.current = false;
        setBusy(false);
        return;
      }
      const result =
        contentModeId === "npc"
          ? createNpcGuessResult(target as NpcSummary, guess as NpcSummary)
          : createGuessResultWithRules(target as Character, guess as Character, snapshotFieldRules);
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
    [contentModeId, game, queryClient, source, writeCurrentCache],
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
      const result = await startServerGame(queryClient, mode, difficulty, contentModeId);
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
    contentModeId,
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
