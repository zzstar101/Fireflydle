import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Clock3, RadioTower, Shuffle, Swords } from "lucide-react";
import type { Announcement, PersonalStats, PublicGame } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import { useCurrentGames } from "../game/useCurrentGames";
import "./hub.css";

type HubMode = "daily" | "random" | "duel";

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
        <span className="mode-index">0{mode === "daily" ? 1 : mode === "random" ? 2 : 3}</span>
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
  const [now, setNow] = useState(Date.now());
  const currentGames = useCurrentGames();
  const session = useSession();
  const stats = useQuery({
    queryKey: ["stats", "hub"],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: currentGames.isSuccess,
    retry: false,
  });
  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiRequest<Announcement[]>("/announcements"),
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const daily = currentGames.data?.daily ?? null;
  const random = currentGames.data?.random ?? null;
  const serviceOnline = currentGames.isSuccess;
  const serviceChecking = currentGames.isPending;
  const announcement = announcements.data?.[0];

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
  const randomStatus = serviceChecking
    ? t("hub.statusSyncing")
    : random
      ? t("hub.statusProgress", { current: random.guesses.length, total: random.maxAttempts })
      : t("hub.statusReady");
  const randomMetric = random
    ? t("hub.elapsedValue", { time: formatTime(elapsedFor(random, now)) })
    : t("hub.runValue", { count: stats.data?.randomPlayed ?? 0 });

  return (
    <main className="hub-page">
      <section className="hub-intro" aria-labelledby="hub-title">
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
        <ModeBoard
          mode="daily"
          to={daily ? `/daily?game=${daily.id}` : "/daily"}
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
        />
        <ModeBoard
          mode="random"
          to={random ? `/random?game=${random.id}` : "/random"}
          icon={<Shuffle size={30} />}
          status={randomStatus}
          title={t("game.random")}
          description={t("hub.randomDescription")}
          metricLabel={random ? t("game.elapsed") : t("hub.completedRuns")}
          metricValue={randomMetric}
          action={random ? t("hub.continueGame") : t("hub.startRandom")}
          active={Boolean(random)}
        />
        <ModeBoard
          mode="duel"
          to="/duel"
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
          disabled={!serviceChecking && !serviceOnline}
        />
      </section>

      <section className="station-status" aria-label={t("hub.stationStatus")}>
        <div>
          <Clock3 size={16} aria-hidden="true" />
          <span>{t("hub.nextReset")}</span>
          <strong className="mono">{formatTime(millisecondsUntilBeijingMidnight(now))}</strong>
        </div>
        <div className={serviceOnline ? "status-online" : "status-offline"}>
          <RadioTower size={16} aria-hidden="true" />
          <span>{t("hub.service")}</span>
          <strong>
            {serviceChecking
              ? t("hub.statusSyncing")
              : serviceOnline
                ? t("common.online")
                : t("hub.statusUnavailable")}
          </strong>
        </div>
        <div className="station-announcement">
          <span>{t("hub.announcement")}</span>
          <strong>{announcement?.title[locale] ?? t("hub.defaultAnnouncement")}</strong>
        </div>
      </section>
    </main>
  );
}
