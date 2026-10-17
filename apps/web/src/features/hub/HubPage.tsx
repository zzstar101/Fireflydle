import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return (
    document.documentElement.dataset.motion === "reduced" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** 原型 countUp：power2.out 从当前值滚到目标值；首次进入总站时延迟 0.4s（hubIntro 时间轴位置）。 */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const shown = useRef(0);
  const first = useRef(true);
  const format = (v: number) =>
    v.toLocaleString("en", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = shown.current;
    const to = value;
    const delay = first.current ? 400 : 0;
    first.current = false;
    if (prefersReducedMotion() || from === to) {
      shown.current = to;
      node.textContent = format(to);
      return;
    }
    const duration = 1200;
    let raf = 0;
    const start = performance.now() + delay;
    const step = (time: number) => {
      const p = Math.min(1, Math.max(0, (time - start) / duration));
      const eased = 1 - (1 - p) ** 3;
      shown.current = from + (to - from) * eased;
      node.textContent = format(shown.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, decimals]);
  return (
    <dd className="num" ref={ref} aria-label={format(value)}>
      {format(0)}
    </dd>
  );
}

/** 原型 #headline：逐字拆成 .ch > span，入场时 yPercent 110 → 0，stagger 0.05s。 */
function SplitHeadline({ text, id }: { text: string; id: string }) {
  return (
    <h1 id={id} className="hub-headline" aria-label={text}>
      {Array.from(text).map((ch, index) => (
        <span className="ch" aria-hidden="true" key={`${index}-${ch}`}>
          <span style={{ "--i": index } as CSSProperties}>{ch}</span>
        </span>
      ))}
    </h1>
  );
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
  weeklyDone,
  disabled = false,
}: {
  mode: string;
  kind: ModeArtKind;
  to: string;
  badge: string;
  title: string;
  description: string;
  metric: ReactNode;
  weeklyDone?: number;
  disabled?: boolean;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const body = (
    <>
      <span className="mode-board-badge">{badge}</span>
      <span className="mode-board-art" aria-hidden="true">
        <ModeArt kind={kind} weeklyDone={weeklyDone} />
      </span>
      <strong className="mode-board-title">{title}</strong>
      <span className="mode-board-description">{description}</span>
      <span className="mode-board-foot">
        <span className="mode-board-metric">{metric}</span>
        <span className="mode-board-go" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
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
      <span className="hub-secondary-text">
        <strong>{title}</strong>
        <span className="hub-secondary-detail">{detail}</span>
      </span>
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
  const heroRef = useRef<HTMLElement | null>(null);
  const markRef = useRef<HTMLDivElement | null>(null);
  useHeroStarfield({ markRef, heroRef, text: brand });

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
      {/* 原型 .hero：min-height 100svh + grid-template-rows 1fr auto。
          第一行是粒子字的舞台（原型 .hero-mark），第二行是文案与 CTA（原型 .hero-foot）。 */}
      <section className="hub-hero" aria-labelledby="hub-title" ref={heroRef}>
        {/* 粒子字由 fx 层画在画布上，这里只保留舞台尺寸。
            降级（?nogl / 减少动效）时用 DOM 文字顶上，否则首屏只剩一片空白。 */}
        <div className="hub-hero-mark" ref={markRef}>
          <span className="hub-hero-brand" aria-hidden="true">
            {brand}
          </span>
        </div>
        <div className="hub-hero-foot">
          <div className="hub-hero-copy">
            <span className="chip lit hub-badge intro" style={{ "--i": 0 } as CSSProperties}>
              <i aria-hidden="true" />
              <span>
                {t("hub.dailyIssue", { number: issue })}
                <span className="hub-badge-sep" aria-hidden="true">
                  ·
                </span>
                {dailyStatus}
              </span>
            </span>
            <SplitHeadline id="hub-title" text={t("hub.heroTitle")} />
            <p className="hub-hero-intro intro" style={{ "--i": 1 } as CSSProperties}>
              <Trans
                i18nKey="hub.heroIntro"
                values={{ attempts, time: countdown }}
                components={{ time: <b className="num" /> }}
              />
            </p>
          </div>
          <div className="hub-hero-act">
            <dl className="hub-metrics intro" style={{ "--i": 2 } as CSSProperties}>
              <div>
                <dt>{t("hub.metricStreak")}</dt>
                <CountUp value={stats.data?.currentStreak ?? 0} />
              </div>
              <div>
                <dt>{t("hub.metricSolvedToday")}</dt>
                <CountUp value={stats.data?.todayCompletions ?? 0} />
              </div>
              <div>
                <dt>{t("hub.metricAverage")}</dt>
                <CountUp value={stats.data?.averageGuesses ?? 0} decimals={1} />
              </div>
            </dl>
            {/* 原型 .yday：small 标签 + b 主信息 + em 补充；API 没有"昨日答案"，这里展示自己的昨日战绩 */}
            <p className="hub-yesterday intro" style={{ "--i": 3 } as CSSProperties}>
              <span>
                <small>{t("hub.yesterday")}</small>
                <b>
                  {yesterday ? formatDateLabel(locale, yesterday.dateKey) : t("hub.yesterdayEmpty")}
                </b>
              </span>
              {yesterday ? (
                <em>
                  {" · "}
                  {yesterday.result === "won"
                    ? t("hub.yesterdaySolved", { guesses: yesterday.guesses })
                    : t("hub.yesterdayFailed")}
                </em>
              ) : null}
            </p>
            <Link
              className="btn btn-lit hub-cta intro"
              style={{ "--i": 4 } as CSSProperties}
              to={dailyHref}
            >
              {dailyAction}
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="hub-scroll-cue" aria-hidden="true">
          <span>{t("hub.moreWaysCue")}</span>
          <i />
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
            weeklyDone={(weeklyRun?.correctCount ?? 0) + (weeklyRun?.failedCount ?? 0)}
            metric={t("hub.weekProgress", {
              done: (weeklyRun?.correctCount ?? 0) + (weeklyRun?.failedCount ?? 0),
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
              <li
                className={`hub-week-day${isToday ? " is-today" : ""}${entry && !won ? " is-lost" : ""}`}
                key={key}
              >
                <span className="hub-week-labels">
                  <span>{t(`hub.weekday.${WEEKDAY_KEYS[index]}`)}</span>
                  <span>{isToday ? t("hub.today") : ""}</span>
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
    </main>
  );
}
