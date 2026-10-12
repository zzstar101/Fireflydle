import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Flag, LoaderCircle, Trophy } from "lucide-react";
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

  if (routeModeId !== currentModeId) {
    return (
      <main className="weekly-page weekly-unavailable">
        <p className="weekly-kicker">WEEKLY ROTATION</p>
        <h1>{text.unavailableTitle(weeklyModeLabel(currentModeId, locale))}</h1>
        <p>{text.unavailableBody}</p>
        <Link className="ticket-button" to={weeklyModePath(currentModeId)}>
          {text.unavailableCta}
        </Link>
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

  return (
    <main className="weekly-page">
      <header className="weekly-header">
        <div>
          <p className="weekly-kicker">WEEKLY ROTATION · {routeModeId.toUpperCase()}</p>
          <h1>{text.title(weeklyModeLabel(routeModeId, locale))}</h1>
          <p>{text.headerIntro}</p>
          {run ? (
            <small className="weekly-snapshot">
              MANIFEST {run.manifestVersion} · RULES {run.rulesVersion}
            </small>
          ) : null}
        </div>
        <Trophy size={44} aria-hidden="true" />
      </header>

      {!run ? (
        <section className="weekly-start" aria-live="polite">
          <strong>{text.startTitle(weeklyModeLabel(routeModeId, locale))}</strong>
          <p>{text.startBody}</p>
          <button
            className="ticket-button"
            type="button"
            disabled={busy || current.isPending || session.isPending}
            onClick={() => start.mutate()}
          >
            {busy || current.isPending ? (
              <LoaderCircle className="weekly-spinner" size={17} />
            ) : null}
            {text.startCta}
          </button>
        </section>
      ) : (
        <>
          <section className="weekly-score" aria-label={text.scoreAria}>
            <div>
              <span>{text.scoreQuestions}</span>
              <strong>{Math.min(run.games.length + (game ? 0 : 1), 5)} / 5</strong>
            </div>
            <div>
              <span>{text.scoreCorrect}</span>
              <strong>{run.correctCount}</strong>
            </div>
            <div>
              <span>{text.scoreFailed}</span>
              <strong>{run.failedCount}</strong>
            </div>
            <div>
              <span>{text.scoreGuesses}</span>
              <strong>{run.totalGuesses + (game?.guesses.length ?? 0)}</strong>
            </div>
            <div>
              <span>{text.scoreTime}</span>
              <strong>{formatTime(elapsed)}</strong>
            </div>
          </section>

          {run.status === "completed" ? (
            <section className="weekly-complete" role="status">
              <Trophy size={30} aria-hidden="true" />
              <h2>{text.completeTitle}</h2>
              <p>
                {text.completeBody(run.correctCount, run.totalGuesses, formatTime(run.elapsedMs))}
              </p>
              <a className="ticket-button" href="#weekly-leaderboard">
                {text.completeCta}
              </a>
            </section>
          ) : roundTransition ? (
            <section className="weekly-round-transition" role="status" aria-live="assertive">
              <span>QUESTION {roundTransition.completedQuestion} COMPLETE</span>
              <h2>{text.roundCompleteTitle(roundTransition.completedQuestion)}</h2>
              <div aria-hidden="true">
                <ArrowRight size={20} />
                <LoaderCircle className="weekly-spinner" size={22} />
              </div>
              <p>{text.roundNext(roundTransition.nextQuestion)}</p>
            </section>
          ) : game ? (
            <section className="weekly-game" aria-labelledby="weekly-round-title">
              <div className="weekly-round-heading">
                <div>
                  <span>QUESTION {run.games.length} / 5</span>
                  <h2 id="weekly-round-title" ref={roundHeadingRef} tabIndex={-1}>
                    {text.roundLock}
                  </h2>
                </div>
                <button
                  className="weekly-forfeit"
                  type="button"
                  disabled={busy}
                  onClick={() => forfeit.mutate()}
                >
                  <Flag size={16} aria-hidden="true" /> {text.roundForfeit}
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
              <CharacterCombobox
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
              {routeModeId !== "aeon" ? (
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
            </section>
          ) : null}
        </>
      )}

      {errorCode ? (
        <p className="inline-error" role="alert">
          {text.errorPrefix}: {errorCode}
        </p>
      ) : null}
      <section
        className="weekly-leaderboard"
        id="weekly-leaderboard"
        aria-labelledby="weekly-board-title"
      >
        <div className="weekly-leaderboard-heading">
          <div>
            <p className="weekly-kicker">UNIFIED RANKING</p>
            <h2 id="weekly-board-title">{text.boardTitle}</h2>
          </div>
          <span>{weekKey}</span>
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
                  <tr key={`${entry.rank}-${entry.displayName}`}>
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
      <Link className="weekly-back" to="/playable">
        <ArrowLeft size={16} /> {text.back}
      </Link>
    </main>
  );
}
