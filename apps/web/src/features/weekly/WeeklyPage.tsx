import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CalendarClock, Flag, LoaderCircle, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type {
  ContentModeId,
  Locale,
  WeeklyLeaderboardEntry,
  WeeklyRun,
} from "@fireflydle/contracts";
import {
  aeonEntities,
  characters,
  contentManifest,
  currencyWarsRuleset,
  currencyWarsUnitSummaries,
  npcEntities,
  npcSummary,
} from "@fireflydle/game-data";
import { getBeijingWeekKey, getWeeklyModeId } from "@fireflydle/game-engine";
import { apiRequest, ApiClientError } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import { AeonGuessBoard } from "../game/AeonGuessBoard";
import { CharacterCombobox } from "../game/CharacterCombobox";
import { GuessBoard } from "../game/GuessBoard";
import "../game/game.css";
import "./weekly.css";

const modeLabels: Record<ContentModeId, Record<Locale, string>> = {
  playable: { "zh-CN": "普通角色", en: "Characters", ja: "キャラクター" },
  npc: { "zh-CN": "NPC", en: "NPCs", ja: "NPC" },
  "currency-wars": { "zh-CN": "货币战争", en: "Currency Wars", ja: "コイン戦争" },
  aeon: { "zh-CN": "星神", en: "Aeons", ja: "星神" },
  portrait: { "zh-CN": "立绘", en: "Portraits", ja: "立ち絵" },
};

export function weeklyModePath(modeId: ContentModeId): string {
  return `/${modeId}/weekly`;
}

/**
 * 周赛页的可见文案。放在页内字典而不是 i18n 资源里，是为了跟 EndlessPage 的既有做法保持一致：
 * 这些文案只服务于这一个页面的排版，且大多带插值，集中在一处更好对照三种语言。
 */
