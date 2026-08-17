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
} from "lucide-react";
import type { PersonalStats, PublicGame } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";
import { useSession } from "../account/useSession";
import { useCurrentGames } from "../game/useCurrentGames";
import { getDefaultModeNavigation } from "../modes/mode-registry";
import { usePreferences } from "../../state/preferences";
import { useNetworkStatus } from "../../offline/network-status";
import { useSpecialModePack, type SpecialModePackState } from "../../offline/use-special-mode-pack";
import "./hub.css";

type HubMode = "daily" | "practice" | "duel" | "npc" | "currency-wars" | "aeon";

const dailyActivity = getDefaultModeNavigation("daily");
const practiceActivity = getDefaultModeNavigation("practice");
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
              : mode === "duel"
                ? 3
                : mode === "npc"
                  ? 4
                  : mode === "currency-wars"
                    ? 5
                    : 6}
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

export default function HubPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const online = useNetworkStatus();
  const npcPack = useSpecialModePack("npc", false);
  const currencyWarsPack = useSpecialModePack("currency-wars", false);
  const aeonPack = useSpecialModePack("aeon", false);
  const [now, setNow] = useState(Date.now());
  const currentGames = useCurrentGames(online);
  const session = useSession(online);
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
  const practice = currentGames.data?.practice ?? null;
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
  const practiceStatus = serviceChecking
    ? t("hub.statusSyncing")
    : practice
      ? t("hub.statusProgress", { current: practice.guesses.length, total: practice.maxAttempts })
      : t("hub.statusReady");
  const practiceMetric = practice
    ? t("hub.elapsedValue", { time: formatTime(elapsedFor(practice, now)) })
    : t("hub.runValue", { count: stats.data?.practicePlayed ?? 0 });

  return (
    <main className="hub-page">
      <section className="hub-intro" aria-labelledby="hub-title">
        <div className="hub-particles" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <i key={index} style={{ ["--particle-index" as string]: index }} />
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

      <section className="mode-board-grid" aria-label={t("hub.modesLabel")}>
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
            to={practice ? `${practiceActivity.path}?game=${practice.id}` : practiceActivity.path}
            icon={<Shuffle size={30} />}
            status={practiceStatus}
            title={t("game.random")}
            description={t("hub.randomDescription")}
            metricLabel={practice ? t("game.elapsed") : t("hub.completedRuns")}
            metricValue={practiceMetric}
            action={
              online
                ? practice
                  ? t("hub.continueGame")
                  : t("hub.startRandom")
                : t("prep.offlinePractice")
            }
            active={Boolean(practice)}
          />
        ) : null}
        {duelActivity ? (
          <ModeBoard
            mode="duel"
            to={duelActivity.path}
            icon={<Swords size={30} />}
            status={
              serviceChecking
                ? t("hub.statusSyncing")
                : serviceOnline
                  ? t("hub.statusReady")
                  : t("hub.statusUnavailable")
            }
            title={t("nav.duel")}
            description={t("hub.duelDescription")}
            metricLabel="ELO"
            metricValue={String(session.data?.user.elo ?? 1000)}
            action={serviceOnline ? t("hub.enterDuel") : t("hub.duelUnavailable")}
            disabled={!online || (!serviceChecking && !serviceOnline)}
          />
        ) : null}
        <ModeBoard
          mode="npc"
          to="/npc/practice"
          icon={<RadioTower size={30} />}
          status={packStatus(locale, npcPack.state)}
          title="NPC"
          description={t("game.npcDescription", {
            defaultValue: "通过主叙事地区、主派系与首次剧情登场版本锁定 NPC。",
          })}
          metricLabel={t("game.attempts")}
          metricValue="4"
          action={t("hub.startRandom")}
          disabled={!online && npcPack.state !== "ready"}
        />
        <ModeBoard
          mode="currency-wars"
          to="/currency-wars/practice"
          icon={<Coins size={30} />}
          status={packStatus(locale, currencyWarsPack.state)}
          title={locale === "en" ? "Currency Wars" : locale === "ja" ? "コイン戦争" : "货币战争"}
          description={
            locale === "en"
              ? "Guess an independent unit ruleset by cost, position and synergy feedback."
              : locale === "ja"
                ? "独立ルールセットのコスト、配置、シナジーでユニットを絞り込みます。"
                : "使用独立规则集，通过费用、站位和羁绊反馈锁定单位。"
          }
          metricLabel={t("game.attempts")}
          metricValue="6"
          action={t("hub.startRandom")}
          disabled={!online && currencyWarsPack.state !== "ready"}
        />
        <ModeBoard
          mode="aeon"
          to="/aeon/practice"
          icon={<Sparkles size={30} />}
          status={packStatus(locale, aeonPack.state)}
          title={locale === "en" ? "Aeons" : "星神"}
          description={
            locale === "en"
              ? "Identify an Aeon from a stable sequence of revealed image tiles."
              : locale === "ja"
                ? "順番に開示される画像タイルから星神を当てます。"
                : "根据按稳定顺序逐步揭示的图片方格猜出星神。"
          }
          metricLabel={t("game.attempts")}
          metricValue="6"
          action={t("hub.startRandom")}
          disabled={!online && aeonPack.state !== "ready"}
        />
      </section>

      <nav
        className="hub-endless-links"
        aria-label={locale === "zh-CN" ? "无尽模式" : "Endless modes"}
      >
        <Infinity size={18} aria-hidden="true" />
        {(
          [
            ["/playable/endless", locale === "zh-CN" ? "角色无尽" : "Characters"],
            ["/npc/endless", "NPC"],
            ["/currency-wars/endless", locale === "zh-CN" ? "币战" : "Currency Wars"],
            ["/aeon/endless", locale === "zh-CN" ? "星神" : "Aeons"],
          ] as const
        ).map(([to, label]) => (
          <Link key={to} to={to}>
            {label}
          </Link>
        ))}
      </nav>

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
