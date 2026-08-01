import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Award, Clock3, Medal, Radio, ShieldCheck } from "lucide-react";
import type { DailyLeaderboardEntry, Difficulty, EloLeaderboardEntry } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import "./leaderboard.css";

function time(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const [searchParams, setSearchParams] = useSearchParams();
  const views = ["casual", "standard", "hard", "elo"] as const;
  const requestedView = searchParams.get("view");
  const view: Difficulty | "elo" = views.includes(requestedView as (typeof views)[number])
    ? (requestedView as Difficulty | "elo")
    : "standard";
  const setView = (next: Difficulty | "elo") => setSearchParams({ view: next }, { replace: true });
  const leaderboard = useQuery<Array<DailyLeaderboardEntry | EloLeaderboardEntry>>({
    queryKey: ["leaderboard", view],
    queryFn: () =>
      view === "elo"
        ? apiRequest<EloLeaderboardEntry[]>("/leaderboards/elo")
        : apiRequest<DailyLeaderboardEntry[]>(`/leaderboards/daily?difficulty=${view}`),
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
            <span>UTC+8</span>
            <strong>00:00</strong>
          </div>
        }
      />

      <div className="leaderboard-tabs" role="tablist">
        {views.map((value, index) => (
          <button
            key={value}
            role="tab"
            aria-selected={view === value}
            tabIndex={view === value ? 0 : -1}
            className={view === value ? "active" : undefined}
            onClick={() => setView(value)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              const offset = event.key === "ArrowRight" ? 1 : -1;
              const next = views[(index + offset + views.length) % views.length];
              if (!next) return;
              setView(next);
              requestAnimationFrame(() => {
                document
                  .querySelector<HTMLButtonElement>(`[role="tab"][data-view="${next}"]`)
                  ?.focus();
              });
            }}
            data-view={value}
          >
            <span>
              {value === "elo"
                ? locale === "zh-CN"
                  ? "对战 Elo"
                  : locale === "ja"
                    ? "対戦 Elo"
                    : "Duel Elo"
                : t(`game.${value}`)}
            </span>
            <small>
              {value === "elo"
                ? locale === "ja"
                  ? "10戦で公開"
                  : "10 MATCHES TO RANK"
                : value === "casual"
                  ? "8 ATTEMPTS"
                  : value === "standard"
                    ? "6 ATTEMPTS"
                    : "4 ATTEMPTS"}
            </small>
          </button>
        ))}
      </div>

      <section className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>{t("leaderboard.rank")}</th>
              <th>{t("leaderboard.player")}</th>
              {view === "elo" ? (
                <>
                  <th>ELO</th>
                  <th>
                    {locale === "zh-CN" ? "排位场次" : locale === "ja" ? "対戦数" : "MATCHES"}
                  </th>
                  <th>
                    {locale === "zh-CN" ? "公开状态" : locale === "ja" ? "公開状態" : "STATUS"}
                  </th>
                </>
              ) : (
                <>
                  <th>{t("leaderboard.guesses")}</th>
                  <th>{t("leaderboard.time")}</th>
                  <th>{t("leaderboard.streak")}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.rank}-${entry.displayName}`}>
                <td>
                  <span className={`rank-number rank-${entry.rank}`}>
                    {entry.rank <= 3 ? <Medal size={17} /> : null}
                    {String(entry.rank).padStart(2, "0")}
                  </span>
                </td>
                <td>
                  <span className="leader-name">
                    <i>{entry.displayName.slice(0, 2).toUpperCase()}</i>
                    <strong>{entry.displayName}</strong>
                  </span>
                </td>
                {"elo" in entry ? (
                  <>
                    <td>
                      <b>{entry.elo}</b>
                    </td>
                    <td>{entry.rankedMatches}</td>
                    <td>
                      <small>PUBLIC</small>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <b>{entry.guesses}</b>
                    </td>
                    <td className="mono">{time(entry.elapsedMs)}</td>
                    <td>
                      {entry.streak}
                      <small> DAYS</small>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!leaderboard.isLoading && entries.length === 0 && (
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
        )}
        {leaderboard.isLoading && (
          <div className="leaderboard-loading">
            <span className="button-spinner" />
            {t("common.loading")}
          </div>
        )}
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
                ? "注册账号并完成 10 场排位赛。访客战绩会在注册后自动合并。"
                : locale === "ja"
                  ? "アカウント登録後、ランク戦を10回完了すると公開されます。ゲスト Elo は登録時に統合されます。"
                  : "Register and complete 10 ranked matches. Guest Elo merges on registration."}
            </span>
          </p>
        </div>
        <div>
          <Clock3 size={19} />
          <p>
            <strong>{locale === "zh-CN" ? "排序方式" : locale === "ja" ? "順位" : "ORDER"}</strong>
            <span>
              {locale === "zh-CN"
                ? "猜中优先；次数更少优先；用时更短优先。"
                : locale === "ja"
                  ? "正解者を優先し、推測回数、所要時間の順で並びます。"
                  : "Solved first, then fewer guesses, then faster completion."}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
