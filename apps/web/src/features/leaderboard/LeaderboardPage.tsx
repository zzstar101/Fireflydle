import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Award, Clock3, Medal, Radio, ShieldCheck } from "lucide-react";
import type { DailyLeaderboardEntry, EloLeaderboardEntry } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import "./leaderboard.css";

function completionTime(value: string, locale: "zh-CN" | "en" | "ja") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const [searchParams, setSearchParams] = useSearchParams();
  const views = ["daily", "elo"] as const;
  const requestedView = searchParams.get("view");
  const view: (typeof views)[number] = requestedView === "elo" ? "elo" : "daily";
  const setView = (next: (typeof views)[number]) =>
    setSearchParams({ view: next }, { replace: true });
  const leaderboard = useQuery<Array<DailyLeaderboardEntry | EloLeaderboardEntry>>({
    queryKey: ["leaderboard", view],
    queryFn: () =>
      view === "elo"
        ? apiRequest<EloLeaderboardEntry[]>("/leaderboards/elo")
        : apiRequest<DailyLeaderboardEntry[]>("/leaderboards/daily"),
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
                : t("game.daily")}
            </span>
            <small>
              {value === "elo"
                ? locale === "ja"
                  ? "登録ユーザー"
                  : "REGISTERED USERS"
                : locale === "ja"
                  ? "6回固定"
                  : "6 FIXED ATTEMPTS"}
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
                </>
              ) : (
                <>
                  <th>
                    {locale === "zh-CN" ? "猜中时间" : locale === "ja" ? "正解時刻" : "SOLVED AT"}
                  </th>
                  <th>{t("leaderboard.guesses")}</th>
                  <th>{locale === "zh-CN" ? "身份" : locale === "ja" ? "種別" : "TYPE"}</th>
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
                  </>
                ) : (
                  <>
                    <td>
                      <b>{completionTime(entry.completedAt, locale)}</b>
                    </td>
                    <td>{entry.guesses}</td>
                    <td>
                      <small>
                        {entry.isGuest
                          ? locale === "zh-CN"
                            ? "访客"
                            : locale === "ja"
                              ? "ゲスト"
                              : "GUEST"
                          : locale === "zh-CN"
                            ? "注册用户"
                            : locale === "ja"
                              ? "登録ユーザー"
                              : "REGISTERED"}
                      </small>
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
                ? view === "elo"
                  ? "所有注册账号默认公开；管理员可隐藏异常账号。"
                  : "当天猜中的玩家均可上榜，包括访客。"
                : locale === "ja"
                  ? view === "elo"
                    ? "登録アカウントは既定で公開され、管理者が非表示にできます。"
                    : "当日に正解した全プレイヤーが対象で、ゲストも含まれます。"
                  : view === "elo"
                    ? "Registered accounts are public by default; admins can hide exceptions."
                    : "Everyone who solves today's puzzle is ranked, including guests."}
            </span>
          </p>
        </div>
        <div>
          <Clock3 size={19} />
          <p>
            <strong>{locale === "zh-CN" ? "排序方式" : locale === "ja" ? "順位" : "ORDER"}</strong>
            <span>
              {locale === "zh-CN"
                ? view === "elo"
                  ? "Elo 更高优先；同分时排位场次更多者优先。"
                  : "按当天猜中角色的时间先后排序。"
                : locale === "ja"
                  ? view === "elo"
                    ? "Eloが高い順。同点の場合はランク戦数が多い方を優先します。"
                    : "当日に正解した時刻の早い順に並びます。"
                  : view === "elo"
                    ? "Higher Elo first; ties favor more ranked matches."
                    : "Ordered by who solved today's character first."}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