const copy = {
  "zh-CN": {
    unavailableTitle: (mode: string) => `本周轮到${mode}`,
    unavailableBody: "周赛入口只在当周内容模式开放。",
    unavailableCta: "前往本周周赛",
    title: (mode: string) => `${mode}周赛`,
    weekly: "周赛",
    snapshot: (manifest: string, rules: string) => `题库 ${manifest} · 规则 ${rules}`,
    questionLabel: (n: number) => `第 ${n} / 5 题`,
    headerIntro: "五题使用同一份题库与规则快照，成绩进入统一周榜。",
    startTitle: (mode: string) => `5 题 · ${mode}`,
    startBody: "失败题会继续下一题；排名依次比较答对数、猜测数和累计耗时。",
    startCta: "开始本周挑战",
    scoreAria: "周赛进度",
    scoreQuestions: "题目",
    scoreCorrect: "答对",
    scoreFailed: "失败",
    scoreGuesses: "猜测",
    scoreTime: "累计耗时",
    completeTitle: "本周挑战完成",
    completeBody: (correct: number, guesses: number, time: string) =>
      `${correct}/5 答对 · ${guesses} 次猜测 · ${time}`,
    completeCta: "查看统一排名",
    roundCompleteTitle: (completed: number) => `第 ${completed} 题已记录`,
    roundNext: (next: number) => `正在进入第 ${next} 题`,
    roundLock: "锁定答案",
    roundForfeit: "结束本题",
    errorPrefix: "周赛请求失败",
    boardTitle: "本周统一排名",
    thRank: "排名",
    thPlayer: "玩家",
    thCorrect: "答对",
    thGuesses: "猜测",
    thTime: "耗时",
    boardLoading: "正在同步排名…",
    boardEmpty: "本周还没有正式完赛成绩。",
    back: "返回模式站",
    aeonEntity: "星神",
  },
  en: {
    unavailableTitle: (mode: string) => `This week is ${mode}`,
    unavailableBody: "The weekly run only opens for the mode of the current week.",
    unavailableCta: "Go to this week's run",
    title: (mode: string) => `${mode} Weekly`,
    weekly: "Weekly",
    snapshot: (manifest: string, rules: string) => `Pool ${manifest} · Rules ${rules}`,
    questionLabel: (n: number) => `Question ${n} of 5`,
    headerIntro: "All five questions share one snapshot; scores feed a single weekly board.",
    startTitle: (mode: string) => `5 questions · ${mode}`,
    startBody: "A failed question moves on; ranking compares solved, guesses, then total time.",
    startCta: "Start this week's run",
    scoreAria: "Weekly progress",
    scoreQuestions: "Questions",
    scoreCorrect: "Solved",
    scoreFailed: "Failed",
    scoreGuesses: "Guesses",
    scoreTime: "Total time",
    completeTitle: "This week's run is complete",
    completeBody: (correct: number, guesses: number, time: string) =>
      `${correct}/5 solved · ${guesses} guesses · ${time}`,
    completeCta: "View the unified board",
    roundCompleteTitle: (completed: number) => `Question ${completed} recorded`,
    roundNext: (next: number) => `Loading question ${next}`,
    roundLock: "Lock in the answer",
    roundForfeit: "End this question",
    errorPrefix: "Weekly request failed",
    boardTitle: "Unified weekly ranking",
    thRank: "Rank",
    thPlayer: "Player",
    thCorrect: "Solved",
    thGuesses: "Guesses",
    thTime: "Time",
    boardLoading: "Syncing the ranking…",
    boardEmpty: "No official result this week yet.",
    back: "Back to the mode station",
    aeonEntity: "Aeon",
  },
  ja: {
    unavailableTitle: (mode: string) => `今週は${mode}`,
    unavailableBody: "週間ランは今週のモードでのみ開催されます。",
    unavailableCta: "今週の週間ランへ",
    title: (mode: string) => `${mode}週間ラン`,
    weekly: "週間ラン",
    snapshot: (manifest: string, rules: string) => `データ ${manifest} · ルール ${rules}`,
    questionLabel: (n: number) => `第 ${n} / 5 問`,
    headerIntro: "5 問は同じスナップショットを共有し、成績は単一の週間ランキングに入ります。",
    startTitle: (mode: string) => `5 問 · ${mode}`,
    startBody: "失敗した問題は次へ進みます。順位は正解数、推測数、合計時間の順に比較します。",
    startCta: "今週の挑戦を開始",
    scoreAria: "週間ランの進捗",
    scoreQuestions: "問題",
    scoreCorrect: "正解",
    scoreFailed: "失敗",
    scoreGuesses: "推測",
    scoreTime: "合計時間",
    completeTitle: "今週の挑戦は完了",
    completeBody: (correct: number, guesses: number, time: string) =>
      `${correct}/5 正解 · ${guesses} 回推測 · ${time}`,
    completeCta: "統合ランキングを見る",
    roundCompleteTitle: (completed: number) => `第 ${completed} 問を記録しました`,
    roundNext: (next: number) => `第 ${next} 問へ移動中`,
    roundLock: "答えを確定",
    roundForfeit: "この問題を終了",
    errorPrefix: "週間リクエストに失敗しました",
    boardTitle: "今週の統合ランキング",
    thRank: "順位",
    thPlayer: "プレイヤー",
    thCorrect: "正解",
    thGuesses: "推測",
    thTime: "時間",
    boardLoading: "ランキングを同期中…",
    boardEmpty: "今週はまだ正式な完走記録がありません。",
    back: "モード站に戻る",
    aeonEntity: "星神",
  },
} as const;

export function weeklyModeLabel(modeId: ContentModeId, locale: Locale): string {
  return modeLabels[modeId][locale];
}

export interface WeeklyRoundTransition {
  completedQuestion: number;
  nextQuestion: number;
}

export function getWeeklyRoundTransition(
  previous: WeeklyRun | null | undefined,
  next: WeeklyRun,
): WeeklyRoundTransition | null {
  if (
    previous?.status !== "active" ||
    next.status !== "active" ||
    !previous.currentGame ||
    !next.currentGame ||
    previous.currentGame.id === next.currentGame.id
  ) {
    return null;
  }
  return {
    completedQuestion: previous.games.length,
    nextQuestion: next.games.length,
  };
}

