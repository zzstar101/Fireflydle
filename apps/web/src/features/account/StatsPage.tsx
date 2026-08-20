import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Gauge,
  History,
  Swords,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PersonalStats } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import { useSession } from "./useSession";
import { InferenceReview } from "../game/InferenceReview";
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
  const achievementLabels: Record<string, { zh: string; en: string; ja: string }> = {
    "one-shot": { zh: "一发入魂", en: "One-shot", ja: "一発入魂" },
    "daily-seven": { zh: "连续七日每日题", en: "Seven daily days", ja: "7日連続デイリー" },
    "win-streak-10": { zh: "十连胜", en: "Ten-win streak", ja: "10連勝" },
    "last-guess": { zh: "最后一猜命中", en: "Last guess hit", ja: "最後の一猜で正解" },
    "first-npc": { zh: "首次 NPC 完成", en: "First NPC finish", ja: "初NPCクリア" },
    "games-100": { zh: "累计一百局", en: "One hundred games", ja: "累計100局" },
  };
  const distribution = data
    ? [...data.guessDistribution, { guesses: 0, count: data.failedDaily }]
    : [];
  const distributionMax = Math.max(1, ...distribution.map((bucket) => bucket.count));
  const activityLabel = (activityId: string) => {
    if (activityId === "daily")
      return locale === "zh-CN" ? "每日一题" : locale === "ja" ? "デイリー" : "Daily";
    if (activityId === "practice")
      return locale === "zh-CN" ? "普通挑战" : locale === "ja" ? "通常" : "Practice";
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
      label: locale === "zh-CN" ? "普通挑战胜利" : locale === "ja" ? "通常勝利" : "Practice wins",
      value: data ? `${data.practiceWon}/${data.practicePlayed}` : "—",
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
      <section className="achievements-section" aria-labelledby="achievements-title">
        <header>
          <span id="achievements-title">
            {locale === "zh-CN" ? "成就" : locale === "ja" ? "実績" : "ACHIEVEMENTS"}
          </span>
          <small>
            {locale === "zh-CN"
              ? "仅统计正式在线成绩"
              : locale === "ja"
                ? "正式オンライン成績のみ"
                : "Official online results only"}
          </small>
        </header>
        <div className="achievements-list">
          {data?.achievements.map((achievement) => {
            const label = achievementLabels[achievement.id] ?? achievementLabels["one-shot"]!;
            const title = locale === "zh-CN" ? label.zh : locale === "ja" ? label.ja : label.en;
            return (
              <div key={achievement.id} className={achievement.unlockedAt ? "is-unlocked" : ""}>
                <strong>{title}</strong>
                <span>
                  {achievement.unlockedAt
                    ? locale === "zh-CN"
                      ? "已解锁"
                      : locale === "ja"
                        ? "解放済み"
                        : "Unlocked"
                    : `${achievement.progress}/${achievement.target}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="daily-stats-section">
        <header>
          <span>
            <BarChart3 size={18} />{" "}
            {locale === "zh-CN" ? "每日题统计" : locale === "ja" ? "デイリー統計" : "DAILY STATS"}
          </span>
          <small>
            {locale === "zh-CN"
              ? `北京时间今天已有 ${data?.todayCompletions ?? 0} 人完成`
              : locale === "ja"
                ? `北京時間の本日は ${data?.todayCompletions ?? 0} 人が達成`
                : `${data?.todayCompletions ?? 0} completed today (Beijing time)`}
          </small>
        </header>
        <div className="daily-stats-grid">
          <div className="guess-distribution">
            <h2>
              {locale === "zh-CN"
                ? "猜测分布"
                : locale === "ja"
                  ? "推測分布"
                  : "Guess distribution"}
            </h2>
            <div
              className="distribution-chart"
              aria-label={locale === "zh-CN" ? "猜测分布" : "Guess distribution"}
            >
              {distribution.map((bucket) => (
                <div key={bucket.guesses || "failed"}>
                  <strong>{bucket.count}</strong>
                  <i
                    style={{
                      height: `${Math.max(4, Math.round((bucket.count / distributionMax) * 100))}%`,
                    }}
                  />
                  <span>
                    {bucket.guesses ||
                      (locale === "zh-CN" ? "未中" : locale === "ja" ? "失敗" : "X")}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="daily-history">
            <h2>
              {locale === "zh-CN"
                ? "完成历史"
                : locale === "ja"
                  ? "達成履歴"
                  : "Completion history"}
            </h2>
            {data?.dailyHistory.length ? (
              <div className="daily-history-list">
                {data.dailyHistory.map((item) => (
                  <div key={item.dateKey}>
                    <CalendarDays size={16} />
                    <span>
                      <strong>{item.dateKey}</strong>
                      <small>
                        {item.result === "won"
                          ? locale === "zh-CN"
                            ? "已猜中"
                            : locale === "ja"
                              ? "正解"
                              : "Solved"
                          : locale === "zh-CN"
                            ? "已完成"
                            : locale === "ja"
                              ? "完了"
                              : "Completed"}
                      </small>
                    </span>
                    <i>
                      {item.guesses}
                      {locale === "zh-CN" ? " 次" : locale === "ja" ? " 回" : " guesses"}
                    </i>
                  </div>
                ))}
              </div>
            ) : (
              <p className="daily-history-empty">
                {locale === "zh-CN"
                  ? "完成每日题后，记录会显示在这里。"
                  : locale === "ja"
                    ? "デイリーを完了すると、ここに記録されます。"
                    : "Daily completions will appear here."}
              </p>
            )}
          </div>
        </div>
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
                    {activityLabel(item.activityId)} · {resultLabel(item.result)}
                  </strong>
                  <small>
                    {item.activityId === "ranked-match" && item.opponentDisplayName
                      ? `${item.ranked ? (locale === "zh-CN" ? "排位" : "RANKED") : locale === "zh-CN" ? "休闲" : "CASUAL"} · ${locale === "zh-CN" ? "对阵" : "VS"} ${item.opponentDisplayName}`
                      : new Date(item.playedAt).toLocaleString(locale)}
                  </small>
                </span>
                <i>
                  {item.activityId === "ranked-match" && item.scoreFor !== undefined
                    ? `${item.scoreFor} : ${item.scoreAgainst}`
                    : `${item.guesses} · ${Math.round(item.elapsedMs / 1000)}${locale === "zh-CN" ? " 秒" : "s"}`}
                </i>
                {item.inferenceReview ? (
                  <InferenceReview review={item.inferenceReview} locale={locale} compact />
                ) : null}
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
                    : "Complete a daily or practice game to see it here."}
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
