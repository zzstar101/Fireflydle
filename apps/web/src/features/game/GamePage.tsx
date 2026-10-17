import { Fragment, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ImageDown, Info, RotateCcw, Share2, WifiOff, X } from "lucide-react";
import type {
  AeonSummary,
  Character,
  FriendChallenge,
  PersonalStats,
  PlayableGameEntitySummary,
  PublicGame,
  PublicUser,
  ReplayShareResponse,
  SessionPayload,
} from "@fireflydle/contracts";
import {
  compareCharactersWithRules,
  getBeijingDateKey,
  snapshotRulesFromFieldDefinitions,
} from "@fireflydle/game-engine";
import { apiRequest, ensureSession } from "../../api/client";
import { useSession } from "../account/useSession";
import { usePreferences } from "../../state/preferences";
import { useCharacterPortrait, useCharacterSprite } from "../../lib/character-art";
import { fx } from "../../fx/fx";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import { InferenceReplay } from "./InferenceReplay";
import { ResultReveal } from "./ResultReveal";
import { buildInferenceReplayFrames } from "./inference-replay-model";
import { hasSeenResultReveal } from "./reveal-memory";
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
import { createDraftGame, useGameSession } from "./useGameSession";
import type { SoloContentMode, SoloModeRuntime } from "./mode-runtime";
import { markInstallEligible } from "../../pwa";
import { dailyIssueNumber } from "../hub/daily-issue";
import { useSpecialModePack } from "../../offline/use-special-mode-pack";
import "./game.css";
import "./result-screen.css";

interface DraftState {
  online: boolean;
  disabled: boolean;
  /** connection：联网开局失败；offline-pack：特殊模式还没缓存离线包。 */
  failed: "connection" | "offline-pack" | null;
  allowOffline: boolean;
  onRetry: () => void;
  onOffline: () => void;
}

interface SharePreview {
  imageUrl: string;
  fileName: string;
  challengeUrl?: string;
}

