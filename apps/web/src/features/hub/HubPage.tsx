import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, RadioTower } from "lucide-react";
import type { PersonalStats, WeeklyRun } from "@fireflydle/contracts";
import { getWeeklyModeId } from "@fireflydle/game-engine";
import { apiRequest } from "../../api/client";
import { useNetworkStatus } from "../../offline/network-status";
import { useSpecialModePack, type SpecialModePackState } from "../../offline/use-special-mode-pack";
import { usePreferences } from "../../state/preferences";
import { useCurrentGames } from "../game/useCurrentGames";
import { ModeArt, type ModeArtKind } from "../modes/ModeArt";
import { getDefaultModeNavigation } from "../modes/mode-registry";
import {
  beijingDateKey,
  beijingDaysLeftInWeek,
  beijingWeekKeys,
  dailyIssueNumber,
  formatCountdown,
  millisecondsUntilBeijingMidnight,
} from "./daily-issue";
import { useHeroStarfield } from "./use-hero-starfield";
import "./hub.css";

type HubLocale = "zh-CN" | "en" | "ja";

/** 每日题固定 6 次机会；服务端还没返回对局时用这个值占位。 */
const DAILY_ATTEMPTS = 6;
/** 无尽模式的初始生命条数，纯规则展示。 */
const ENDLESS_LIVES = 5;
/** 与 beijingWeekKeys 的顺序一一对应。 */
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const dailyActivity = getDefaultModeNavigation("daily");
const practiceActivity = getDefaultModeNavigation("practice");
const endlessActivity = getDefaultModeNavigation("endless");
const duelActivity = getDefaultModeNavigation("duel");

