import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, ChevronRight, Gauge, History, Swords, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PersonalStats } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import { useSession } from "./useSession";
import "./account.css";

export default function StatsPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const session = useSession();
  const stats = useQuery({
    queryKey: ["stats", session.data?.user.id],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: Boolean(session.data),
    retry: false,
  });
  const data = stats.data;
  const modeLabel = (mode: string) => {
    if (mode === "daily")
      return locale === "zh-CN" ? "每日一题" : locale === "ja" ? "デイリー" : "Daily";
    if (mode === "random")
      return locale === "zh-CN" ? "随机挑战" : locale === "ja" ? "ランダム" : "Random";
    return locale === "zh-CN" ? "对战" : locale === "ja" ? "対戦" : "Duel";
  };
  const resultLabel = (result: string) => {
    if (result === "won") return locale === "zh-CN" ? "胜利" : locale === "ja" ? "勝利" : "Won";
    if (result === "lost") return locale === "zh-CN" ? "失败" : locale === "ja" ? "敗北" : "Lost";
    if (result === "draw")
      return locale === "zh-CN" ? "平局" : locale === "ja" ? "引き分け" : "Draw";
    if (result === "conceded")
      return locale === "zh-CN" ? "已放弃" : locale === "ja" ? "棄権" : "Conceded";
    return locale === "zh-CN" ? "已结束" : locale === "ja" ? "終了" : "Finished";
  };
  const values = [
    {
      icon: CalendarDays,
      label: locale === "zh-CN" ? "每日挑战" : locale === "ja" ? "デイリー達成" : "Daily solved",
      value: data ? `${data.dailyWon}/${data.dailyPlayed}` : "—",
    },
    {
      icon: Activity,
      label:
        locale === "zh-CN" ? "当前连续天数" : locale === "ja" ? "現在の連続" : "Current streak",
      value: data ? String(data.currentStreak) : "—",
    },
    {
      icon: Gauge,
      label: locale === "zh-CN" ? "最长连续天数" : locale === "ja" ? "最高連続" : "Best streak",
      value: data ? String(data.bestStreak) : "—",
    },
    {
      icon: Target,
      label: locale === "zh-CN" ? "随机挑战" : locale === "ja" ? "ランダム勝利" : "Random wins",
      value: data ? `${data.randomWon}/${data.randomPlayed}` : "—",
    },
    {
      icon: Gauge,
      label: locale === "zh-CN" ? "平均猜测次数" : locale === "ja" ? "平均推測数" : "Avg. guesses",
      value: data ? data.averageGuesses.toFixed(1) : "—",
    },
    {
      icon: Swords,
      label: locale === "zh-CN" ? "排位对战" : locale === "ja" ? "ランク勝利" : "Ranked wins",
      value: data ? `${data.rankedWon}/${data.rankedPlayed}` : "—",
    },
  ];
  return (
    <main className="page-shell stats-page">
      <PageHeader
        eyebrow={locale === "zh-CN" ? "个人战绩" : locale === "ja" ? "個人戦績" : "MY STATS"}
        title={locale === "zh-CN" ? "我的战绩" : locale === "ja" ? "あなたの戦績" : "Your stats"}
        intro={
          locale === "zh-CN"
            ? "访客战绩只与当前浏览器关联；注册或登录后会自动合并。"
            : locale === "ja"
              ? "ゲスト記録はこのブラウザの非公開セッションに紐づき、アカウント作成・ログイン時に安全に統合されます。"
              : "Guest records are tied to this browser's private session and merge safely when you create or sign in to an account."
        }
      />
      {stats.isError ? (
        <div className="inline-error" role="alert">
          {locale === "zh-CN"
            ? "战绩加载失败，请稍后重试。"
            : locale === "ja"
              ? "戦績を読み込めません。しばらくしてからお試しください。"
              : "Stats could not be loaded. Please try again later."}
        </div>
      ) : null}
      <section className="stats-metrics">
        {values.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <Icon size={20} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="history-section">
        <header>
          <span>
            <History size={18} />{" "}
            {locale === "zh-CN" ? "最近记录" : locale === "ja" ? "最近の記録" : "RECENT HISTORY"}
          </span>
          <small>
            {locale === "zh-CN"
              ? "详细回放保留 30 天"
              : locale === "ja"
                ? "詳細リプレイは30日間保存"
                : "Detailed replays retained for 30 days"}
          </small>
        </header>
        {data?.recent.length ? (
          <div className="history-list">
            {data.recent.map((item) => (
              <Link key={item.id} to={`/replay/${item.id}`}>
                <Target size={17} />
                <span>
                  <strong>
                    {modeLabel(item.mode)} · {resultLabel(item.result)}
                  </strong>
                  <small>
                    {item.mode === "multiplayer" && item.opponentDisplayName
                      ? `${item.ranked ? (locale === "zh-CN" ? "排位" : "RANKED") : locale === "zh-CN" ? "休闲" : "CASUAL"} · ${locale === "zh-CN" ? "对阵" : "VS"} ${item.opponentDisplayName}`
                      : new Date(item.playedAt).toLocaleString(locale)}
                  </small>
                </span>
                <i>
                  {item.mode === "multiplayer" && item.scoreFor !== undefined
                    ? `${item.scoreFor} : ${item.scoreAgainst}`
                    : `${item.guesses} · ${Math.round(item.elapsedMs / 1000)}${locale === "zh-CN" ? " 秒" : "s"}`}
                </i>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <History size={30} />
            <h2>
              {stats.isError
                ? locale === "zh-CN"
                  ? "统计服务暂不可用"
                  : locale === "ja"
                    ? "統計サービスを利用できません"
                    : "Stats service unavailable"
                : locale === "zh-CN"
                  ? "还没有可显示的记录"
                  : locale === "ja"
                    ? "表示できる記録はまだありません"
                    : "No records yet"}
            </h2>
            <p>
              {stats.isError
                ? locale === "zh-CN"
                  ? "连接恢复后，这里会重新显示你的历史记录。"
                  : locale === "ja"
                    ? "接続が回復すると、履歴がここに再表示されます。"
                    : "Your history will return here when the connection recovers."
                : locale === "zh-CN"
                  ? "完成今日谜题或随机对局后，结果会出现在这里。"
                  : locale === "ja"
                    ? "デイリーまたはランダムを完了すると、ここに記録されます。"
                    : "Complete a daily or random game to see it here."}
            </p>
            <Link className="ticket-button" to="/">
              {t("hub.backToHub")}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
