import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Copy,
  Gauge,
  Info,
  RadioTower,
  RotateCcw,
  Share2,
  Signal,
  Sparkles,
  Trophy,
  WifiOff,
} from "lucide-react";
import type { Difficulty, PersonalStats, PublicGame } from "@fireflydle/contracts";
import {
  ATTEMPTS_BY_DIFFICULTY,
  createSpoilerFreeShareText,
  getBeijingDateKey,
} from "@fireflydle/game-engine";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { apiRequest, ensureSession } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import { useCurrentGames } from "./useCurrentGames";
import { useGameSession } from "./useGameSession";
import "./game.css";

const difficulties: Difficulty[] = ["casual", "standard", "hard"];

function formatTime(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function storedDifficulty(mode: "daily" | "random"): Difficulty {
  const value = window.localStorage.getItem(`fireflydle-${mode}-difficulty`);
  return value === "casual" || value === "hard" ? value : "standard";
}

function GamePreparation({
  mode,
  difficulty,
  setDifficulty,
  checking,
  busy,
  connectionFailed,
  onStart,
  onRetry,
  onOffline,
}: {
  mode: "daily" | "random";
  difficulty: Difficulty;
  setDifficulty: (value: Difficulty) => void;
  checking: boolean;
  busy: boolean;
  connectionFailed: boolean;
  onStart: () => void;
  onRetry: () => void;
  onOffline: () => void;
}) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);

  const moveDifficultyFocus = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: Difficulty,
  ) => {
    const index = difficulties.indexOf(current);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % difficulties.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + difficulties.length) % difficulties.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = difficulties.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const next = difficulties[nextIndex];
    if (!next) return;
    setDifficulty(next);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`button[data-difficulty="${next}"]`)
      ?.focus();
  };

  return (
    <main className={`game-preparation prep-${mode}`}>
      <Link className="prep-back" to="/">
        <ArrowLeft size={16} aria-hidden="true" /> {t("hub.backToHub")}
      </Link>
      <header className="prep-header">
        <div>
          <p className="eyebrow">
            {mode === "daily" ? t("prep.dailyEyebrow") : t("prep.randomEyebrow")}
          </p>
          <h1>{mode === "daily" ? t("game.daily") : t("game.random")}</h1>
          <p>{mode === "daily" ? t("prep.dailyIntro") : t("prep.randomIntro")}</p>
        </div>
        <div className="prep-route-mark" aria-hidden="true">
          <span>{mode === "daily" ? "01" : "02"}</span>
          <strong>{mode === "daily" ? t("game.dailyShort") : t("game.randomShort")}</strong>
        </div>
      </header>

      <section className="prep-console" aria-labelledby="difficulty-heading">
        <div className="prep-section-label">
          <span>01</span>
          <div>
            <h2 id="difficulty-heading">{t("prep.chooseDifficulty")}</h2>
            <p>{t("prep.difficultyHint")}</p>
          </div>
        </div>
        <div className="prep-difficulties" role="radiogroup" aria-label={t("game.difficulty")}>
          {difficulties.map((value) => (
            <button
              key={value}
              data-difficulty={value}
              type="button"
              role="radio"
              aria-checked={difficulty === value}
              tabIndex={difficulty === value ? 0 : -1}
              className={difficulty === value ? "active" : undefined}
              disabled={busy}
              onClick={() => setDifficulty(value)}
              onKeyDown={(event) => moveDifficultyFocus(event, value)}
            >
              <span>
                <strong>{t(`game.${value}`)}</strong>
                <small>{t(`prep.${value}Hint`)}</small>
              </span>
              <b>{ATTEMPTS_BY_DIFFICULTY[value]}</b>
              <em>{t("prep.attemptUnit")}</em>
              {difficulty === value && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="prep-start-zone">
          <div className="timer-notice">
            <Clock3 size={19} aria-hidden="true" />
            <span>
              <strong>{t("prep.timerTitle")}</strong>
              {t("prep.timerBody")}
            </span>
          </div>
          <button
            className="ticket-button prep-start-button"
            type="button"
            disabled={checking || busy || connectionFailed}
            onClick={onStart}
          >
            {busy || checking ? <span className="button-spinner" /> : <RadioTower size={18} />}
            {busy ? t("prep.connecting") : checking ? t("prep.checking") : t("prep.start")}
          </button>
        </div>

        {connectionFailed && (
          <section className="connection-choice" role="alert" aria-labelledby="connection-title">
            <WifiOff size={22} aria-hidden="true" />
            <div>
              <h2 id="connection-title">{t("prep.connectionTitle")}</h2>
              <p>{t("prep.connectionBody")}</p>
            </div>
            <div className="connection-actions">
              <button
                className="ticket-button-secondary"
                type="button"
                disabled={busy}
                onClick={onRetry}
              >
                {t("common.retry")}
              </button>
              <button
                className="offline-practice-button"
                type="button"
                disabled={busy}
                onClick={onOffline}
              >
                {t("prep.offlineAction")}
              </button>
            </div>
          </section>
        )}

        <details className="prep-rules">
          <summary>
            <BookOpen size={17} aria-hidden="true" /> {t("prep.viewRules")}
          </summary>
          <div>
            <p>{t("prep.rulesIntro")}</p>
            <ul>
              <li>
                <i className="key-exact">✓</i>
                <span>
                  <strong>{t("game.exact")}</strong>
                  {t("prep.exactRule")}
                </span>
              </li>
              <li>
                <i className="key-close">•</i>
                <span>
                  <strong>{t("game.close")}</strong>
                  {t("prep.closeRule")}
                </span>
              </li>
              <li>
                <i className="key-miss">×</i>
                <span>
                  <strong>{t("game.miss")}</strong>
                  {t("prep.missRule")}
                </span>
              </li>
            </ul>
            <small>
              {locale === "zh-CN"
                ? "比较字段：属性、命途、稀有度、阵营、实装版本。"
                : locale === "ja"
                  ? "比較項目：属性・運命・レア度・陣営・実装版。"
                  : "Compare element, path, rarity, faction, and release version."}
            </small>
          </div>
        </details>
      </section>
    </main>
  );
}

function ActiveGame({
  mode,
  session,
}: {
  mode: "daily" | "random";
  session: ReturnType<typeof useGameSession> & { game: PublicGame };
}) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const [now, setNow] = useState(Date.now());
  const [shared, setShared] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const gameHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const abandonButtonRef = useRef<HTMLButtonElement>(null);
  const confirmAbandonButtonRef = useRef<HTMLButtonElement>(null);
  const { game, roster, source, busy, errorCode, submitGuess, restart, abandonAndRestart } =
    session;
  const playerStats = useQuery({
    queryKey: ["stats", "game-rail"],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: source === "server",
    retry: false,
  });

  useEffect(() => {
    setConfirmAbandon(false);
    gameHeadingRef.current?.focus();
  }, [game.id]);

  useEffect(() => {
    if (game.status !== "active") resultRef.current?.focus();
  }, [game.status]);

  useEffect(() => {
    if (confirmAbandon) confirmAbandonButtonRef.current?.focus();
  }, [confirmAbandon]);

  useEffect(() => {
    if (game.status !== "active") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [game.status]);

  const elapsedMs =
    game.status === "active" ? now - new Date(game.startedAt).getTime() : game.elapsedMs;
  const remaining = Math.max(0, game.maxAttempts - game.guesses.length);
  const guessedIds = useMemo(
    () => new Set(game.guesses.map((guess) => guess.character.id)),
    [game.guesses],
  );
  const finished = game.status !== "active";
  const shareable = game.status === "won" || game.status === "lost";

  const share = async () => {
    if (!shareable) return;
    const text = createSpoilerFreeShareText({
      locale,
      dateKey: game.dateKey ?? getBeijingDateKey(),
      difficulty: game.difficulty,
      guesses: game.guesses,
      won: game.status === "won",
      elapsedMs: game.elapsedMs,
      url: window.location.origin,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: "Fireflydle", text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1_800);
    } catch {
      setShared(false);
    }
  };

  return (
    <main className="game-page running-game-page">
      <section className="game-hero running-game-hero">
        <div className="hero-track" aria-hidden="true">
          <span />
          <i />
          <span />
          <i />
          <span />
        </div>
        <div className="hero-copy">
          <Link className="game-hub-link" to="/">
            <ArrowLeft size={15} /> {t("hub.backToHub")}
          </Link>
          <p className="eyebrow">
            {mode === "daily" ? t("prep.dailyEyebrow") : t("prep.randomEyebrow")}
          </p>
          <h1 ref={gameHeadingRef} tabIndex={-1}>
            {mode === "daily" ? t("game.daily") : t("game.random")}
          </h1>
          <p>{t("prep.activeIntro")}</p>
        </div>
        <div className="hero-stamp">
          <span>{mode === "daily" ? t("game.dailyShort") : t("game.randomShort")}</span>
          <strong>
            {mode === "daily"
              ? (game.dateKey ?? getBeijingDateKey()).slice(5).replace("-", ".")
              : "∞"}
          </strong>
          <small>{mode === "daily" ? "UTC+8 · 00:00" : t("game.unlimited")}</small>
        </div>
      </section>

      <section className="game-workspace">
        <aside className="game-left-rail">
          <div className="rail-section">
            <span className="rail-number">01</span>
            <h2>{t("game.difficulty")}</h2>
            <div className="locked-difficulty">
              <span>{t(`game.${game.difficulty}`)}</span>
              <strong>{game.maxAttempts}</strong>
              <small>{t("prep.locked")}</small>
            </div>
          </div>
          <div className="rail-section compact">
            <span className="rail-number">02</span>
            <h2>{t("game.rules")}</h2>
            <ul className="rule-key">
              <li>
                <i className="key-exact">
                  <span>✓</span>
                </i>
                <span>
                  <strong>{t("game.exact")}</strong>
                  {t("prep.exactRule")}
                </span>
              </li>
              <li>
                <i className="key-close">
                  <span>•</span>
                </i>
                <span>
                  <strong>{t("game.close")}</strong>
                  {t("prep.closeRule")}
                </span>
              </li>
              <li>
                <i className="key-miss">
                  <span>×</span>
                </i>
                <span>
                  <strong>{t("game.miss")}</strong>
                  {t("prep.missRule")}
                </span>
              </li>
            </ul>
          </div>
        </aside>

        <div className="game-main-column">
          <div className="metric-strip">
            <div>
              <span>
                <Gauge size={16} /> {t("game.attempts")}
              </span>
              <strong>
                {remaining}
                <small> / {game.maxAttempts}</small>
              </strong>
            </div>
            <div>
              <span>
                <Clock3 size={16} /> {t("game.elapsed")}
              </span>
              <strong className="mono">{formatTime(elapsedMs)}</strong>
            </div>
            <div>
              <span>
                <Signal size={16} />{" "}
                {mode === "daily"
                  ? t("home.dailyNumber", { date: game.dateKey })
                  : t("game.random")}
              </span>
              <strong className="service-state">
                <i className={source === "server" ? "online" : "local"} />
                {source === "server" ? t("common.online") : t("prep.offlinePractice")}
              </strong>
            </div>
          </div>

          {mode === "random" && game.status === "active" && (
            <div className="active-game-tools">
              {!confirmAbandon ? (
                <button
                  ref={abandonButtonRef}
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmAbandon(true)}
                >
                  {t("prep.abandon")}
                </button>
              ) : (
                <div className="abandon-confirm" role="alert">
                  <span>
                    <strong>{t("prep.abandonTitle")}</strong>
                    {t("prep.abandonBody")}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setConfirmAbandon(false);
                      window.requestAnimationFrame(() => abandonButtonRef.current?.focus());
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    ref={confirmAbandonButtonRef}
                    className="confirm-abandon"
                    type="button"
                    disabled={busy}
                    onClick={() => void abandonAndRestart()}
                  >
                    {t("prep.abandonConfirm")}
                  </button>
                </div>
              )}
            </div>
          )}

          {!finished && (
            <CharacterCombobox
              characters={roster}
              locale={locale}
              excludedIds={guessedIds}
              disabled={busy}
              onSubmit={(id) => void submitGuess(id)}
            />
          )}

          {errorCode && (
            <div className="inline-error" role="alert">
              <Info size={17} /> {t(`error.${errorCode}`, { defaultValue: t("error.generic") })}
            </div>
          )}

          {finished && game.answer && (
            <section
              ref={resultRef}
              className={`game-result result-${game.status}`}
              role="status"
              aria-live="polite"
              tabIndex={-1}
            >
              <div className="result-icon">
                <Sparkles size={25} />
              </div>
              <CharacterAvatar character={game.answer} size="large" priority />
              <div className="result-copy">
                <p>{game.status === "won" ? t("game.wonTitle") : t("game.lostTitle")}</p>
                <h2>{game.answer.names[locale]}</h2>
                <small>
                  {t("game.answer")} · {game.guesses.length}/{game.maxAttempts} ·{" "}
                  {formatTime(game.elapsedMs)}
                </small>
              </div>
              <div className="result-actions">
                {mode === "daily" ? (
                  <Link className="ticket-button" to="/">
                    <ArrowLeft size={17} /> {t("hub.backToHub")}
                  </Link>
                ) : (
                  <button
                    className="ticket-button"
                    type="button"
                    disabled={busy}
                    onClick={() => void restart()}
                  >
                    <RotateCcw size={17} /> {t("game.playAgain")}
                  </button>
                )}
                {mode === "random" && (
                  <Link className="ticket-button-secondary" to="/">
                    <ArrowLeft size={17} /> {t("hub.backToHub")}
                  </Link>
                )}
                {shareable && (
                  <button
                    className="result-share-button"
                    type="button"
                    onClick={() => void share()}
                  >
                    {shared ? <Copy size={17} /> : <Share2 size={17} />}{" "}
                    {shared ? t("common.copied") : t("game.share")}
                  </button>
                )}
              </div>
            </section>
          )}

          <GuessBoard guesses={game.guesses} locale={locale} />
        </div>

        <aside className="game-right-rail">
          <div className="game-index-label">{t("game.gameInfo")}</div>
          <div className="rail-metric">
            <span>{t("home.streak")}</span>
            <strong>{playerStats.data?.currentStreak ?? 0}</strong>
            <small>{t("game.daysUnit")}</small>
          </div>
          <div className="rail-metric">
            <span>{t("game.guessed")}</span>
            <strong>{game.guesses.length}</strong>
            <small>{t("prep.attemptUnit")}</small>
          </div>
          <div className="rail-metric">
            <span>{t("hub.nextReset")}</span>
            <strong>{mode === "daily" ? "00:00" : "∞"}</strong>
            <small>{mode === "daily" ? "UTC+8" : t("game.unlimited")}</small>
          </div>
          <Link className="leaderboard-callout" to="/leaderboard">
            <Trophy size={18} />
            <span>{t("prep.viewLeaderboard")}</span>
          </Link>
        </aside>
      </section>
    </main>
  );
}

export default function GamePage({ mode }: { mode: "daily" | "random" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedGameId = searchParams.get("game");
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => storedDifficulty(mode));
  const currentGames = useCurrentGames();
  const requestedGame = useQuery({
    queryKey: ["games", "detail", requestedGameId],
    queryFn: async () => {
      await ensureSession();
      const game = await apiRequest<PublicGame>(`/games/${requestedGameId}`);
      if (game.mode !== mode) throw new Error("GAME_MODE_MISMATCH");
      return game;
    },
    enabled: Boolean(requestedGameId),
    retry: false,
  });
  const initialGame = requestedGameId ? requestedGame.data : currentGames.data?.[mode];
  const session = useGameSession(mode, difficulty, initialGame);
  const navigationGameId = session.navigationGameId;
  const navigationGame =
    navigationGameId && session.game?.id === navigationGameId ? session.game : null;
  const game =
    navigationGame ??
    (requestedGameId
      ? session.game?.id === requestedGameId
        ? session.game
        : (requestedGame.data ?? null)
      : session.game);

  const setDifficulty = (value: Difficulty) => {
    setDifficultyState(value);
    window.localStorage.setItem(`fireflydle-${mode}-difficulty`, value);
  };

  useEffect(() => {
    if (!navigationGameId) return;
    if (requestedGameId === navigationGameId) {
      session.acknowledgeNavigation();
      return;
    }
    setSearchParams({ game: navigationGameId }, { replace: true });
  }, [navigationGameId, requestedGameId, session.acknowledgeNavigation, setSearchParams]);

  useEffect(() => {
    if (!game) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [game?.id]);

  const checking = requestedGameId ? requestedGame.isPending : currentGames.isPending;
  const lookupFailed = requestedGameId ? requestedGame.isError : currentGames.isError;
  const connectionFailed = lookupFailed || Boolean(session.errorCode);
  const retry = () => {
    session.clearError();
    if (session.errorCode) {
      void session.start();
    } else if (requestedGameId) {
      void requestedGame.refetch();
    } else {
      void currentGames.refetch();
    }
  };

  if (!game) {
    return (
      <GamePreparation
        mode={mode}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        checking={checking}
        busy={session.busy}
        connectionFailed={connectionFailed}
        onStart={() => void session.start()}
        onRetry={retry}
        onOffline={() => session.startOffline()}
      />
    );
  }

  return <ActiveGame mode={mode} session={{ ...session, game }} />;
}