function formatTime(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function rosterFor(modeId: ContentModeId) {
  if (modeId === "npc") return npcEntities.map(npcSummary);
  if (modeId === "currency-wars") return currencyWarsUnitSummaries;
  if (modeId === "aeon") return aeonEntities;
  return characters;
}

export default function WeeklyPage({ routeModeId }: { routeModeId: ContentModeId }) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const text = copy[locale];
  const session = useSession();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [roundTransition, setRoundTransition] = useState<WeeklyRoundTransition | null>(null);
  const roundHeadingRef = useRef<HTMLHeadingElement>(null);
  const currentModeId = getWeeklyModeId(now);
  const weekKey = getBeijingWeekKey(now);
  const current = useQuery({
    queryKey: ["weekly", "current"],
    queryFn: () => apiRequest<WeeklyRun | null>("/weekly/runs/current"),
    enabled: session.isSuccess && routeModeId === currentModeId,
    retry: false,
  });
  const leaderboard = useQuery({
    queryKey: ["leaderboard", "weekly", weekKey],
    queryFn: () =>
      apiRequest<WeeklyLeaderboardEntry[]>(
        `/leaderboards/weekly?week=${encodeURIComponent(weekKey)}`,
      ),
    enabled: routeModeId === currentModeId,
    retry: false,
  });
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!roundTransition) return;
    const timer = window.setTimeout(() => setRoundTransition(null), 900);
    return () => window.clearTimeout(timer);
  }, [roundTransition]);

  useEffect(() => {
    if (!roundTransition) roundHeadingRef.current?.focus();
  }, [roundTransition]);

  const applyRun = (run: WeeklyRun) => {
    const previous = queryClient.getQueryData<WeeklyRun>(["weekly", "current"]);
    setRoundTransition(getWeeklyRoundTransition(previous, run));
    queryClient.setQueryData(["weekly", "current"], run);
    if (run.status === "completed") {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard", "weekly", run.weekKey] });
    }
  };
  const start = useMutation({
    mutationFn: () =>
      apiRequest<WeeklyRun>("/weekly/runs", {
        method: "POST",
        body: JSON.stringify({ practice: false }),
      }),
    onSuccess: applyRun,
  });
  const guess = useMutation({
    mutationFn: (characterId: string) => {
      if (!current.data) throw new Error("周赛尚未开始");
      return apiRequest<WeeklyRun>(`/weekly/runs/${current.data.id}/guesses`, {
        method: "POST",
        body: JSON.stringify({ characterId }),
      });
    },
    onSuccess: applyRun,
  });
  const forfeit = useMutation({
    mutationFn: () => {
      if (!current.data) throw new Error("周赛尚未开始");
      return apiRequest<WeeklyRun>(`/weekly/runs/${current.data.id}/forfeit`, {
        method: "POST",
      });
    },
    onSuccess: applyRun,
  });

  const modeLabel = weeklyModeLabel(routeModeId, locale);
  const crumb = (
    <nav className="sr-crumb" aria-label={t("hub.backToHub")}>
      <Link className="game-hub-link" to="/">
        {t("nav.hub")}
      </Link>
      <span aria-hidden="true">/</span>
      <span>
        {modeLabel} · {text.weekly}
      </span>
    </nav>
  );

  if (routeModeId !== currentModeId) {
    const currentLabel = weeklyModeLabel(currentModeId, locale);
    return (
      <main className="sr-game weekly-page is-finished">
        <header className="sr-game-head">
          <div className="sr-game-title">
            {crumb}
            <h1>{text.title(modeLabel)}</h1>
            <p className="sr-game-intro">{text.headerIntro}</p>
          </div>
        </header>
        <section className="sr-board-wrap weekly-state weekly-unavailable">
          <span className="weekly-state-icon" aria-hidden="true">
            <CalendarClock size={22} />
          </span>
          <h2>{text.unavailableTitle(currentLabel)}</h2>
          <p>{text.unavailableBody}</p>
          <Link className="ticket-button" to={weeklyModePath(currentModeId)}>
            {text.unavailableCta} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  const run = current.data;
  const game = run?.currentGame ?? null;
  const roster = rosterFor(routeModeId);
  const guessedIds = new Set(game?.guesses.map((entry) => entry.character.id) ?? []);
  const busy = start.isPending || guess.isPending || forfeit.isPending || roundTransition !== null;
  const error = start.error ?? guess.error ?? forfeit.error ?? current.error;
  const errorCode = error instanceof ApiClientError ? error.code : error ? "INTERNAL_ERROR" : null;
  const elapsed = run
    ? run.elapsedMs + (run.status === "active" ? Math.max(0, now - current.dataUpdatedAt) : 0)
    : 0;
  const questionNumber = run ? Math.min(run.games.length + (game ? 0 : 1), 5) : 0;
  const pipState = (index: number) => {
    const entry = run?.games[index];
    if (!entry) return "";
    if (entry.status === "won") return "is-won";
    if (entry.status === "active") return "is-current";
    return "is-lost";
  };

  return (
    <main className={`sr-game weekly-page${game && !roundTransition ? "" : " is-finished"}`}>
      <header className="sr-game-head">
        <div className="sr-game-title">
          {crumb}
          <h1>{text.title(modeLabel)}</h1>
          <p className="sr-game-intro">{text.headerIntro}</p>
          {run ? (
            <small className="weekly-snapshot">
              {text.snapshot(run.manifestVersion, run.rulesVersion)}
            </small>
          ) : null}
        </div>
        {run ? (
          <div className="sr-game-meta">
            <ol className="weekly-pips" aria-label={text.scoreAria}>
              {Array.from({ length: 5 }, (_, index) => (
                <li key={index} className={pipState(index)}>
                  <span className="sr-only">
                    {text.questionLabel(index + 1)}: {pipState(index) || "—"}
                  </span>
                </li>
              ))}
            </ol>
            <span className="weekly-question">
              <b>{String(questionNumber).padStart(2, "0")}</b>
              <small>/ 05</small>
            </span>
            <strong className="sr-timer mono" aria-label={text.scoreTime}>
              {formatTime(elapsed)}
            </strong>
          </div>
        ) : null}
      </header>

      {!run ? (
        <section className="sr-board-wrap weekly-state weekly-start" aria-live="polite">
          <span className="weekly-state-icon" aria-hidden="true">
            <Trophy size={22} />
          </span>
          <h2>{text.startTitle(modeLabel)}</h2>
          <p>{text.startBody}</p>
          <button
            className="ticket-button"
            type="button"
            disabled={busy || current.isPending || session.isPending}
            onClick={() => start.mutate()}
          >
            {busy || current.isPending ? (
              <LoaderCircle className="weekly-spinner" size={17} aria-hidden="true" />
            ) : null}
            {text.startCta}
          </button>
        </section>
      ) : (
        <>
          <dl className="weekly-stats" aria-label={text.scoreAria}>
            <div>
              <dt>{text.scoreCorrect}</dt>
              <dd>{run.correctCount}</dd>
            </div>
            <div>
              <dt>{text.scoreFailed}</dt>
              <dd>{run.failedCount}</dd>
            </div>
            <div>
              <dt>{text.scoreGuesses}</dt>
              <dd>{run.totalGuesses + (game?.guesses.length ?? 0)}</dd>
            </div>
          </dl>

          {run.status === "completed" ? (
            <section className="sr-board-wrap weekly-state weekly-complete" role="status">
              <span className="weekly-state-icon is-lit" aria-hidden="true">
                <Trophy size={22} />
              </span>
              <h2>{text.completeTitle}</h2>
              <p className="mono">
                {text.completeBody(run.correctCount, run.totalGuesses, formatTime(run.elapsedMs))}
              </p>
              <a className="ticket-button" href="#weekly-leaderboard">
                {text.completeCta}
              </a>
            </section>
          ) : roundTransition ? (
            <section
              className="sr-board-wrap weekly-state weekly-round-transition"
              role="status"
              aria-live="assertive"
            >
              <span className="weekly-state-icon" aria-hidden="true">
                <LoaderCircle className="weekly-spinner" size={22} />
              </span>
              <h2>{text.roundCompleteTitle(roundTransition.completedQuestion)}</h2>
              <p>{text.roundNext(roundTransition.nextQuestion)}</p>
            </section>
          ) : game ? (
            <section className="sr-board-wrap weekly-game" aria-labelledby="weekly-round-title">
              <div className="weekly-round-heading">
                <div>
                  <span>{text.questionLabel(run.games.length)}</span>
                  <h2 id="weekly-round-title" ref={roundHeadingRef} tabIndex={-1}>
                    {text.roundLock}
                  </h2>
                </div>
                <button
                  className="weekly-pill"
                  type="button"
                  disabled={busy}
                  onClick={() => forfeit.mutate()}
                >
                  <Flag size={15} aria-hidden="true" /> {text.roundForfeit}
                </button>
              </div>
              {routeModeId === "aeon" ? (
                <AeonGuessBoard
                  gameId={game.id}
                  wrongGuesses={game.guesses.filter((entry) => !entry.isCorrect).length}
                  imagePath={game.aeonImagePath}
                  imageFocus={game.aeonImageFocus}
                  locale={locale}
                  finished={false}
                  answer={null}
                />
              ) : null}
              {routeModeId !== "aeon" && game.guesses.length > 0 ? (
                <GuessBoard
                  guesses={game.guesses}
                  locale={locale}
                  fields={game.fieldDefinitions}
                  synergyDefinitions={
                    routeModeId === "currency-wars"
                      ? currencyWarsRuleset.synergyDefinitions
                      : undefined
                  }
                />
              ) : null}
              <div className="sr-composer sr-active-row">
                <CharacterCombobox
                  variant="row"
                  characters={roster}
                  locale={locale}
                  {...(routeModeId === "playable"
                    ? { searchIndex: contentManifest.searchIndex }
                    : {})}
                  {...(routeModeId === "aeon"
                    ? { entityLabel: text.aeonEntity, showImages: false }
                    : {})}
                  excludedIds={guessedIds}
                  disabled={busy}
                  onSubmit={(id) => guess.mutate(id)}
                />
              </div>
            </section>
          ) : null}
        </>
      )}

      {errorCode ? (
        <p className="weekly-error" role="alert">
          {text.errorPrefix}: <span className="mono">{errorCode}</span>
        </p>
      ) : null}
      <section
        className="weekly-leaderboard"
        id="weekly-leaderboard"
        aria-labelledby="weekly-board-title"
      >
        <div className="weekly-leaderboard-heading">
          <h2 id="weekly-board-title">
            <Trophy size={17} aria-hidden="true" /> {text.boardTitle}
          </h2>
          <span className="mono">{weekKey}</span>
        </div>
        {leaderboard.data?.length ? (
          <div className="weekly-leaderboard-scroll">
            <table>
              <thead>
                <tr>
                  <th>{text.thRank}</th>
                  <th>{text.thPlayer}</th>
                  <th>{text.thCorrect}</th>
                  <th>{text.thGuesses}</th>
                  <th>{text.thTime}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.data.map((entry) => (
                  <tr
                    key={`${entry.rank}-${entry.displayName}`}
                    className={entry.rank <= 3 ? "is-top" : undefined}
                  >
                    <td>{String(entry.rank).padStart(2, "0")}</td>
                    <th scope="row">{entry.displayName}</th>
                    <td>{entry.correctCount}/5</td>
                    <td>{entry.totalGuesses}</td>
                    <td>{formatTime(entry.elapsedMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="weekly-leaderboard-empty">
            {leaderboard.isPending ? text.boardLoading : text.boardEmpty}
          </p>
        )}
      </section>
      <Link className="weekly-pill weekly-back" to="/playable">
        <ArrowLeft size={15} aria-hidden="true" /> {text.back}
      </Link>
    </main>
  );
}
