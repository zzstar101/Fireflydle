import { lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Share2,
  Sparkles,
  Trophy,
  WifiOff,
} from "lucide-react";
import type {
  AeonSummary,
  FriendChallenge,
  PersonalStats,
  PublicGame,
  PublicUser,
  ReplayShareResponse,
  SessionPayload,
} from "@fireflydle/contracts";
import { getBeijingDateKey, selectSnapshotFieldDefinitions } from "@fireflydle/game-engine";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { apiRequest, ensureSession } from "../../api/client";
import { useSession } from "../account/useSession";
import { usePreferences } from "../../state/preferences";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import { InferenceReview } from "./InferenceReview";
import { ShareResultDialog } from "./ShareResultDialog";
import { RulesPanel } from "./RulesPanel";
import { PlayableTutorial } from "./PlayableTutorial";
import {
  hasCompletedGuestPlayableTutorial,
  markGuestPlayableTutorialCompleted,
  supportsPlayableTutorial,
} from "./playable-tutorial-state";
import { triggerGameHaptic } from "./haptics";
import {
  buildFriendChallengeSharePayload,
  copyShareText,
  tryNativeFriendChallengeShare,
} from "./share-friend-challenge";
import { useCurrentGames } from "./useCurrentGames";
import { useGameSession } from "./useGameSession";
import type { SoloContentMode, SoloModeRuntime } from "./mode-runtime";
import { markInstallEligible } from "../../pwa";
import { useSpecialModePack } from "../../offline/use-special-mode-pack";
import "./game.css";

interface SharePreview {
  imageUrl: string;
  fileName: string;
  challengeUrl?: string;
}

