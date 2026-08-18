import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flag, LoaderCircle, Trophy } from "lucide-react";
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
};

export function weeklyModePath(modeId: ContentModeId): string {
  return `/${modeId}/weekly`;
}

export function weeklyModeLabel(modeId: ContentModeId, locale: Locale): string {
  return modeLabels[modeId][locale];
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
  const session = useSession();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
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

  const applyRun = (run: WeeklyRun) => {
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
        <p className="eyebrow">WEEKLY ROTATION</p>
        <h1>本周轮到{weeklyModeLabel(currentModeId, locale)}</h1>
        <p>周赛入口只在当周内容模式开放。</p>
        <Link className="ticket-button" to={weeklyModePath(currentModeId)}>
          前往本周周赛
        </Link>
      </main>
    );
  }

  const run = current.data;
  const game = run?.currentGame ?? null;
  const roster = rosterFor(routeModeId);
  const guessedIds = new Set(game?.guesses.map((entry) => entry.character.id) ?? []);
  const busy = start.isPending || guess.isPending || forfeit.isPending;
  const error = start.error ?? guess.error ?? forfeit.error ?? current.error;
  const errorCode = error instanceof ApiClientError ? error.code : error ? "INTERNAL_ERROR" : null;
  const elapsed = run
    ? run.elapsedMs + (run.status === "active" ? Math.max(0, now - current.dataUpdatedAt) : 0)
    : 0;

  return (
    <main className="weekly-page">
      <header className="weekly-header">
        <div>
          <p className="eyebrow">WEEKLY ROTATION · {routeModeId.toUpperCase()}</p>
          <h1>{weeklyModeLabel(routeModeId, locale)}周赛</h1>
          <p>五题使用同一份题库与规则快照，成绩进入统一周榜。</p>
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
          <strong>5 题 · {weeklyModeLabel(routeModeId, locale)}</strong>
          <p>失败题会继续下一题；排名依次比较答对数、猜测数和累计耗时。</p>
          <button
            className="ticket-button"
            type="button"
            disabled={busy || current.isPending || session.isPending}
            onClick={() => start.mutate()}
          >
            {busy || current.isPending ? (
              <LoaderCircle className="weekly-spinner" size={17} />
            ) : null}
            开始本周挑战
          </button>
        </section>
      ) : (
        <>
          <section className="weekly-score" aria-label="周赛进度">
            <div>
              <span>题目</span>
              <strong>{Math.min(run.games.length + (game ? 0 : 1), 5)} / 5</strong>
            </div>
            <div>
              <span>答对</span>
              <strong>{run.correctCount}</strong>
            </div>
            <div>
              <span>失败</span>
              <strong>{run.failedCount}</strong>
            </div>
            <div>
              <span>猜测</span>
              <strong>{run.totalGuesses + (game?.guesses.length ?? 0)}</strong>
            </div>
            <div>
              <span>累计耗时</span>
              <strong>{formatTime(elapsed)}</strong>
            </div>
          </section>

          {run.status === "completed" ? (
            <section className="weekly-complete" role="status">
              <Trophy size={30} aria-hidden="true" />
              <h2>本周挑战完成</h2>
              <p>
                {run.correctCount}/5 答对 · {run.totalGuesses} 次猜测 · {formatTime(run.elapsedMs)}
              </p>
              <a className="ticket-button" href="#weekly-leaderboard">
                查看统一排名
              </a>
            </section>
          ) : game ? (
            <section className="weekly-game">
              <div className="weekly-round-heading">
                <div>
                  <span>QUESTION {run.games.length} / 5</span>
                  <h2>锁定答案</h2>
                </div>
                <button
                  className="weekly-forfeit"
                  type="button"
                  disabled={busy}
                  onClick={() => forfeit.mutate()}
                >
                  <Flag size={16} aria-hidden="true" /> 结束本题
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
                  ? { entityLabel: locale === "en" ? "Aeon" : "星神", showImages: false }
                  : {})}
                excludedIds={guessedIds}
                disabled={busy}
                onSubmit={(id) => guess.mutate(id)}
              />
              {routeModeId !== "aeon" ? (
                <GuessBoard guesses={game.guesses} locale={locale} fields={game.fieldDefinitions} />
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {errorCode ? (
        <p className="inline-error" role="alert">
          周赛请求失败：{errorCode}
        </p>
      ) : null}
      <section
        className="weekly-leaderboard"
        id="weekly-leaderboard"
        aria-labelledby="weekly-board-title"
      >
        <div className="weekly-leaderboard-heading">
          <div>
            <p className="eyebrow">UNIFIED RANKING</p>
            <h2 id="weekly-board-title">本周统一排名</h2>
          </div>
          <span>{weekKey}</span>
        </div>
        {leaderboard.data?.length ? (
          <div className="weekly-leaderboard-scroll">
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>玩家</th>
                  <th>答对</th>
                  <th>猜测</th>
                  <th>耗时</th>
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
            {leaderboard.isPending ? "正在同步排名…" : "本周还没有正式完赛成绩。"}
          </p>
        )}
      </section>
      <Link className="weekly-back" to="/playable">
        <ArrowLeft size={16} /> 返回模式站
      </Link>
    </main>
  );
}
