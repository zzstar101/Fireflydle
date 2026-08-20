import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Coins,
  Infinity,
  RadioTower,
  Shuffle,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import type { PersonalStats, PublicGame } from "@fireflydle/contracts";
import { getWeeklyModeId } from "@fireflydle/game-engine";
import { apiRequest } from "../../api/client";
import { useCurrentGames } from "../game/useCurrentGames";
import { getDefaultModeNavigation } from "../modes/mode-registry";
import { usePreferences } from "../../state/preferences";
import { useNetworkStatus } from "../../offline/network-status";
import { useSpecialModePack, type SpecialModePackState } from "../../offline/use-special-mode-pack";
import "./hub.css";

type HubMode = "daily" | "practice" | "endless" | "duel" | "currency-wars" | "aeon" | "weekly";

const dailyActivity = getDefaultModeNavigation("daily");
const practiceActivity = getDefaultModeNavigation("practice");
const endlessActivity = getDefaultModeNavigation("endless");
const duelActivity = getDefaultModeNavigation("duel");

function formatTime(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .slice(hours > 0 ? 0 : 1)
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function millisecondsUntilBeijingMidnight(now: number): number {
  const shifted = new Date(now + 8 * 60 * 60 * 1_000);
  const next =
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1) -
    8 * 60 * 60 * 1_000;
  return Math.max(0, next - now);
}

function elapsedFor(game: PublicGame, now: number): number {
  return game.status === "active" ? now - Date.parse(game.startedAt) : game.elapsedMs;
}

function packStatus(locale: "zh-CN" | "en" | "ja", state: SpecialModePackState): string {
  if (state === "ready")
    return locale === "en" ? "Offline ready" : locale === "ja" ? "オフライン利用可" : "可离线使用";
  if (state === "checking")
    return locale === "en" ? "Checking" : locale === "ja" ? "確認中" : "检查中";
  return locale === "en"
    ? "Open online once"
    : locale === "ja"
      ? "一度オンラインで開く必要があります"
      : "需联网打开一次";
}

function ModeBoard({
  mode,
  to,
  icon,
  status,
  title,
  description,
  metricLabel,
  metricValue,
  action,
  active = false,
  disabled = false,
}: {
  mode: HubMode;
  to: string;
  icon: ReactNode;
  status: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  action: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="mode-board-head">
        <span className="mode-index">
          0
          {mode === "daily"
            ? 1
            : mode === "practice"
              ? 2
              : mode === "endless"
                ? 3
                : mode === "duel"
                  ? 3
                  : mode === "currency-wars"
                    ? 4
                    : 5}
        </span>
        <span className="mode-status">
          <i /> {status}
        </span>
      </div>
      <div className="mode-symbol" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="mode-metric">
        <span>{metricLabel}</span>
        <strong>{metricValue}</strong>
      </div>
      <span className="mode-action">
        {action} <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </>
  );

  const className = `mode-board mode-${mode}${active ? " is-active" : ""}${disabled ? " is-disabled" : ""}`;
  return disabled ? (
    <article className={className} aria-disabled="true">
      {content}
    </article>
  ) : (
    <Link className={className} to={to} aria-label={`${title}，${status}，${action}`}>
      {content}
    </Link>
  );
}

function SecondaryLink({
  to,
  icon,
  title,
  detail,
  disabled = false,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  detail: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="secondary-link-icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{title}</strong>
      <span>{detail}</span>
      <ArrowUpRight className="secondary-link-arrow" size={16} aria-hidden="true" />
    </>
  );
  return disabled ? (
    <div className="hub-secondary-link is-disabled" aria-disabled="true">
      {content}
    </div>
  ) : (
    <Link className="hub-secondary-link" to={to}>
      {content}
    </Link>
  );
}