/**
 * 卡片进入视口时打开装饰动画（README §7：动画只在卡片可见时运行）。
 * 不支持 IntersectionObserver 时直接算可见，保证静态几何一致。
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting);
      },
      { rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function packStatus(locale: HubLocale, state: SpecialModePackState): string {
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

function formatAverage(value: number | undefined): string {
  if (!value) return "0";
  return value.toFixed(1);
}

function formatDateLabel(locale: HubLocale, dateKey: string): string {
  const parsed = Date.parse(`${dateKey}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return dateKey;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function HubModeCard({
  mode,
  kind,
  to,
  badge,
  title,
  description,
  metric,
  disabled = false,
}: {
  mode: string;
  kind: ModeArtKind;
  to: string;
  badge: string;
  title: string;
  description: string;
  metric: ReactNode;
  disabled?: boolean;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const body = (
    <>
      <span className="mode-board-badge">{badge}</span>
      <span className="mode-board-art" aria-hidden="true">
        <ModeArt kind={kind} />
      </span>
      <strong className="mode-board-title">{title}</strong>
      <span className="mode-board-description">{description}</span>
      <span className="mode-board-metric">{metric}</span>
      <span className="mode-board-go" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
    </>
  );
  const className = `mode-board mode-${mode}`;
  return (
    <div className="hub-card-shell" ref={ref}>
      {disabled ? (
        <div className={`${className} is-disabled`} data-visible="false" aria-disabled="true">
          {body}
        </div>
      ) : (
        <Link className={className} data-visible={visible ? "true" : "false"} to={to}>
          {body}
        </Link>
      )}
    </div>
  );
}

function HubRow({
  to,
  kind,
  title,
  detail,
  disabled = false,
}: {
  to: string;
  kind: ModeArtKind;
  title: string;
  detail: string;
  disabled?: boolean;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const body = (
    <>
      <span className="hub-secondary-icon" aria-hidden="true">
        <ModeArt kind={kind} />
      </span>
      <strong>{title}</strong>
      <span className="hub-secondary-detail">{detail}</span>
      <span className="hub-secondary-go" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
    </>
  );
  return (
    <div className="hub-row-shell" ref={ref}>
      {disabled ? (
        <div className="hub-secondary-link is-disabled" data-visible="false" aria-disabled="true">
          {body}
        </div>
      ) : (
        <Link className="hub-secondary-link" data-visible={visible ? "true" : "false"} to={to}>
          {body}
        </Link>
      )}
    </div>
  );
}

export default function HubPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language) as HubLocale;
  const online = useNetworkStatus();
  const currencyWarsPack = useSpecialModePack("currency-wars");
  const aeonPack = useSpecialModePack("aeon");
  const [now, setNow] = useState(() => Date.now());
  const currentGames = useCurrentGames(online);
  const stats = useQuery({
    queryKey: ["stats", "hub"],
    queryFn: () => apiRequest<PersonalStats>("/stats/me"),
    enabled: online && currentGames.isSuccess,
    retry: false,
  });
  const weekly = useQuery({
    queryKey: ["weekly", "current"],
    queryFn: () => apiRequest<WeeklyRun | null>("/weekly/runs/current"),
    enabled: online && currentGames.isSuccess,
    retry: false,
  });
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const brand = t("brand.name");
  useHeroStarfield({ text: brand });

  const daily = currentGames.data?.daily ?? null;
  const dateKey = currentGames.data?.dateKey ?? beijingDateKey(now);
  const todayKey = beijingDateKey(now);
  const issue = dailyIssueNumber(dateKey);
  const countdown = formatCountdown(millisecondsUntilBeijingMidnight(now));
  const attempts = daily?.maxAttempts ?? DAILY_ATTEMPTS;

  const serviceOnline = online && currentGames.isSuccess;
  const serviceChecking = online && currentGames.isPending;
  const dailyStatus = serviceChecking
    ? t("hub.statusSyncing")
    : daily?.status === "active"
      ? t("hub.statusProgress", { current: daily.guesses.length, total: attempts })
      : daily
        ? t("hub.statusCompleted")
        : t("hub.statusNotStarted");
  const dailyHref = dailyActivity
    ? daily
      ? `${dailyActivity.path}?game=${daily.id}`
      : dailyActivity.path
    : "/playable/daily";
  const dailyAction =
    daily?.status === "active"
      ? t("hub.continueToday")
      : daily
        ? t("hub.viewToday")
        : t("hub.startToday");

  const history = new Map((stats.data?.dailyHistory ?? []).map((entry) => [entry.dateKey, entry]));
  const yesterdayKey = beijingDateKey(now - 24 * 60 * 60 * 1_000);
  const yesterday = history.get(yesterdayKey) ?? null;

  const weekKeys = beijingWeekKeys(now);
  const weeklyRun = weekly.data ?? null;
  const weeklyDaysLeft = weeklyRun
    ? Math.max(0, Math.ceil((Date.parse(weeklyRun.weekEndsAt) - now) / (24 * 60 * 60 * 1_000)))
    : beijingDaysLeftInWeek(now);
  const weeklyModeId = getWeeklyModeId(now);

  return (
    <main className="hub-page">
      <section className="hub-hero" aria-labelledby="hub-title">
        <div className="hub-hero-copy">
          {/* 粒子字只在 WebGL 可用且未减少动效时存在；降级时用同字号的 DOM 文字补上品牌字，
              否则首屏会剩下一大块空白。 */}
          <p className="hub-hero-brand" aria-hidden="true">
            {brand}
          </p>
          <span className="hub-badge">
            <i aria-hidden="true" />
            {t("hub.dailyIssue", { number: issue })}
            <span aria-hidden="true">·</span>
            {dailyStatus}
          </span>
          <h1 id="hub-title">{t("hub.heroTitle")}</h1>
          <p className="hub-hero-intro">
            <Trans
              i18nKey="hub.heroIntro"
              values={{ attempts, time: countdown }}
              components={{ time: <b className="num" /> }}
            />
          </p>
        </div>
        <div className="hub-hero-side">
          <dl className="hub-metrics">
            <div>
              <dt>{t("hub.metricStreak")}</dt>
              <dd className="num">{stats.data?.currentStreak ?? 0}</dd>
            </div>
            <div>
              <dt>{t("hub.metricSolvedToday")}</dt>
              <dd className="num">{stats.data?.todayCompletions ?? 0}</dd>
            </div>
            <div>
              <dt>{t("hub.metricAverage")}</dt>
              <dd className="num">{formatAverage(stats.data?.averageGuesses)}</dd>
            </div>
          </dl>
          <p className="hub-yesterday">
            <span className="hub-yesterday-label">{t("hub.yesterday")}</span>
            {yesterday ? (
              <>
                <strong>{formatDateLabel(locale, yesterday.dateKey)}</strong>
                <span aria-hidden="true">·</span>
                <span>
                  {yesterday.result === "won"
                    ? t("hub.yesterdaySolved", { guesses: yesterday.guesses })
                    : t("hub.yesterdayFailed")}
                </span>
              </>
            ) : (
              <span>{t("hub.yesterdayEmpty")}</span>
            )}
          </p>
          <Link className="hub-cta" to={dailyHref}>
            {dailyAction}
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="hub-block" aria-labelledby="hub-open-round">
        <header className="hub-block-head">
          <h2 id="hub-open-round">{t("hub.openRound")}</h2>
          <p>{t("hub.openRoundHint")}</p>
        </header>
        <div className="mode-board-grid">
          {practiceActivity ? (
            <HubModeCard
              mode="practice"
              kind="practice"
              to={practiceActivity.path}
              badge={t("hub.badgeUnranked")}
              title={t("hub.modePractice")}
              description={t("hub.practiceDescription")}
              metric={t("hub.practiceRuns", { count: stats.data?.practicePlayed ?? 0 })}
            />
          ) : null}
          {endlessActivity ? (
            <HubModeCard
              mode="endless"
              kind="endless"
              to={endlessActivity.path}
              badge={t("hub.badgeLives")}
              title={t("hub.modeEndless")}
              description={t("hub.endlessDescription")}
              metric={
                <span className="hub-lives" aria-hidden="true">
                  {Array.from({ length: ENDLESS_LIVES }, (_, index) => (
                    <i key={index} />
                  ))}
                </span>
              }
            />
          ) : null}
          <HubModeCard
            mode="weekly"
            kind="weekly"
            to={`/${weeklyModeId}/weekly`}
            badge={t("hub.badgeWeeklyDays", { count: weeklyDaysLeft })}
            title={t("hub.modeWeekly")}
            description={t("hub.weeklyDescription")}
            metric={t("hub.weekProgress", {
              done: weeklyRun?.correctCount ?? 0,
              total: weeklyRun?.questionCount ?? 5,
            })}
          />
          <HubModeCard
            mode="duel"
            kind="duel"
            to={duelActivity?.path ?? "/playable/duel"}
            badge={serviceOnline ? t("hub.statusReady") : t("hub.statusUnavailable")}
            title={t("hub.modeDuel")}
            description={t("hub.duelDescription")}
            metric={t("hub.duelFormat")}
            disabled={!online || (!serviceChecking && !serviceOnline)}
          />
        </div>
      </section>

      <section className="hub-block" aria-labelledby="hub-more-ways">
        <header className="hub-block-head">
          <h2 id="hub-more-ways">{t("hub.moreWays")}</h2>
          <p>{t("hub.moreWaysHint")}</p>
        </header>
        <div className="hub-secondary-grid">
          <HubRow
            to="/playable/portrait"
            kind="portrait"
            title={t("hub.modePortrait")}
            detail={t("hub.modePortraitHint")}
          />
          <HubRow
            to="/currency-wars/practice"
            kind="currency-wars"
            title={t("hub.modeCurrencyWars")}
            detail={`${t("hub.modeCurrencyWarsHint")} · ${packStatus(locale, currencyWarsPack.state)}`}
            disabled={!online && currencyWarsPack.state !== "ready"}
          />
          <HubRow
            to="/aeon/practice"
            kind="aeon"
            title={t("hub.modeAeon")}
            detail={`${t("hub.modeAeonHint")} · ${packStatus(locale, aeonPack.state)}`}
            disabled={!online && aeonPack.state !== "ready"}
          />
        </div>
      </section>

      <section className="hub-block" aria-labelledby="hub-this-week">
        <header className="hub-block-head">
          <h2 id="hub-this-week">{t("hub.thisWeek")}</h2>
          <p>{t("hub.beijingTime")}</p>
        </header>
        <ol className="hub-week">
          {weekKeys.map((key, index) => {
            const entry = history.get(key) ?? null;
            const isToday = key === todayKey;
            const won = entry?.result === "won";
            return (
              <li className={`hub-week-day${isToday ? " is-today" : ""}`} key={key}>
                <span className="hub-week-name">
                  {isToday ? t("hub.today") : t(`hub.weekday.${WEEKDAY_KEYS[index]}`)}
                </span>
                <strong className="num">
                  {entry
                    ? won
                      ? `${entry.guesses}/${DAILY_ATTEMPTS}`
                      : `X/${DAILY_ATTEMPTS}`
                    : "—"}
                </strong>
                <span className="hub-week-bars" aria-hidden="true">
                  {Array.from({ length: DAILY_ATTEMPTS }, (_, bar) => (
                    <i key={bar} className={won && bar < entry.guesses ? "is-on" : undefined} />
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="station-status" aria-label={t("hub.stationStatus")}>
        <div>
          <Clock3 size={16} aria-hidden="true" />
          <span>{t("hub.nextReset")}</span>
          <strong className="num">{countdown}</strong>
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
