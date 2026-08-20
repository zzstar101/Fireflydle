import type { EloLeaderboardEntry } from "@fireflydle/contracts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Radio, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import "./leaderboard.css";

type DailyLeaderboardEntry = {
  rank: number;
  displayName: string;
  result: "won" | "lost";
  guesses: number;
  elapsedMs: number;
  completedAt: string;
};
type EndlessLeaderboardEntry = {
  modeId: string;
  rank: number;
  displayName: string;
  clears: number;
  totalGuesses: number;
  elapsedMs: number;
};

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const [board, setBoard] = useState<"elo" | "daily" | "endless">("elo");
  const leaderboard = useQuery<
    EloLeaderboardEntry[] | DailyLeaderboardEntry[] | EndlessLeaderboardEntry[]
  >({
    queryKey: ["leaderboard", board],
    queryFn: () =>
      apiRequest<EloLeaderboardEntry[] | DailyLeaderboardEntry[]>(
        board === "elo"
          ? "/leaderboards/elo"
          : board === "daily"
            ? "/leaderboards/daily"
            : "/leaderboards/endless?modeId=playable",
      ),
    retry: false,
  });
  const entries = leaderboard.data ?? [];

  return (
    <main className="page-shell leaderboard-page">
      <PageHeader
        eyebrow={t("leaderboard.eyebrow")}
        title={t("leaderboard.title")}
        intro={t("leaderboard.intro")}
        aside={
          <div className="rank-live">
            <Radio size={16} />
            <span>{board === "elo" ? "ELO" : locale === "zh-CN" ? "每日题" : "DAILY"}</span>
            <strong>
              {board === "elo"
                ? locale === "ja"
                  ? "常設"
                  : "PERMANENT"
                : locale === "zh-CN"
                  ? "今日"
                  : locale === "ja"
                    ? "本日"
                    : "TODAY"}
            </strong>
          </div>
        }
      />

      <div className="leaderboard-tabs" role="tablist" aria-label={t("leaderboard.title")}>
        <button
          type="button"
          className={board === "elo" ? "is-active" : ""}
          onClick={() => setBoard("elo")}
        >
          ELO
        </button>
        <button
          type="button"
          className={board === "daily" ? "is-active" : ""}
          onClick={() => setBoard("daily")}
        >
          {locale === "zh-CN" ? "每日题" : locale === "ja" ? "デイリー" : "Daily"}
        </button>
        <button
          type="button"
          className={board === "endless" ? "is-active" : ""}
          onClick={() => setBoard("endless")}
        >
          {locale === "zh-CN" ? "无尽" : locale === "ja" ? "エンドレス" : "Endless"}
        </button>
      </div>

      <section className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>{t("leaderboard.rank")}</th>
              <th>{t("leaderboard.player")}</th>
              <th>
                {board === "elo"
                  ? "ELO"
                  : board === "daily"
                    ? locale === "zh-CN"
                      ? "结果"
                      : locale === "ja"
                        ? "結果"
                        : "RESULT"
                    : locale === "zh-CN"
                      ? "通关"
                      : "CLEARS"}
              </th>
              <th>
                {board === "elo"
                  ? locale === "zh-CN"
                    ? "排位场次"
                    : locale === "ja"
                      ? "対戦数"
                      : "MATCHES"
                  : board === "daily"
                    ? locale === "zh-CN"
                      ? "猜测 / 用时"
                      : "GUESSES / TIME"
                    : locale === "zh-CN"
                      ? "猜测 / 用时"
                      : "GUESSES / TIME"}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.rank}-${entry.displayName}`}>
                <td>
                  <span className={`rank-number rank-${entry.rank}`}>
                    {String(entry.rank).padStart(2, "0")}
                  </span>
                </td>
                <td>
                  <span className="leader-name">
                    <i>{entry.displayName.slice(0, 2).toUpperCase()}</i>
                    <strong>{entry.displayName}</strong>
                  </span>
                </td>
                {board === "elo" ? (
                  <>
                    <td>
                      <b>{(entry as EloLeaderboardEntry).elo}</b>
                    </td>
                    <td>{(entry as EloLeaderboardEntry).rankedMatches}</td>
                  </>
                ) : board === "daily" ? (
                  <>
                    <td>{(entry as DailyLeaderboardEntry).result === "won" ? "✓" : "—"}</td>
                    <td>
                      {(entry as DailyLeaderboardEntry).guesses} /{" "}
                      {Math.ceil((entry as DailyLeaderboardEntry).elapsedMs / 1000)}s
                    </td>
                  </>
                ) : (
                  <>
                    <td>{(entry as EndlessLeaderboardEntry).clears}</td>
                    <td>
                      {(entry as EndlessLeaderboardEntry).totalGuesses} /{" "}
                      {Math.ceil((entry as EndlessLeaderboardEntry).elapsedMs / 1000)}s
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!leaderboard.isLoading && entries.length === 0 ? (
          <div className="leaderboard-empty">
            <Award size={34} />
            <h2>{t("leaderboard.empty")}</h2>
            <p>
              {leaderboard.isError
                ? locale === "zh-CN"
                  ? "排行榜暂时无法加载，请稍后重试。"
                  : locale === "ja"
                    ? "ランキングを読み込めません。しばらくしてからお試しください。"
                    : "The leaderboard could not be loaded. Please try again later."
                : t("leaderboard.empty")}
            </p>
          </div>
        ) : null}
        {leaderboard.isLoading ? (
          <div className="leaderboard-loading">
            <span className="button-spinner" />
            {t("common.loading")}
          </div>
        ) : null}
      </section>

      <section className="ranking-notes">
        <div>
          <ShieldCheck size={19} />
          <p>
            <strong>
              {locale === "zh-CN"
                ? "上榜条件"
                : locale === "ja"
                  ? "公開条件"
                  : "PUBLIC ELIGIBILITY"}
            </strong>
            <span>
              {locale === "zh-CN"
                ? "仅展示未被隐藏的注册账号；访客不参与 Elo 排名。"
                : locale === "ja"
                  ? "非表示ではない登録アカウントのみ掲載し、ゲストは Elo 対象外です。"
                  : "Only visible registered accounts are listed; guests do not enter Elo rankings."}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