export default function HubPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const online = useNetworkStatus();
  const currencyWarsPack = useSpecialModePack("currency-wars");
  const aeonPack = useSpecialModePack("aeon");
  const [now, setNow] = useState(Date.now());
  const currentGames = useCurrentGames(online);
  const stats = useQuery({
    queryKey: ["stats", "hub"],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: online && currentGames.isSuccess,
    retry: false,
  });
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const daily = currentGames.data?.daily ?? null;
  const weeklyModeId = getWeeklyModeId(now);
  const weeklyModeLabel =
    weeklyModeId === "playable"
      ? locale === "en"
        ? "Characters"
        : locale === "ja"
          ? "キャラクター"
          : "普通角色"
      : weeklyModeId === "currency-wars"
        ? locale === "en"
          ? "Currency Wars"
          : locale === "ja"
            ? "コイン戦争"
            : "货币战争"
        : locale === "en"
          ? "Aeons"
          : "星神";
  const serviceOnline = online && currentGames.isSuccess;
  const serviceChecking = online && currentGames.isPending;
  const dailyStatus = serviceChecking
    ? t("hub.statusSyncing")
    : daily?.status === "active"
      ? t("hub.statusProgress", { current: daily.guesses.length, total: daily.maxAttempts })
      : daily
        ? t("hub.statusCompleted")
        : t("hub.statusNotStarted");
  const dailyMetric = daily
    ? t("hub.gameSummary", {
        guesses: daily.guesses.length,
        time: formatTime(elapsedFor(daily, now)),
      })
    : t("hub.streakValue", { count: stats.data?.currentStreak ?? 0 });
  return (
    <main className="hub-page">
      <section className="hub-intro" aria-labelledby="hub-title">
        <div className="hub-particles" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <i key={index} style={{ ["--particle-index" as string]: index }} />
          ))}
        </div>
        <div className="hub-ambient" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <i key={index} style={{ ["--ambient-index" as string]: index }} />
          ))}
        </div>
        <div className="hub-orbit" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <p className="eyebrow">{t("hub.eyebrow")}</p>
        <h1 id="hub-title">{t("hub.title")}</h1>
        <p>{t("hub.intro")}</p>
      </section>

      <div className="hub-section-heading">
        <span>01</span>
        <div>
          <h2>
            {locale === "zh-CN" ? "核心入口" : locale === "ja" ? "メインモード" : "Main modes"}
          </h2>
          <p>
            {locale === "zh-CN"
              ? "从这里开始一局游戏"
              : locale === "ja"
                ? "ここからゲームを始めます"
                : "Start a game here"}
          </p>
        </div>
      </div>
      <section className="mode-board-grid mode-board-grid-primary" aria-label={t("hub.modesLabel")}>
        {dailyActivity ? (
          <ModeBoard
            mode="daily"
            to={daily ? `${dailyActivity.path}?game=${daily.id}` : dailyActivity.path}
            icon={<CalendarDays size={30} />}
            status={dailyStatus}
            title={t("game.daily")}
            description={t("hub.dailyDescription")}
            metricLabel={daily ? t("hub.currentRecord") : t("home.streak")}
            metricValue={dailyMetric}
            action={
              daily?.status === "active"
                ? t("hub.continueGame")
                : daily
                  ? t("hub.viewResult")
                  : t("hub.startDaily")
            }
            active={daily?.status === "active"}
            disabled={!online}
          />
        ) : null}
        {practiceActivity ? (
          <ModeBoard
            mode="practice"
            to={practiceActivity.path}
            icon={<Shuffle size={30} />}
            status={locale === "en" ? "READY" : locale === "ja" ? "準備完了" : "随时可玩"}
            title={
              locale === "en" ? "Normal challenge" : locale === "ja" ? "通常チャレンジ" : "普通挑战"
            }
            description={
              locale === "en"
                ? "Practice one character at a time with the full feedback rules."
                : locale === "ja"
                  ? "完全なヒントルールでキャラクター問題を1問ずつ練習します。"
                  : "使用完整提示规则，逐题练习普通角色。"
            }
            metricLabel={t("game.attempts")}
            metricValue="6"
            action={t("hub.startRandom")}
          />
        ) : null}
        {endlessActivity ? (
          <ModeBoard
            mode="endless"
            to={endlessActivity.path}
            icon={<Infinity size={30} />}
            status={locale === "en" ? "5 lives" : locale === "ja" ? "5 ライフ" : "5 条命"}
            title={
              locale === "en"
                ? "Endless challenge"
                : locale === "ja"
                  ? "エンドレス挑戦"
                  : "无尽挑战"
            }
            description={
              locale === "en"
                ? "Keep the streak alive across a shuffle bag of characters."
                : locale === "ja"
                  ? "シャッフルされた問題を、ライフが尽きるまで続けます。"
                  : "在洗牌题袋中持续猜题，直到生命耗尽。"
            }
            metricLabel={locale === "en" ? "LIVES" : locale === "ja" ? "ライフ" : "生命"}
            metricValue="5"
            action={locale === "en" ? "Start endless" : locale === "ja" ? "開始" : "开始无尽"}
            active={false}
          />
        ) : null}
      </section>

      <div className="hub-section-heading hub-section-heading-secondary">
        <span>02</span>
        <div>
          <h2>
            {locale === "zh-CN" ? "更多玩法" : locale === "ja" ? "その他のモード" : "More modes"}
          </h2>
          <p>
            {locale === "zh-CN"
              ? "活动、对战与收藏玩法"
              : locale === "ja"
                ? "イベント、対戦、コレクション"
                : "Events, duels, and collections"}
          </p>
        </div>
      </div>
      <section
        className="hub-secondary-grid"
        aria-label={locale === "zh-CN" ? "更多玩法" : "More modes"}
      >
        <SecondaryLink
          to={`/${weeklyModeId}/weekly`}
          icon={<Trophy size={20} />}
          title={locale === "en" ? "Weekly" : locale === "ja" ? "ウィークリー" : "周赛"}
          detail={`${weeklyModeLabel} · 5 ${locale === "zh-CN" ? "题" : "questions"}`}
        />
        <SecondaryLink
          to={duelActivity?.path ?? "/playable/duel"}
          icon={<Swords size={20} />}
          title={t("nav.duel")}
          detail={serviceOnline ? t("hub.statusReady") : t("hub.statusUnavailable")}
          disabled={!online || (!serviceChecking && !serviceOnline)}
        />
        <SecondaryLink
          to="/currency-wars/practice"
          icon={<Coins size={20} />}
          title={locale === "en" ? "Currency Wars" : locale === "ja" ? "コイン戦争" : "货币战争"}
          detail={packStatus(locale, currencyWarsPack.state)}
          disabled={!online && currencyWarsPack.state !== "ready"}
        />
        <SecondaryLink
          to="/aeon/practice"
          icon={<Sparkles size={20} />}
          title={locale === "en" ? "Aeons" : "星神"}
          detail={packStatus(locale, aeonPack.state)}
          disabled={!online && aeonPack.state !== "ready"}
        />
        <SecondaryLink
          to="/playable/portrait"
          icon={<Infinity size={20} />}
          title={
            locale === "zh-CN"
              ? "立绘挑战"
              : locale === "ja"
                ? "立ち絵チャレンジ"
                : "Portrait challenge"
          }
          detail={locale === "zh-CN" ? "单局、无尽与时装" : "Practice, endless, and skins"}
        />
      </section>

      <section className="station-status" aria-label={t("hub.stationStatus")}>
        <div>
          <Clock3 size={16} aria-hidden="true" />
          <span>{t("hub.nextReset")}</span>
          <strong className="mono">{formatTime(millisecondsUntilBeijingMidnight(now))}</strong>
        </div>
        <div className={online ? "status-online" : "status-offline"}>
          <RadioTower size={16} aria-hidden="true" />
          <span>{t("hub.service")}</span>
          <strong>
            {!online
              ? t("common.offline")
              : serviceChecking
                ? t("hub.statusSyncing")
                : serviceOnline
                  ? t("common.online")
                  : t("hub.statusUnavailable")}
          </strong>
        </div>
      </section>
    </main>
  );
}
