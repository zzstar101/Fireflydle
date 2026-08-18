import type { EloLeaderboardEntry } from "@fireflydle/contracts";
import { useQuery } from "@tanstack/react-query";
import { Award, Radio, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import "./leaderboard.css";

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const leaderboard = useQuery<EloLeaderboardEntry[]>({
    queryKey: ["leaderboard", "elo"],
    queryFn: () => apiRequest<EloLeaderboardEntry[]>("/leaderboards/elo"),
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
            <span>ELO</span>
            <strong>{locale === "ja" ? "常設" : "PERMANENT"}</strong>
          </div>
        }
      />

      <section className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>{t("leaderboard.rank")}</th>
              <th>{t("leaderboard.player")}</th>
              <th>ELO</th>
              <th>{locale === "zh-CN" ? "排位场次" : locale === "ja" ? "対戦数" : "MATCHES"}</th>
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
                <td>
                  <b>{entry.elo}</b>
                </td>
                <td>{entry.rankedMatches}</td>
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