function formatTime(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

const AeonGuessBoard = lazy(() =>
  import("./AeonGuessBoard").then((module) => ({ default: module.AeonGuessBoard })),
);

function fieldSummary(
  locale: "zh-CN" | "en" | "ja",
  contentModeId: SoloContentMode,
  runtime: SoloModeRuntime,
): string {
  const manifest = runtime.manifest;
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

function ruleLabels(t: (key: string) => string, locale: "zh-CN" | "en" | "ja") {
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
    replayTutorial:
      locale === "zh-CN" ? "重播新手教学" : locale === "ja" ? "ガイドを再生" : "Replay tutorial",
  };
}

function GamePreparation({
  activityId,
  contentModeId,
  runtime,
  checking,
  busy,
  connectionFailed,
  onStart,
  onRetry,
  onOffline,
  offlineUnavailable,
  offlinePackState,
  onRetryOfflinePack,
  onReplayTutorial,
}: {
  activityId: "daily" | "practice";
  contentModeId: SoloContentMode;
  runtime: SoloModeRuntime;
  checking: boolean;
  busy: boolean;
  connectionFailed: boolean;
  onStart: () => void;
  onRetry: () => void;
  onOffline: () => void;
  offlineUnavailable: boolean;
  offlinePackState?: "checking" | "downloading" | "ready" | "missing" | "unsupported" | "error";
  onRetryOfflinePack?: () => void;
  onReplayTutorial?: () => void;
}) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const modeDefinition = runtime.manifest.modes.find((entry) => entry.id === contentModeId);
  const maxAttempts = modeDefinition?.maxAttempts ?? 6;
  const fields = modeDefinition?.fields ?? [];
  const poolSize =
    runtime.manifest.pools.find((pool) => pool.id === modeDefinition?.candidatePoolId)?.candidateIds
      .length ?? 0;

  return (
    <main className={`game-preparation prep-${activityId}`}>
      <Link className="prep-back" to="/">
        <ArrowLeft size={16} aria-hidden="true" /> {t("hub.backToHub")}
      </Link>
      <header className="prep-header">
        <div>
          <p className="eyebrow">
            {activityId === "daily" ? t("prep.dailyEyebrow") : t("prep.randomEyebrow")}
          </p>
          <h1>
            {contentModeId === "npc"
              ? "NPC"
              : contentModeId === "aeon"
                ? locale === "en"
                  ? "Aeon image challenge"
                  : locale === "ja"
                    ? "星神画像チャレンジ"
                    : "星神图片挑战"
                : contentModeId === "currency-wars"
                  ? locale === "zh-CN"
                    ? "货币战争"
                    : locale === "ja"
                      ? "コイン戦争"
                      : "Currency Wars"
                  : activityId === "daily"
                    ? t("game.daily")
                    : t("game.random")}
          </h1>
          <p>
            {contentModeId === "npc" ||
            contentModeId === "currency-wars" ||
            contentModeId === "aeon"
              ? fieldSummary(locale, contentModeId, runtime)
              : activityId === "daily"
                ? t("prep.dailyIntro")
                : t("prep.randomIntro")}
          </p>
        </div>
        <div className="prep-route-mark" aria-hidden="true">
          <span>{activityId === "daily" ? "01" : "02"}</span>
          <strong>{activityId === "daily" ? t("game.dailyShort") : t("game.randomShort")}</strong>
        </div>
      </header>

      <section className="prep-console" aria-labelledby="rules-heading">
        <div className="prep-section-label">
          <span>01</span>
          <div>
            <h2 id="rules-heading">
              {activityId === "daily"
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
                ? `${contentModeId === "npc" ? "NPC 练习" : contentModeId === "currency-wars" ? "货币战争练习" : activityId === "daily" ? "每日一题" : "练习"}固定 ${maxAttempts} 次猜测${activityId === "daily" ? "，每位玩家每天只有一局。" : "。"}`
                : locale === "ja"
                  ? `${contentModeId === "npc" ? "NPC練習" : contentModeId === "currency-wars" ? "コイン戦争練習" : activityId === "daily" ? "デイリー" : "練習"}は${maxAttempts}回固定です${activityId === "daily" ? "。1日1回だけ挑戦できます。" : "。"}`
                  : `${contentModeId === "npc" ? "NPC practice" : contentModeId === "currency-wars" ? "Currency Wars practice" : activityId === "daily" ? "Daily puzzles" : "Practice"} always allows ${maxAttempts} guesses${activityId === "daily" ? " and one run per player." : "."}`}
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
            disabled={checking || busy || connectionFailed || offlineUnavailable}
            onClick={onStart}
          >
            {busy || checking ? <span className="button-spinner" /> : <RadioTower size={18} />}
            {busy ? t("prep.connecting") : checking ? t("prep.checking") : t("prep.start")}
          </button>
        </div>

        {contentModeId !== "playable" && offlinePackState ? (
          <section className="offline-pack-status" role="status">
            <WifiOff size={20} aria-hidden="true" />
            <div>
              <strong>
                {offlinePackState === "ready"
                  ? locale === "en"
                    ? "Available offline"
                    : locale === "ja"
                      ? "オフライン利用可"
                      : "可离线使用"
                  : offlinePackState === "downloading" || offlinePackState === "checking"
                    ? locale === "en"
                      ? "Preparing offline pack"
                      : locale === "ja"
                        ? "オフラインパックを準備中"
                        : "正在准备离线包"
                    : locale === "en"
                      ? "Open online once to prepare this mode"
                      : locale === "ja"
                        ? "オンラインで一度開いて準備してください"
                        : "需要联网打开一次以缓存此模式"}
              </strong>
              <span>
                {locale === "en"
                  ? "Offline games stay on this device and are not uploaded."
                  : locale === "ja"
                    ? "オフライン対局は端末内だけに保存され、アップロードされません。"
                    : "离线对局仅保留在本机，不会上传。"}
              </span>
            </div>
            {offlinePackState === "error" && onRetryOfflinePack ? (
              <button
                type="button"
                className="ticket-button-secondary"
                onClick={onRetryOfflinePack}
              >
                {t("common.retry")}
              </button>
            ) : null}
          </section>
        ) : null}

        {connectionFailed && activityId === "practice" && !offlineUnavailable && (
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
          labels={ruleLabels(t, locale)}
          {...(supportsPlayableTutorial(contentModeId) && onReplayTutorial
            ? { onReplayTutorial }
            : {})}
        />
      </section>
    </main>
  );
}

function ActiveGame({
  activityId,
  contentModeId,
  runtime,
  session,
  onReplayTutorial,
}: {
  activityId: "daily" | "practice";
  contentModeId: SoloContentMode;
  runtime: SoloModeRuntime;
  session: ReturnType<typeof useGameSession> & { game: PublicGame };
  onReplayTutorial?: () => void;
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
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  const [dialogActionBusy, setDialogActionBusy] = useState(false);
  const [dialogActionError, setDialogActionError] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [replayCopied, setReplayCopied] = useState(false);
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
  const modeManifest = runtime.manifest;
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
    setChallengeUrl(null);
    setReplayUrl(null);
    setChallengeError(false);
    setSharePreview(null);
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
    setDialogActionError(false);
    setChallengeCopied(false);
    setReplayCopied(false);
    window.requestAnimationFrame(() => shareButtonRef.current?.focus());
  }, []);

  const generateShareImage = async (siteUrl: string) => {
    const { generateShareResultImage, shareImageFileName } = await import("./share-result-image");
    const dateKey = game.dateKey ?? getBeijingDateKey();
    const blob = await generateShareResultImage({
      locale,
      activityId,
      dateKey,
      guesses: game.guesses,
      ...(game.fieldDefinitions ? { fieldDefinitions: game.fieldDefinitions } : {}),
      maxAttempts: game.maxAttempts,
      won: game.status === "won",
      elapsedMs: game.elapsedMs,
      siteUrl,
    });
    return { blob, fileName: shareImageFileName({ dateKey, activityId }) };
  };

  const createShareImage = async () => {
    if (!shareable || shareBusy) return;
    setShareBusy(true);
    setShareError(false);
    try {
      const { blob, fileName } = await generateShareImage(window.location.origin);
      setSharePreview({
        imageUrl: URL.createObjectURL(blob),
        fileName,
      });
    } catch {
      setShareError(true);
    } finally {
      setShareBusy(false);
    }
  };

  const shareFriendChallenge = async () => {
    if (challengeBusy) return;
    setChallengeBusy(true);
    setChallengeError(false);
    setDialogActionError(false);
    try {
      let url = challengeUrl;
      if (!url) {
        const challenge = await apiRequest<FriendChallenge>(`/games/${game.id}/challenges`, {
          method: "POST",
        });
        url = `${window.location.origin}/challenge/${challenge.id}`;
        setChallengeUrl(url);
      }
      const { blob, fileName } = await generateShareImage(url);
      const payload = buildFriendChallengeSharePayload({
        locale,
        won: game.status === "won",
        guessCount: game.guesses.length,
        maxAttempts: game.maxAttempts,
        elapsedMs: game.elapsedMs,
        challengeUrl: url,
      });
      const nativeResult = await tryNativeFriendChallengeShare(payload, blob, fileName);
      if (nativeResult === "fallback") {
        setSharePreview({ imageUrl: URL.createObjectURL(blob), fileName, challengeUrl: url });
      }
    } catch {
      setChallengeError(true);
    } finally {
      setChallengeBusy(false);
    }
  };

  const copyChallengeFromDialog = async () => {
    if (!challengeUrl || dialogActionBusy) return;
    setDialogActionBusy(true);
    setDialogActionError(false);
    try {
      await copyShareText(challengeUrl);
      setChallengeCopied(true);
      window.setTimeout(() => setChallengeCopied(false), 1_800);
    } catch {
      setDialogActionError(true);
    } finally {
      setDialogActionBusy(false);
    }
  };

  const copyReplayFromDialog = async () => {
    if (dialogActionBusy) return;
    setDialogActionBusy(true);
    setDialogActionError(false);
    try {
      let url = replayUrl;
      if (!url) {
        const shared = await apiRequest<ReplayShareResponse>(`/replays/${game.id}/share`, {
          method: "POST",
        });
        url = shared.url;
        setReplayUrl(url);
      }
      await copyShareText(url);
      setReplayCopied(true);
      window.setTimeout(() => setReplayCopied(false), 1_800);
    } catch {
      setDialogActionError(true);
    } finally {
      setDialogActionBusy(false);
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
              : contentModeId === "aeon"
                ? "AEON · IMAGE"
                : contentModeId === "currency-wars"
                  ? "CURRENCY WARS · TRACER"
                  : activityId === "daily"
                    ? t("prep.dailyEyebrow")
                    : t("prep.randomEyebrow")}
          </p>
          <h1 ref={gameHeadingRef} tabIndex={-1}>
            {contentModeId === "npc"
              ? "NPC"
              : contentModeId === "aeon"
                ? locale === "en"
                  ? "Aeon image challenge"
                  : locale === "ja"
                    ? "星神画像チャレンジ"
                    : "星神图片挑战"
                : contentModeId === "currency-wars"
                  ? locale === "zh-CN"
                    ? "货币战争"
                    : locale === "ja"
                      ? "コイン戦争"
                      : "Currency Wars"
                  : activityId === "daily"
                    ? t("game.daily")
                    : t("game.random")}
          </h1>
          <p>
            {contentModeId === "aeon"
              ? locale === "en"
                ? "Identify the Aeon from the gradually revealed image."
                : locale === "ja"
                  ? "少しずつ開示される画像から星神を当てます。"
                  : "只根据逐步揭示的图片猜测星神。"
              : t("prep.activeIntro")}
          </p>
        </div>
        <div className="hero-stamp">
          <span>{activityId === "daily" ? t("game.dailyShort") : t("game.randomShort")}</span>
          <strong>
            {activityId === "daily"
              ? (game.dateKey ?? getBeijingDateKey()).slice(5).replace("-", ".")
              : "∞"}
          </strong>
          <small>{activityId === "daily" ? "UTC+8 · 00:00" : t("game.unlimited")}</small>
        </div>
      </section>

      <section className="game-workspace">
        <aside className="game-left-rail">
          <div className="rail-section">
            <span className="rail-number">01</span>
            <h2>{locale === "zh-CN" ? "猜测次数" : locale === "ja" ? "推測回数" : "ATTEMPTS"}</h2>
            <div className="fixed-attempts">
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
              labels={ruleLabels(t, locale)}
              {...(supportsPlayableTutorial(contentModeId) && onReplayTutorial
                ? { onReplayTutorial }
                : {})}
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
                {activityId === "daily"
                  ? t("home.dailyNumber", { date: game.dateKey })
                  : t("game.random")}
              </span>
              <strong className="service-state">
                <i className={source === "server" ? "online" : "local"} />
                {source === "server" ? t("common.online") : t("prep.offlinePractice")}
              </strong>
            </div>
          </div>

          {activityId === "practice" && game.status === "active" && (
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

          {contentModeId === "aeon" ? (
            <AeonGuessBoard
              gameId={game.id}
              wrongGuesses={game.guesses.filter((guess) => !guess.isCorrect).length}
              answer={
                game.answer && "imagePath" in game.answer.assets
                  ? (game.answer as AeonSummary)
                  : null
              }
              imagePath={game.aeonImagePath}
              imageFocus={game.aeonImageFocus}
              locale={locale}
              finished={finished}
            />
          ) : null}

          {!finished && (
            <CharacterCombobox
              characters={roster}
              locale={locale}
              {...(contentModeId === "playable"
                ? { searchIndex: runtime.manifest.searchIndex }
                : {})}
              {...(contentModeId === "aeon"
                ? { entityLabel: locale === "en" ? "Aeon" : "星神" }
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
                  {shareable && contentModeId === "playable" && source === "server" && (
                    <button
                      ref={shareButtonRef}
                      className="ticket-button"
                      type="button"
                      disabled={challengeBusy}
                      onClick={() => void shareFriendChallenge()}
                    >
                      {challengeBusy ? (
                        <span className="button-spinner" aria-hidden="true" />
                      ) : (
                        <Share2 size={17} />
                      )}{" "}
                      {challengeBusy ? t("game.sharingChallenge") : t("game.shareChallenge")}
                    </button>
                  )}
                  {activityId === "daily" ? (
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
                  {activityId === "practice" && (
                    <Link className="ticket-button-secondary" to="/">
                      <ArrowLeft size={17} /> {t("hub.backToHub")}
                    </Link>
                  )}
                  {shareable && !(contentModeId === "playable" && source === "server") && (
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
                </div>
                {shareError && (
                  <p className="share-image-error" role="alert">
                    {t("game.shareImageError")}
                  </p>
                )}
                {challengeError && (
                  <p className="share-image-error" role="alert">
                    {t("game.challengeShareError")}
                  </p>
                )}
              </section>
            </>
          )}

          {contentModeId !== "aeon" ? (
            <>
              {game.inferenceReview ? (
                <InferenceReview review={game.inferenceReview} locale={locale} />
              ) : null}
              <GuessBoard
                guesses={game.guesses}
                locale={locale}
                fields={game.fieldDefinitions}
                animateLatest={contentModeId === "playable"}
              />
            </>
          ) : null}
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
            <strong>{activityId === "daily" ? "00:00" : "∞"}</strong>
            <small>{activityId === "daily" ? "UTC+8" : t("game.unlimited")}</small>
          </div>
          {activityId === "practice" && source === "server" ? (
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
          challengeCopied={challengeCopied}
          replayCopied={replayCopied}
          actionBusy={dialogActionBusy}
          actionError={dialogActionError}
          {...(sharePreview.challengeUrl
            ? {
                challengeUrl: sharePreview.challengeUrl,
                onCopyChallenge: copyChallengeFromDialog,
                onCopyReplay: copyReplayFromDialog,
              }
            : {})}
          onClose={closeSharePreview}
        />
      ) : null}
    </main>
  );
}

export function ModeGamePage({
  activityId,
  runtime,
}: {
  activityId: "daily" | "practice";
  runtime: SoloModeRuntime;
}) {
  const contentModeId = runtime.contentModeId;
  const [searchParams, setSearchParams] = useSearchParams();
  const locale = usePreferences((state) => state.language);
  const queryClient = useQueryClient();
  const [guestTutorialCompleted, setGuestTutorialCompleted] = useState(() => {
    try {
      return hasCompletedGuestPlayableTutorial(window.localStorage);
    } catch {
      return false;
    }
  });
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [tutorialReplayOpen, setTutorialReplayOpen] = useState(false);
  const [tutorialBusy, setTutorialBusy] = useState(false);
  const [tutorialError, setTutorialError] = useState(false);
  const requestedGameId = searchParams.get("game");
  const specialModeId = contentModeId === "playable" ? null : contentModeId;
  const offlinePack = useSpecialModePack(specialModeId, specialModeId !== null);
  const accountSession = useSession(offlinePack.online);
  const serverRequestedGameId = offlinePack.online ? requestedGameId : null;
  const currentGames = useCurrentGames(offlinePack.online);
  const requestedGame = useQuery({
    queryKey: ["games", "detail", serverRequestedGameId],
    queryFn: async () => {
      await ensureSession();
      const game = await apiRequest<PublicGame>(`/games/${serverRequestedGameId}`);
      if (game.activityId !== activityId || game.modeId !== contentModeId) {
        throw new Error("GAME_MODE_MISMATCH");
      }
      return game;
    },
    enabled: Boolean(serverRequestedGameId),
    retry: false,
  });
  const initialGame = serverRequestedGameId
    ? requestedGame.data
    : contentModeId === "playable"
      ? currentGames.data?.[activityId]
      : null;
  const session = useGameSession(activityId, initialGame, runtime);
  const navigationGameId = session.navigationGameId;
  const navigationGame =
    navigationGameId && session.game?.id === navigationGameId ? session.game : null;
  const game =
    navigationGame ??
    (serverRequestedGameId
      ? session.game?.id === serverRequestedGameId
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

  const offlinePackBusy =
    specialModeId !== null &&
    (offlinePack.state === "checking" || offlinePack.state === "downloading");
  const offlineUnavailable =
    specialModeId !== null &&
    offlinePack.state !== "ready" &&
    (!offlinePack.online || offlinePack.state === "error");
  const checking = serverRequestedGameId
    ? requestedGame.isPending
    : specialModeId
      ? offlinePackBusy
      : offlinePack.online && currentGames.isPending;
  const lookupFailed = serverRequestedGameId
    ? requestedGame.isError
    : specialModeId
      ? offlinePack.online && offlinePack.state === "error"
      : offlinePack.online && currentGames.isError;
  const connectionFailed = lookupFailed || Boolean(session.errorCode);
  const tutorialUser = accountSession.data?.user;
  const tutorialAutoOpen =
    accountSession.isSuccess &&
    !tutorialDismissed &&
    Boolean(
      tutorialUser &&
      (tutorialUser.isGuest ? !guestTutorialCompleted : !tutorialUser.playableTutorialCompleted),
    );
  const tutorialOpen =
    supportsPlayableTutorial(contentModeId) && (tutorialReplayOpen || tutorialAutoOpen);
  const replayTutorial = useCallback(() => {
    setTutorialError(false);
    setTutorialReplayOpen(true);
  }, []);
  const finishTutorial = useCallback(async () => {
    const user = accountSession.data?.user;
    if (!user || tutorialBusy) return;
    setTutorialBusy(true);
    setTutorialError(false);
    try {
      if (user.isGuest) {
        markGuestPlayableTutorialCompleted(window.localStorage);
        setGuestTutorialCompleted(true);
      } else {
        const updatedUser = await apiRequest<PublicUser>("/account/playable-tutorial", {
          method: "PATCH",
        });
        queryClient.setQueryData<SessionPayload>(["session"], (current) =>
          current ? { ...current, user: updatedUser } : current,
        );
      }
      setTutorialDismissed(true);
      setTutorialReplayOpen(false);
    } catch {
      setTutorialError(true);
    } finally {
      setTutorialBusy(false);
    }
  }, [accountSession.data?.user, queryClient, tutorialBusy]);
  const retry = () => {
    session.clearError();
    if (session.errorCode) {
      void session.start();
    } else if (serverRequestedGameId) {
      void requestedGame.refetch();
    } else {
      void currentGames.refetch();
    }
  };

  const page = !game ? (
    <GamePreparation
      activityId={activityId}
      contentModeId={contentModeId}
      runtime={runtime}
      checking={checking}
      busy={session.busy}
      connectionFailed={connectionFailed}
      offlineUnavailable={offlineUnavailable}
      {...(specialModeId
        ? {
            offlinePackState: offlinePack.state,
            onRetryOfflinePack: () => void offlinePack.retry(),
          }
        : {})}
      onStart={() => (offlinePack.online ? void session.start() : session.startOffline())}
      onRetry={retry}
      onOffline={() => session.startOffline()}
      onReplayTutorial={replayTutorial}
    />
  ) : (
    <ActiveGame
      activityId={activityId}
      contentModeId={contentModeId}
      runtime={runtime}
      session={{ ...session, game }}
      onReplayTutorial={replayTutorial}
    />
  );

  return (
    <>
      {page}
      {tutorialOpen ? (
        <PlayableTutorial
          locale={locale}
          busy={tutorialBusy}
          error={tutorialError}
          onComplete={() => void finishTutorial()}
          onSkip={() => void finishTutorial()}
        />
      ) : null}
    </>
  );
}