/** 原型标题里的日期：「10月11日」/「Oct 11」。dateKey 是北京时间日期。 */
function formatDateKey(dateKey: string, locale: "zh-CN" | "en" | "ja"): string {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat(locale, {
    month: locale === "en" ? "short" : "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(date);
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

function ActiveGame({
  activityId,
  contentModeId,
  runtime,
  session,
  onReplayTutorial,
  draft,
}: {
  activityId: "daily" | "practice";
  contentModeId: SoloContentMode;
  runtime: SoloModeRuntime;
  session: ReturnType<typeof useGameSession> & { game: PublicGame };
  onReplayTutorial?: () => void;
  /** 尚未开局：棋盘照常渲染，第一次提交才开局。 */
  draft?: DraftState | undefined;
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
  /**
   * 结算入场分两段：先播推理回放，立绘点云也聚拢完成，两者都好了才让
   * `.art-cap` 与 `.panel` 进场（原型里也是回放结束后才 `#artImg` → `#artCap` → `#panel`）。
   * 已看过这一局揭晓的（revealActive=false）直接呈现终态。
   */
  const [portraitDone, setPortraitDone] = useState(true);
  const [replayDone, setReplayDone] = useState(true);
  const revealDone = portraitDone && replayDone;
  /** 「回放」按钮：自增即重挂载 InferenceReplay，重新播一遍。 */
  const [replayCycle, setReplayCycle] = useState(0);
  /** 首次入场沿用「同一局第二次打开跳终态」的语义；点「回放」后强制重播一遍。 */
  const [replayActive, setReplayActive] = useState(true);
  /** 原型 closeResult()：关掉整层结算遮罩，让底下的对局视图回来。 */
  const [resultClosed, setResultClosed] = useState(false);
  const gameHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const abandonButtonRef = useRef<HTMLButtonElement>(null);
  const confirmAbandonButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const observedGuessCountRef = useRef(session.game.guesses.length);
  const {
    game,
    roster,
    source,
    busy,
    errorCode,
    submitGuess,
    startWithGuess,
    restart,
    abandonAndRestart,
  } = session;
  const isDraft = Boolean(draft);
  const previousGameIdRef = useRef(game.id);
  const guessCount = game.guesses.length;
  const modeManifest = runtime.manifest;
  const modeDefinition = modeManifest.modes.find((entry) => entry.id === contentModeId);
  const ruleFields = game.fieldDefinitions ?? modeDefinition?.fields ?? [];
  const rulePoolSize =
    modeManifest.pools.find((pool) => pool.id === modeDefinition?.candidatePoolId)?.candidateIds
      .length ?? 0;

  useEffect(() => {
    setConfirmAbandon(false);
    setChallengeUrl(null);
    setReplayUrl(null);
    setChallengeError(false);
    setSharePreview(null);
    // 草稿局 → 真实对局是同一次输入的延续：保留输入焦点，并让第一猜照常播放揭晓动画。
    const fromDraft = previousGameIdRef.current === "draft";
    previousGameIdRef.current = game.id;
    observedGuessCountRef.current = fromDraft ? 0 : game.guesses.length;
    if (!fromDraft && game.id !== "draft") gameHeadingRef.current?.focus({ preventScroll: true });
  }, [game.id]);

  useEffect(() => {
    const previousCount = observedGuessCountRef.current;
    observedGuessCountRef.current = guessCount;
    if (contentModeId !== "playable" || guessCount <= previousCount) return;

    const latestGuess = game.guesses.at(-1);
    triggerGameHaptic(latestGuess?.isCorrect ? "win" : "life-lost");

    // 一致格依次亮起时，把金色星尘洒进背景（错峰与 CSS 的 --cell-delay 对齐）。
    const row = document.querySelector<HTMLElement>(".guess-board .guess-row.is-latest");
    if (!row) return;
    // 原型 animateRow：一致格翻开后 FX.burst(rect, mobile ? 6 : 10)，并把背景按一致数暖化 warm = exact / 6。
    const mobile = window.matchMedia?.("(max-width: 760px)").matches === true;
    const exactCells = Array.from(row.querySelectorAll<HTMLElement>("td.state-exact"));
    const total = row.querySelectorAll("td.feedback-cell").length || 6;
    fx.tween({ warm: exactCells.length / total }, { duration: 0.8, delay: 0.3 });
    const timers = exactCells.map((cell, index) =>
      window.setTimeout(() => fx.burst(cell, mobile ? 6 : 10), 110 + index * 105 + 180),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
    // game.guesses 每次渲染都是新数组，加进依赖会让上面的错峰定时器被反复清掉；
    // 这里只靠 guessCount 变化触发一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentModeId, guessCount]);

  useEffect(() => {
    if (game.status !== "active") resultRef.current?.focus();
    if (game.status === "won" || game.status === "lost") markInstallEligible();
  }, [game.status]);

  useEffect(() => {
    if (confirmAbandon) confirmAbandonButtonRef.current?.focus();
  }, [confirmAbandon]);

  useEffect(() => {
    if (game.status !== "active" || isDraft) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [game.status, isDraft]);

  useEffect(
    () => () => {
      if (sharePreview) URL.revokeObjectURL(sharePreview.imageUrl);
    },
    [sharePreview],
  );

  const elapsedMs = isDraft
    ? 0
    : game.status === "active"
      ? now - new Date(game.startedAt).getTime()
      : game.elapsedMs;
  const remaining = Math.max(0, game.maxAttempts - game.guesses.length);
  const guessedIds = useMemo(
    () => new Set(game.guesses.map((guess) => guess.character.id)),
    [game.guesses],
  );
  const finished = game.status !== "active";
  const shareable = game.status === "won" || game.status === "lost";
  // 结算立绘：超分后的半身像，索引里没有时回退到头像
  const answerPortrait = useCharacterPortrait(finished ? game.answer?.id : null);
  // 推理回放的 93 个头像走一张构建期合成图；拿不到索引时组件自己回退到逐个头像。
  const replaySprite = useCharacterSprite();

  // 结算演出只在对局刚结束时播一次；同一局再次渲染（计时、分享等）不能中断它，
  // 所以用 ref 记住第一次判定结果，而不是每次渲染重新算。
  const revealKey = game.status === "won" ? game.id : null;
  const revealRef = useRef<{ key: string; active: boolean } | null>(null);
  if (revealKey && revealRef.current?.key !== revealKey) {
    revealRef.current = { key: revealKey, active: !hasSeenResultReveal(revealKey) };
  }
  const revealActive = revealRef.current?.key === revealKey && revealRef.current.active;

  // 推理回放的每步候选集合：Worker 只公开计数，这里用同一套判题器在本地重放。
  const replayFrames = useMemo(() => {
    if (contentModeId !== "playable" || game.guesses.length === 0) return [];
    const rules = snapshotRulesFromFieldDefinitions(game.fieldDefinitions ?? ruleFields);
    if (rules.length === 0) return [];
    const pool = roster.filter(
      (entity): entity is PlayableGameEntitySummary => "releaseOrder" in entity,
    );
    return buildInferenceReplayFrames(pool, game.guesses, (target, guess) =>
      compareCharactersWithRules(target as Character, guess as Character, rules),
    );
  }, [contentModeId, game.guesses, game.fieldDefinitions, ruleFields, roster]);

  const replayCharacters = useMemo(
    () => roster.filter((entity): entity is PlayableGameEntitySummary => "releaseOrder" in entity),
    [roster],
  );
  // ── 结算页（原型 #result）派生值 ─────────────────────────────────────────
  // 答案必定是 playable 实体（只有它带 rarity）；不是时按 5★ 呈现。
  const answerRarity: number = game.answer && "rarity" in game.answer ? game.answer.rarity : 5;
  // 原型的面板首行是「每日 #312 · 用时 00:02」：#N 是当天在一年中的序号。
  const dayOfYear = (() => {
    const key = game.dateKey ?? getBeijingDateKey();
    const [year, month, day] = key.split("-").map(Number);
    if (!year || !month || !day) return "";
    const start = Date.UTC(year, 0, 1);
    const current = Date.UTC(year, month - 1, day);
    return String(Math.round((current - start) / 86_400_000) + 1);
  })();
  const activityLabel = `${activityId === "daily" ? t("game.dailyShort") : t("game.randomShort")} #${dayOfYear}`;
  // 标题按语言拼装（i18n 里没有现成的「第 N 次猜中」模板）。
  const winTitlePrefix = locale === "en" ? "Solved in " : locale === "ja" ? "第 " : "第 ";
  const winTitleSuffix = locale === "en" ? "" : locale === "ja" ? " 回目で正解" : " 次猜中";
  // 推理复盘链：开局候选数 → 每一猜之后的剩余候选（原型 .chain）。
  const inferenceChain = useMemo(() => {
    const first = replayFrames[0];
    const opening = first
      ? first.remainingIds.length + Math.max(0, replayCharacters.length - first.remainingIds.length)
      : replayCharacters.length;
    return [opening, ...replayFrames.map((frame) => frame.remainingIds.length)];
  }, [replayFrames, replayCharacters]);
  // 面板里的连胜 / 胜率取自 /stats/me；没有数据（未登录、离线）时显示破折号。
  // 这是只读查询，不改动任何既有 hook 与请求逻辑。
  const resultStatsQuery = useQuery({
    queryKey: ["stats", "result"],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: finished && game.status === "won" && source === "server",
    retry: false,
    staleTime: 30_000,
  });
  const resultStats = resultStatsQuery.data
    ? {
        currentStreak: resultStatsQuery.data.currentStreak,
        winRate:
          resultStatsQuery.data.dailyPlayed > 0
            ? Math.round((resultStatsQuery.data.dailyWon / resultStatsQuery.data.dailyPlayed) * 100)
            : 0,
      }
    : null;
  const handleRevealDone = useCallback(() => setPortraitDone(true), []);
  const handleReplayDone = useCallback(() => {
    setReplayActive(false);
    setReplayDone(true);
  }, []);
  const handleReplay = useCallback(() => {
    // 手动重播不重播面板入场：revealDone 已经为 true，面板保持可见。
    setReplayActive(true);
    setReplayCycle((cycle) => cycle + 1);
  }, []);
  const handleCloseResult = useCallback(() => {
    setResultClosed(true);
  }, []);

  // 每局只重置一次进场状态：已看过揭晓的（revealActive=false）直接呈现终态。
  // 这一步刻意放在 render 期间而不是 useEffect：effect 要等提交之后才跑，
  // 那样「对局刚结束」的第一帧会沿用上一局留下的终态，回放动画要等下一帧才开始。
  // 键取 finished 之后的 game.id —— 对局还活着时 revealKey 为 null、revealActive 必为 false，
  // 那时若就重置，等真的赢了反而会因为「键没变」而跳过。
  const resultResetKeyRef = useRef<string | null>(null);
  const resultResetKey = finished ? game.id : null;
  if (resultResetKey && resultResetKeyRef.current !== resultResetKey) {
    resultResetKeyRef.current = resultResetKey;
    setPortraitDone(!revealActive);
    setReplayDone(!revealActive);
    setReplayActive(revealActive);
    setReplayCycle(0);
    setResultClosed(false);
  }

  // 原型 playResult 开头 / closeResult：结算页在场时星海切到 result 态（满亮、暖色归零、轨道 .6），
  // 移动端结算页自己滚动，形态跟随它的 scrollTop；关掉后回到对局态的压暗背景。
  const resultVisible =
    finished && Boolean(game.answer) && contentModeId !== "aeon" && !resultClosed;
  useEffect(() => {
    if (!resultVisible) return undefined;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    fx.setMode("result");
    fx.setScroller(mobile ? () => resultRef.current?.scrollTop ?? 0 : null);
    const cancel = fx.tween({ dim: 1, warm: 0, rail: 0.6 }, { duration: 0.8 });
    return () => {
      cancel();
      fx.setMode("game");
      fx.setScroller(null);
      fx.tween({ morph: 0, shapeAlpha: 1, dim: 0.45, rail: 0.25 }, { duration: 1.2 });
    };
  }, [resultVisible]);

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
    <main
      className={`game-page running-game-page sr-game${finished ? " is-finished" : ""}${
        contentModeId === "aeon" ? " is-aeon" : ""
      }`}
    >
      <header className="sr-game-head">
        <div className="sr-game-title">
          <nav className="sr-crumb" aria-label={t("hub.backToHub")}>
            <Link className="game-hub-link" to="/">
              {t("nav.hub")}
            </Link>
            <span aria-hidden="true">/</span>
            <span>
              {contentModeId === "npc"
                ? "NPC"
                : contentModeId === "aeon"
                  ? locale === "en"
                    ? "Aeon"
                    : "星神"
                  : contentModeId === "currency-wars"
                    ? locale === "zh-CN"
                      ? "货币战争"
                      : locale === "ja"
                        ? "コイン戦争"
                        : "Currency Wars"
                    : activityId === "daily"
                      ? t("game.crumbDaily")
                      : t("hub.modePractice")}
            </span>
          </nav>
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
                    ? t("hub.dailyIssue", {
                        number: dailyIssueNumber(game.dateKey ?? getBeijingDateKey()),
                      })
                    : t("hub.modePractice")}
            {activityId === "daily" ? (
              <small>{formatDateKey(game.dateKey ?? getBeijingDateKey(), locale)}</small>
            ) : null}
          </h1>
          {contentModeId === "aeon" ? (
            <p className="sr-game-intro">
              {locale === "en"
                ? "Identify the Aeon from the gradually revealed image."
                : locale === "ja"
                  ? "少しずつ開示される画像から星神を当てます。"
                  : "只根据逐步揭示的图片猜测星神。"}
            </p>
          ) : null}
        </div>
        <div className="sr-game-meta">
          <div
            className="sr-pips"
            role="img"
            aria-label={`${t("game.attempts")} ${remaining} / ${game.maxAttempts}`}
          >
            {Array.from({ length: game.maxAttempts }, (_, index) => (
              <i key={index} className={index < remaining ? "on" : ""} />
            ))}
          </div>
          <strong className="sr-timer mono" aria-label={t("game.elapsed")}>
            {formatTime(elapsedMs)}
          </strong>
          {source === "local" ? (
            <span className="sr-net local" title={t("prep.offlinePractice")}>
              <i />
              {t("prep.offlinePractice")}
            </span>
          ) : null}
          <details className="sr-rules">
            <summary>{t("game.rulesShort")}</summary>
            <div className="sr-rules-pop">
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
          </details>
        </div>
      </header>

      {activityId === "practice" && game.status === "active" && !isDraft && (
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

      {finished && game.answer && contentModeId !== "aeon" && !resultClosed ? (
        <section
          ref={resultRef}
          className={`result-screen result-${game.status}${revealDone ? " is-revealed" : ""}`}
          role="status"
          aria-live="polite"
          tabIndex={-1}
        >
          {/* 原型 .art-slot 的子元素顺序是：.hud → .skip → .cloud → img.art → .art-cap，
              也就是头像云排在立绘之前（云在立绘背后），所以回放要先于立绘渲染。 */}
          <div className="art-slot">
            {replayFrames.length > 0 ? (
              <InferenceReplay
                key={replayCycle}
                characters={replayCharacters}
                steps={replayFrames}
                locale={locale}
                sprite={replaySprite}
                final={!replayActive}
                {...(replayActive ? { onDone: handleReplayDone } : {})}
              />
            ) : null}
            {answerPortrait ? (
              <ResultReveal
                characterId={game.answer.id}
                portraitSrc={answerPortrait}
                rarity={answerRarity}
                active={revealActive}
                start={replayDone || replayFrames.length === 0}
                revealKey={revealKey ?? game.id}
                onReveal={handleRevealDone}
              />
            ) : null}
            <div className="art-cap">
              <span className={`stars r${answerRarity}`} aria-hidden="true">
                {"★".repeat(answerRarity)}
              </span>
              <span className="label">{t("game.answer")}</span>
              <strong>{game.answer.names[locale]}</strong>
            </div>
          </div>
          <aside className="panel">
            <div className="panel-head">
              <span className="label">
                {activityLabel} · {t("game.elapsed")}{" "}
                <span className="num">{formatTime(elapsedMs)}</span>
              </span>
              <h2>
                {game.status === "won" ? (
                  <>
                    {winTitlePrefix}
                    <em>{game.guesses.length}</em>
                    {winTitleSuffix}
                  </>
                ) : (
                  t("game.lostTitle")
                )}
              </h2>
            </div>
            <div className="share" aria-hidden="true">
              {game.guesses.map((guess, row) => (
                <div key={row}>
                  {guess.cells.map((cell, col) => (
                    <i
                      key={col}
                      className={cell.state === "exact" ? "e" : cell.state === "close" ? "c" : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="panel-review">
              <span className="label">{t("game.reviewChain")}</span>
              <div className="chain num">
                {inferenceChain.map((count, index) => (
                  <Fragment key={index}>
                    {index > 0 ? <i aria-hidden="true">→</i> : null}
                    <span>{count}</span>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="stats">
              <div>
                <span className="label">{t("game.streak")}</span>
                <b className="num">{resultStats ? resultStats.currentStreak : "—"}</b>
              </div>
              <div>
                <span className="label">{t("game.winRate")}</span>
                <b className="num">{resultStats ? `${resultStats.winRate}%` : "—"}</b>
              </div>
              <div>
                <span className="label">{t("game.beaten")}</span>
                <b className="num">—</b>
              </div>
            </div>
            <div className="actions">
              {shareable && source === "server" ? (
                <button
                  ref={shareButtonRef}
                  className="btn btn-ink"
                  type="button"
                  disabled={shareBusy}
                  onClick={() => void createShareImage()}
                >
                  {shareBusy ? (
                    <span className="button-spinner" aria-hidden="true" />
                  ) : (
                    <ImageDown size={17} />
                  )}
                  {shareBusy ? t("game.generatingImage") : t("game.shareImage")}
                </button>
              ) : null}
              {shareable ? (
                <button
                  className="btn"
                  type="button"
                  disabled={challengeBusy || source !== "server"}
                  onClick={() => void shareFriendChallenge()}
                >
                  {challengeBusy ? (
                    <span className="button-spinner" aria-hidden="true" />
                  ) : (
                    <Share2 size={17} />
                  )}
                  {challengeBusy ? t("game.sharingChallenge") : t("game.shareChallenge")}
                </button>
              ) : null}
              <button className="btn" type="button" onClick={handleReplay}>
                <RotateCcw size={17} /> {t("game.replay")}
              </button>
              {activityId === "daily" ? (
                <Link className="btn" to="/">
                  <ArrowLeft size={17} /> {t("hub.backToHub")}
                </Link>
              ) : (
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => void restart()}
                >
                  <RotateCcw size={17} /> {t("game.playAgain")}
                </button>
              )}
            </div>
            {shareError ? (
              <p className="share-image-error" role="alert">
                {t("game.shareImageError")}
              </p>
            ) : null}
            {challengeError ? (
              <p className="share-image-error" role="alert">
                {t("game.challengeShareError")}
              </p>
            ) : null}
            <button
              className="icon-btn close-x"
              type="button"
              aria-label={t("common.close")}
              onClick={handleCloseResult}
            >
              <X size={18} />
            </button>
          </aside>
        </section>
      ) : null}

      {draft?.failed ? (
        <section className="sr-draft-alert" role="alert">
          <WifiOff size={20} aria-hidden="true" />
          <div>
            <strong>
              {draft.failed === "offline-pack"
                ? locale === "en"
                  ? "Open online once to prepare this mode"
                  : locale === "ja"
                    ? "オンラインで一度開いて準備してください"
                    : "需要联网打开一次以缓存此模式"
                : t("prep.connectionTitle")}
            </strong>
            <span>
              {draft.failed === "offline-pack"
                ? locale === "en"
                  ? "Offline games stay on this device and are not uploaded."
                  : locale === "ja"
                    ? "オフライン対局は端末内だけに保存され、アップロードされません。"
                    : "离线对局仅保留在本机，不会上传。"
                : t("prep.connectionBody")}
            </span>
          </div>
          <div className="sr-draft-actions">
            <button className="btn sm" type="button" disabled={busy} onClick={draft.onRetry}>
              {t("common.retry")}
            </button>
            {draft.failed === "connection" && draft.allowOffline ? (
              <button className="btn sm" type="button" disabled={busy} onClick={draft.onOffline}>
                {t("prep.offlineAction")}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="sr-board-wrap game-workspace">
        {contentModeId === "aeon" ? (
          <AeonGuessBoard
            gameId={game.aeonRevealSeed ?? game.id}
            wrongGuesses={game.guesses.filter((guess) => !guess.isCorrect).length}
            answer={
              game.answer && "imagePath" in game.answer.assets ? (game.answer as AeonSummary) : null
            }
            imagePath={game.aeonImagePath}
            imageFocus={game.aeonImageFocus}
            locale={locale}
            finished={finished}
          />
        ) : (
          <GuessBoard
            guesses={game.guesses}
            locale={locale}
            fields={game.fieldDefinitions}
            synergyDefinitions={modeManifest.currencyWars?.synergyDefinitions}
            animateLatest={contentModeId === "playable"}
          />
        )}
        {!finished ? (
          <>
            {contentModeId !== "aeon" ? (
              // 移动端输入条固定在底部，棋盘里留一行金色虚框占位（原型 .row.active-ghost）。
              <div className="sr-active-ghost" aria-hidden="true" />
            ) : null}
            <div className="sr-composer sr-active-row">
              <CharacterCombobox
                variant="row"
                characters={roster}
                locale={locale}
                {...(contentModeId === "playable"
                  ? { searchIndex: runtime.manifest.searchIndex }
                  : {})}
                {...(contentModeId === "aeon"
                  ? { entityLabel: locale === "en" ? "Aeon" : "星神", showImages: false }
                  : {})}
                {...(contentModeId === "playable"
                  ? { label: t("game.guessPrompt", { number: game.guesses.length + 1 }) }
                  : {})}
                excludedIds={guessedIds}
                disabled={busy || Boolean(draft?.disabled)}
                onSubmit={(id) => {
                  if (contentModeId === "playable") triggerGameHaptic("submit");
                  if (draft) void startWithGuess(id, draft.online);
                  else void submitGuess(id);
                }}
              />
            </div>
            {contentModeId !== "aeon"
              ? Array.from({ length: Math.max(0, remaining - 1) }, (_, index) => (
                  <div
                    key={index}
                    className="sr-ghost-row"
                    aria-hidden="true"
                    style={{ "--sr-cols": ruleFields.length || 6 } as React.CSSProperties}
                  >
                    {Array.from({ length: (ruleFields.length || 6) + 1 }, (_, cell) => (
                      <span key={cell} />
                    ))}
                  </div>
                ))
              : null}
          </>
        ) : null}
      </section>

      {errorCode && !draft && (
        <div className="inline-error" role="alert">
          <Info size={17} /> {t(`error.${errorCode}`, { defaultValue: t("error.generic") })}
        </div>
      )}

      {contentModeId !== "aeon" && !finished ? (
        <p className="sr-legend" aria-hidden="true">
          <span>
            <i className="exact" />
            {locale === "en" ? "Match" : locale === "ja" ? "一致" : "一致"}
          </span>
          <span>
            <i className="close" />
            {locale === "en"
              ? "Close (same faction group / major version)"
              : locale === "ja"
                ? "近い（同じ陣営グループ / 同じメジャー版）"
                : "接近（同阵营组 / 同大版本）"}
          </span>
          <span>
            <i className="miss" />
            {locale === "en" ? "Miss" : locale === "ja" ? "不一致" : "不符"}
          </span>
          <span>
            ↑ ↓{" "}
            {locale === "en"
              ? "answer is newer / older"
              : locale === "ja"
                ? "正解の版が新しい / 古い"
                : "答案版本更晚 / 更早"}
          </span>
        </p>
      ) : null}
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
  const specialModeId =
    contentModeId === "currency-wars" || contentModeId === "aeon" ? contentModeId : null;
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
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousScrollBehavior;
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

  // 原型没有准备页：进来就是棋盘，第一次提交才真正开局（计时从这一刻开始）。
  // 星神题要先看图才能猜，所以进页即开局。
  const draftGame = useMemo(() => {
    if (game) return null;
    const draft = createDraftGame(activityId, runtime);
    if (contentModeId !== "aeon") return draft;
    const { aeonImagePath: _path, aeonImageFocus: _focus, ...rest } = draft;
    return rest as PublicGame;
  }, [activityId, contentModeId, game, runtime]);
  const draftReady = !checking && !offlineUnavailable && !lookupFailed;
  const autoStartRef = useRef(false);
  useEffect(() => {
    if (contentModeId !== "aeon" || game || !draftReady || autoStartRef.current) return;
    autoStartRef.current = true;
    if (offlinePack.online) void session.start();
    else session.startOffline();
  }, [contentModeId, draftReady, game, offlinePack.online, session]);

  const page = (
    <ActiveGame
      activityId={activityId}
      contentModeId={contentModeId}
      runtime={runtime}
      session={{ ...session, game: game ?? draftGame! }}
      onReplayTutorial={replayTutorial}
      {...(game
        ? {}
        : {
            draft: {
              online: offlinePack.online,
              disabled: !draftReady || contentModeId === "aeon",
              failed: offlineUnavailable ? "offline-pack" : connectionFailed ? "connection" : null,
              allowOffline: activityId === "practice" && !specialModeId,
              onRetry: () => {
                autoStartRef.current = false;
                if (specialModeId && offlinePack.state === "error") void offlinePack.retry();
                else if (session.errorCode) session.clearError();
                else retry();
              },
              onOffline: () => session.startOffline(),
            },
          })}
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
