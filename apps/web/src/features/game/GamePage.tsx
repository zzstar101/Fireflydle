import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Gauge,
  ImageDown,
  Info,
  RadioTower,
  RotateCcw,
  Signal,
  Sparkles,
  Swords,
  Trophy,
  WifiOff,
} from "lucide-react";
import type { FriendChallenge, PersonalStats, PublicGame } from "@fireflydle/contracts";
import { getBeijingDateKey, selectSnapshotFieldDefinitions } from "@fireflydle/game-engine";
import { contentManifest, currencyWarsManifest, npcManifest } from "@fireflydle/game-data";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { apiRequest, ensureSession } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import { ShareResultDialog } from "./ShareResultDialog";
import { RulesPanel } from "./RulesPanel";
import { triggerGameHaptic } from "./haptics";
import { useCurrentGames } from "./useCurrentGames";
import { useGameSession } from "./useGameSession";
import { markInstallEligible } from "../../pwa";
import "./game.css";

interface SharePreview {
  imageUrl: string;
  fileName: string;
}

function formatTime(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

type SoloContentMode = "playable" | "npc" | "currency-wars";

function manifestFor(contentModeId: SoloContentMode) {
  return contentModeId === "npc"
    ? npcManifest
    : contentModeId === "currency-wars"
      ? currencyWarsManifest
      : contentManifest;
}

function fieldSummary(locale: "zh-CN" | "en" | "ja", contentModeId: SoloContentMode): string {
  const manifest = manifestFor(contentModeId);
  const mode = manifest.modes.find((entry) => entry.id === contentModeId);
  const fields = (
    contentModeId === "playable"
      ? selectSnapshotFieldDefinitions(mode?.fields ?? [])
      : (mode?.fields ?? [])
  )
    .map((field) => field.label[locale])
    .join(locale === "ja" ? "・" : ", ");
  return fields ?? "";
}

function ruleLabels(t: (key: string) => string) {
  return {
    open: t("prep.viewRules"),
    close: t("common.close"),
    range: t("prep.ruleRange"),
    guesses: t("prep.ruleGuesses"),
    fields: t("prep.ruleFields"),
    colors: t("prep.ruleColors"),
    directions: t("prep.ruleDirections"),
    example: t("prep.ruleExample"),
    exact: t("game.exact"),
    closeMatch: t("game.close"),
    miss: t("game.miss"),
    higher: t("game.higher"),
    lower: t("game.lower"),
  };
}

function GamePreparation({
  mode,
  contentModeId,
  checking,
  busy,
  connectionFailed,
  onStart,
  onRetry,
  onOffline,
}: {
  mode: "daily" | "random";
  contentModeId: SoloContentMode;
  checking: boolean;
  busy: boolean;
  connectionFailed: boolean;
  onStart: () => void;
  onRetry: () => void;
  onOffline: () => void;
}) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const modeDefinition = manifestFor(contentModeId).modes.find(
    (entry) => entry.id === contentModeId,
  );
  const maxAttempts = modeDefinition?.maxAttempts ?? 6;
  const fields = modeDefinition?.fields ?? [];
  const poolSize =
    (contentModeId === "npc" ? npcManifest : contentManifest).pools.find(
      (pool) => pool.id === modeDefinition?.candidatePoolId,
    )?.candidateIds.length ?? 0;

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
          <h1>
            {contentModeId === "npc"
              ? "NPC"
              : contentModeId === "currency-wars"
                ? locale === "zh-CN"
                  ? "货币战争"
                  : locale === "ja"
                    ? "コイン戦争"
                    : "Currency Wars"
                : mode === "daily"
                  ? t("game.daily")
                  : t("game.random")}
          </h1>
          <p>
            {contentModeId === "npc" || contentModeId === "currency-wars"
              ? fieldSummary(locale, contentModeId)
              : mode === "daily"
                ? t("prep.dailyIntro")
                : t("prep.randomIntro")}
          </p>
        </div>
        <div className="prep-route-mark" aria-hidden="true">
          <span>{mode === "daily" ? "01" : "02"}</span>
          <strong>{mode === "daily" ? t("game.dailyShort") : t("game.randomShort")}</strong>
        </div>
      </header>

      <section className="prep-console" aria-labelledby="rules-heading">
        <div className="prep-section-label">
          <span>01</span>
          <div>
            <h2 id="rules-heading">
              {mode === "daily"
                ? locale === "zh-CN"
                  ? "今日规则"
                  : locale === "ja"
                    ? "今日のルール"
                    : "TODAY'S RULE"
                : locale === "zh-CN"
                  ? "练习规则"
                  : locale === "ja"
                    ? "練習ルール"
                    : "PRACTICE RULE"}
            </h2>
            <p>
              {locale === "zh-CN"
                ? `${contentModeId === "npc" ? "NPC 练习" : contentModeId === "currency-wars" ? "货币战争练习" : mode === "daily" ? "每日一题" : "练习"}固定 ${maxAttempts} 次猜测${mode === "daily" ? "，每位玩家每天只有一局。" : "。"}`
                : locale === "ja"
                  ? `${contentModeId === "npc" ? "NPC練習" : contentModeId === "currency-wars" ? "コイン戦争練習" : mode === "daily" ? "デイリー" : "練習"}は${maxAttempts}回固定です${mode === "daily" ? "。1日1回だけ挑戦できます。" : "。"}`
                  : `${contentModeId === "npc" ? "NPC practice" : contentModeId === "currency-wars" ? "Currency Wars practice" : mode === "daily" ? "Daily puzzles" : "Practice"} always allows ${maxAttempts} guesses${mode === "daily" ? " and one run per player." : "."}`}
            </p>
          </div>
        </div>
        <div className="prep-daily-rule">
          <Gauge size={22} aria-hidden="true" />
          <span>
            <strong>
              {locale === "zh-CN"
                ? "固定猜测次数"
                : locale === "ja"
                  ? "固定推測回数"
                  : "FIXED ATTEMPTS"}
            </strong>
            <small>
              {locale === "zh-CN"
                ? contentModeId === "npc"
                  ? "NPC 练习使用独立四猜规则"
                  : contentModeId === "currency-wars"
                    ? "货币战争使用独立六猜规则"
                    : "所有普通角色活动使用相同次数规则"
                : locale === "ja"
                  ? contentModeId === "npc"
                    ? "NPC練習専用の4回ルール"
                    : contentModeId === "currency-wars"
                      ? "コイン戦争専用の6回ルール"
                      : "通常キャラクターの全アクティビティで同じルール"
                  : contentModeId === "npc"
                    ? "Four attempts for NPC practice"
                    : contentModeId === "currency-wars"
                      ? "Six attempts for Currency Wars practice"
                      : "The same limit for every playable-character activity"}
            </small>
          </span>
          <b>{maxAttempts}</b>
          <em>{t("prep.attemptUnit")}</em>
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

        {connectionFailed && mode === "random" && contentModeId === "playable" && (
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

        <RulesPanel
          locale={locale}
          title={t("prep.rulesTitle")}
          intro={t("prep.rulesIntro")}
          poolSize={poolSize}
          maxAttempts={maxAttempts}
          fields={fields}
          labels={ruleLabels(t)}
        />
      </section>
    </main>
  );
}

function ActiveGame({
  mode,
  contentModeId,
  session,
}: {
  mode: "daily" | "random";
  contentModeId: SoloContentMode;
  session: ReturnType<typeof useGameSession> & { game: PublicGame };
}) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const [now, setNow] = useState(Date.now());
  const [sharePreview, setSharePreview] = useState<SharePreview | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const gameHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const abandonButtonRef = useRef<HTMLButtonElement>(null);
  const confirmAbandonButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const observedGuessCountRef = useRef(session.game.guesses.length);
  const { game, roster, source, busy, errorCode, submitGuess, restart, abandonAndRestart } =
    session;
  const guessCount = game.guesses.length;
  const modeManifest = contentModeId === "npc" ? npcManifest : contentManifest;
  const modeDefinition = modeManifest.modes.find((entry) => entry.id === contentModeId);
  const ruleFields = game.fieldDefinitions ?? modeDefinition?.fields ?? [];
  const rulePoolSize =
    modeManifest.pools.find((pool) => pool.id === modeDefinition?.candidatePoolId)?.candidateIds
      .length ?? 0;
  const playerStats = useQuery({
    queryKey: ["stats", "game-rail"],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: source === "server",
    retry: false,
  });

  useEffect(() => {
    setConfirmAbandon(false);
    observedGuessCountRef.current = game.guesses.length;
    gameHeadingRef.current?.focus();
  }, [game.id]);

  useEffect(() => {
    const previousCount = observedGuessCountRef.current;
    observedGuessCountRef.current = guessCount;
    if (contentModeId !== "playable" || guessCount <= previousCount) return;

    const latestGuess = game.guesses.at(-1);
    triggerGameHaptic(latestGuess?.isCorrect ? "win" : "life-lost");
  }, [contentModeId, guessCount]);

  useEffect(() => {
    if (game.status !== "active") resultRef.current?.focus();
    if (game.status === "won" || game.status === "lost") markInstallEligible();
  }, [game.status]);

  useEffect(() => {
    if (confirmAbandon) confirmAbandonButtonRef.current?.focus();
  }, [confirmAbandon]);

  useEffect(() => {
    if (game.status !== "active") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [game.status]);

  useEffect(
    () => () => {
      if (sharePreview) URL.revokeObjectURL(sharePreview.imageUrl);
    },
    [sharePreview],
  );

  const elapsedMs =
    game.status === "active" ? now - new Date(game.startedAt).getTime() : game.elapsedMs;
  const remaining = Math.max(0, game.maxAttempts - game.guesses.length);
  const guessedIds = useMemo(
    () => new Set(game.guesses.map((guess) => guess.character.id)),
    [game.guesses],
  );
  const finished = game.status !== "active";
  const shareable = game.status === "won" || game.status === "lost";

  const closeSharePreview = useCallback(() => {
    setSharePreview(null);
    window.requestAnimationFrame(() => shareButtonRef.current?.focus());
  }, []);

  const createShareImage = async () => {
    if (!shareable || shareBusy) return;
    setShareBusy(true);
    setShareError(false);
    try {
      const { generateShareResultImage, shareImageFileName } = await import("./share-result-image");
      const dateKey = game.dateKey ?? getBeijingDateKey();
      const blob = await generateShareResultImage({
        locale,
        mode,
        dateKey,
        difficulty: game.difficulty,
        guesses: game.guesses,
        ...(game.fieldDefinitions ? { fieldDefinitions: game.fieldDefinitions } : {}),
        maxAttempts: game.maxAttempts,
        won: game.status === "won",
        elapsedMs: game.elapsedMs,
        siteUrl: window.location.origin,
      });
      setSharePreview({
        imageUrl: URL.createObjectURL(blob),
        fileName: shareImageFileName({ dateKey, mode }),
      });
    } catch {
      setShareError(true);
    } finally {
      setShareBusy(false);
    }
  };

  const copyFriendChallenge = async () => {
    if (challengeBusy) return;
    setChallengeBusy(true);
    setChallengeError(false);
    try {
      let url = challengeUrl;
      if (!url) {
        const challenge = await apiRequest<FriendChallenge>(`/games/${game.id}/challenges`, {
          method: "POST",
        });
        url = `${window.location.origin}/challenge/${challenge.id}`;
        setChallengeUrl(url);
      }
      await navigator.clipboard.writeText(url);
    } catch {
      setChallengeError(true);
    } finally {
      setChallengeBusy(false);
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
            {contentModeId === "npc"
              ? "NPC · TRACER"
              : contentModeId === "currency-wars"
                ? "CURRENCY WARS · TRACER"
                : mode === "daily"
                  ? t("prep.dailyEyebrow")
                  : t("prep.randomEyebrow")}
          </p>
          <h1 ref={gameHeadingRef} tabIndex={-1}>
            {contentModeId === "npc"
              ? "NPC"
              : contentModeId === "currency-wars"
                ? locale === "zh-CN"
                  ? "货币战争"
                  : locale === "ja"
                    ? "コイン戦争"
                    : "Currency Wars"
                : mode === "daily"
                  ? t("game.daily")
                  : t("game.random")}
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
            <h2>{locale === "zh-CN" ? "猜测次数" : locale === "ja" ? "推測回数" : "ATTEMPTS"}</h2>
            <div className="locked-difficulty">
              <span>{locale === "zh-CN" ? "固定" : locale === "ja" ? "固定" : "FIXED"}</span>
              <strong>{game.maxAttempts}</strong>
              <small>
                {locale === "zh-CN"
                  ? "所有活动统一"
                  : locale === "ja"
                    ? "全アクティビティ共通"
                    : "SAME FOR EVERY ACTIVITY"}
              </small>
            </div>
          </div>
          <div className="rail-section compact">
            <span className="rail-number">02</span>
            <RulesPanel
              locale={locale}
              title={t("prep.rulesTitle")}
              intro={t("prep.rulesIntro")}
              poolSize={rulePoolSize}
              maxAttempts={game.maxAttempts}
              fields={ruleFields}
              labels={ruleLabels(t)}
            />
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
              {...(contentModeId === "playable"
                ? { searchIndex: contentManifest.searchIndex }
                : {})}
              excludedIds={guessedIds}
              disabled={busy}
              onSubmit={(id) => {
                if (contentModeId === "playable") triggerGameHaptic("submit");
                void submitGuess(id);
              }}
            />
          )}

          {errorCode && (
            <div className="inline-error" role="alert">
              <Info size={17} /> {t(`error.${errorCode}`, { defaultValue: t("error.generic") })}
            </div>
          )}

          {finished && game.answer && (
            <>
              {contentModeId === "playable" && game.status === "won" ? (
                <div className="settlement-energy" aria-hidden="true">
                  <i />
                  <span />
                  <i />
                </div>
              ) : null}
              <section
                ref={resultRef}
                className={`game-result result-${game.status}${contentModeId === "playable" ? " result-animated" : ""}`}
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
                      ref={shareButtonRef}
                      className="result-share-button"
                      type="button"
                      disabled={shareBusy}
                      onClick={() => void createShareImage()}
                    >
                      {shareBusy ? (
                        <span className="button-spinner" aria-hidden="true" />
                      ) : (
                        <ImageDown size={17} />
                      )}{" "}
                      {shareBusy ? t("game.generatingImage") : t("game.shareImage")}
                    </button>
                  )}
                  {shareable && contentModeId === "playable" && source === "server" && (
                    <button
                      className="ticket-button-secondary"
                      type="button"
                      disabled={challengeBusy}
                      onClick={() => void copyFriendChallenge()}
                    >
                      {challengeBusy ? (
                        <span className="button-spinner" aria-hidden="true" />
                      ) : (
                        <Swords size={17} />
                      )}{" "}
                      {challengeUrl
                        ? locale === "zh-CN"
                          ? "复制挑战链接"
                          : locale === "ja"
                            ? "リンクをコピー"
                            : "Copy challenge link"
                        : locale === "zh-CN"
                          ? "好友同题挑战"
                          : locale === "ja"
                            ? "同じ問題で挑戦"
                            : "Challenge a friend"}
                    </button>
                  )}
                </div>
                {shareError && (
                  <p className="share-image-error" role="alert">
                    {t("game.shareImageError")}
                  </p>
                )}
                {challengeError && (
                  <p className="share-image-error" role="alert">
                    {locale === "zh-CN"
                      ? "暂时无法生成或复制挑战链接。"
                      : locale === "ja"
                        ? "チャレンジリンクを作成できません。"
                        : "Could not create or copy the challenge link."}
                  </p>
                )}
              </section>
            </>
          )}

          <GuessBoard
            guesses={game.guesses}
            locale={locale}
            fields={game.fieldDefinitions}
            animateLatest={contentModeId === "playable"}
          />
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
          {mode === "random" ? (
            <Link className="leaderboard-callout" to="/leaderboard">
              <Trophy size={18} />
              <span>{t("prep.viewLeaderboard")}</span>
            </Link>
          ) : null}
        </aside>
      </section>
      {sharePreview ? (
        <ShareResultDialog
          imageUrl={sharePreview.imageUrl}
          fileName={sharePreview.fileName}
          onClose={closeSharePreview}
        />
      ) : null}
    </main>
  );
}

export default function GamePage({
  mode,
  contentModeId = "playable",
}: {
  mode: "daily" | "random";
  contentModeId?: SoloContentMode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedGameId = searchParams.get("game");
  const currentGames = useCurrentGames();
  const requestedGame = useQuery({
    queryKey: ["games", "detail", requestedGameId],
    queryFn: async () => {
      await ensureSession();
      const game = await apiRequest<PublicGame>(`/games/${requestedGameId}`);
      if (game.mode !== mode || game.modeId !== contentModeId) {
        throw new Error("GAME_MODE_MISMATCH");
      }
      return game;
    },
    enabled: Boolean(requestedGameId),
    retry: false,
  });
  const initialGame = requestedGameId
    ? requestedGame.data
    : contentModeId === "playable"
      ? currentGames.data?.[mode]
      : null;
  const session = useGameSession(mode, "standard", initialGame, contentModeId);
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
        contentModeId={contentModeId}
        checking={checking}
        busy={session.busy}
        connectionFailed={connectionFailed}
        onStart={() => void session.start()}
        onRetry={retry}
        onOffline={() => session.startOffline()}
      />
    );
  }

  return <ActiveGame mode={mode} contentModeId={contentModeId} session={{ ...session, game }} />;
}
