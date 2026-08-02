import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Cloud,
  Gamepad2,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { Locale } from "@fireflydle/contracts";
import { apiRequest } from "../../api/client";

type LatencyRange = "1h" | "24h" | "7d";
type TrendDays = 7 | 30;

interface OperationsOverview {
  generatedAt: string;
  timezone: "Asia/Shanghai";
  audience: {
    registeredTotal: number;
    registeredToday: number;
    guestActiveToday: number;
    guestTotal: number;
    visitsToday: number;
    registeredDau: number;
    guestDau: number;
    dau: number;
  };
  live: {
    onlineFiveMinutes: number | null;
    onlineRegistered: number | null;
    onlineGuests: number | null;
    activeSoloGames: number;
    activeMatches: number;
    matchmakingWaiting: number;
    matchmakingReserved: number;
  };
  gameplay: {
    startedToday: number;
    completedToday: number;
    interruptedToday: number;
    completionRate: number;
  };
  accountFlows: {
    registerSuccess: number;
    registerFailure: number;
    emailSendSuccess: number;
    emailSendFailure: number;
    verificationSuccess: number;
    verificationFailure: number;
    loginSuccess: number;
    loginFailure: number;
  };
  api: {
    configured: boolean;
    available: boolean;
    range: LatencyRange;
    requests: number;
    successRate: number;
    clientErrorRate: number;
    serverErrorRate: number;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    endpoints: Array<{
      route: string;
      method: string;
      requests: number;
      p50Ms: number;
      p95Ms: number;
      p99Ms: number;
      serverErrors: number;
    }>;
    error: string | null;
  };
  trends: Array<{
    date: string;
    visits: number;
    dau: number;
    registeredDau: number;
    guestDau: number;
    registrations: number;
    gamesStarted: number;
    gamesCompleted: number;
    completionRate: number;
  }>;
  cloudflare: {
    configured: boolean;
    available: boolean;
    fetchedAt: string | null;
    resetAt: string;
    quotas: Array<{
      id: string;
      label: string;
      used: number;
      limit: number;
      percent: number;
      unit: "requests" | "ms" | "rows" | "bytes";
    }>;
    error: string | null;
  };
  alerts: Array<{
    id: string;
    kind: string;
    severity: "warning" | "critical";
    status: "active" | "recovered";
    title: string;
    message: string;
    startedAt: string;
    lastSeenAt: string;
    recoveredAt: string | null;
    occurrences: number;
  }>;
  recentErrors: Array<{
    id: string;
    occurredAt: string;
    method: string;
    route: string;
    statusCode: number;
    errorCode: string;
    requestId: string;
  }>;
}

function number(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function latency(value: number | null): string {
  if (value === null) return "--";
  return value >= 1_000 ? `${(value / 1_000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

function quotaValue(value: number, unit: "requests" | "ms" | "rows" | "bytes", locale: Locale) {
  if (unit === "bytes") {
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
    return `${(value / 1024 ** 2).toFixed(1)} MB`;
  }
  if (unit === "ms") return `${value.toFixed(2)} ms`;
  return number(Math.round(value), locale);
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="ops-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

const chartSeries = [
  { key: "visits", color: "#79d7e8", zh: "访问", en: "Visits" },
  { key: "dau", color: "#d8b66b", zh: "DAU", en: "DAU" },
  { key: "gamesStarted", color: "#86cf9b", zh: "开始", en: "Started" },
  { key: "gamesCompleted", color: "#ee8b8f", zh: "完成", en: "Completed" },
] as const;

function TrendChart({ data, locale }: { data: OperationsOverview["trends"]; locale: Locale }) {
  const width = 760;
  const height = 250;
  const padding = { top: 18, right: 18, bottom: 34, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...data.flatMap((row) => chartSeries.map((item) => row[item.key])));
  const x = (index: number) =>
    padding.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / max) * plotHeight;
  const labels =
    data.length <= 7
      ? data
      : data.filter((_, index) => index % 5 === 0 || index === data.length - 1);
  return (
    <div className="ops-chart-wrap">
      <div className="ops-chart-legend" aria-hidden="true">
        {chartSeries.map((item) => (
          <span key={item.key}>
            <i style={{ backgroundColor: item.color }} />
            {locale === "zh-CN" ? item.zh : item.en}
          </span>
        ))}
      </div>
      <svg
        className="ops-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={locale === "zh-CN" ? "业务指标趋势图" : "Business metrics trend chart"}
      >
        {[0, 0.5, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + ratio * plotHeight}
              y2={padding.top + ratio * plotHeight}
              className="ops-chart-grid"
            />
            <text x={padding.left - 9} y={padding.top + ratio * plotHeight + 4} textAnchor="end">
              {Math.round(max * (1 - ratio))}
            </text>
          </g>
        ))}
        {chartSeries.map((series) => (
          <polyline
            key={series.key}
            points={data.map((row, index) => `${x(index)},${y(row[series.key])}`).join(" ")}
            fill="none"
            stroke={series.color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {labels.map((row) => {
          const index = data.indexOf(row);
          return (
            <text key={row.date} x={x(index)} y={height - 10} textAnchor="middle">
              {row.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof Activity;
  title: string;
  meta?: string;
}) {
  return (
    <header className="ops-section-title">
      <Icon size={17} />
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </header>
  );
}

export function OperationsPanel({ locale }: { locale: Locale }) {
  const [range, setRange] = useState<LatencyRange>("24h");
  const [trendDays, setTrendDays] = useState<TrendDays>(7);
  const overview = useQuery({
    queryKey: ["admin", "operations", range, trendDays],
    queryFn: () =>
      apiRequest<OperationsOverview>(`/admin/operations?range=${range}&trend=${trendDays}`),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  if (overview.isPending) {
    return (
      <div className="ops-loading">
        {locale === "zh-CN" ? "正在读取运维指标…" : "Loading operations data…"}
      </div>
    );
  }
  if (!overview.data) {
    return (
      <div className="ops-unavailable">
        <ShieldAlert size={28} />
        <strong>{locale === "zh-CN" ? "概览暂时不可用" : "Overview unavailable"}</strong>
        <button className="ticket-button-secondary" onClick={() => overview.refetch()}>
          <RefreshCw size={15} /> {locale === "zh-CN" ? "重试" : "Retry"}
        </button>
      </div>
    );
  }

  const data = overview.data;
  const activeAlerts = data.alerts.filter((alert) => alert.status === "active");
  return (
    <div className="ops-dashboard">
      <header className="ops-toolbar">
        <div>
          <strong>
            {activeAlerts.length > 0 ? `${activeAlerts.length} ACTIVE` : "SYSTEM NORMAL"}
          </strong>
          <span>{new Date(data.generatedAt).toLocaleString(locale)}</span>
        </div>
        <button
          className="icon-button"
          onClick={() => overview.refetch()}
          disabled={overview.isFetching}
          title={locale === "zh-CN" ? "刷新指标" : "Refresh metrics"}
          aria-label={locale === "zh-CN" ? "刷新指标" : "Refresh metrics"}
        >
          <RefreshCw size={17} className={overview.isFetching ? "spin" : undefined} />
        </button>
      </header>

      {activeAlerts.length > 0 ? (
        <div className="ops-active-alerts">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={alert.severity}>
              <AlertTriangle size={17} />
              <span>
                <strong>{alert.title}</strong>
                <small>{alert.message}</small>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <section className="ops-section">
        <SectionTitle
          icon={UsersRound}
          title={locale === "zh-CN" ? "用户与访问" : "Users and traffic"}
        />
        <div className="ops-metric-grid ops-metric-grid-primary">
          <Metric
            label="DAU"
            value={number(data.audience.dau, locale)}
            detail={`${locale === "zh-CN" ? "注册" : "Registered"} ${number(data.audience.registeredDau, locale)} · ${locale === "zh-CN" ? "访客" : "Guests"} ${number(data.audience.guestDau, locale)}`}
          />
          <Metric
            label={locale === "zh-CN" ? "今日访问" : "Visits today"}
            value={number(data.audience.visitsToday, locale)}
            detail={locale === "zh-CN" ? "30 分钟会话" : "30-minute sessions"}
          />
          <Metric
            label={locale === "zh-CN" ? "注册用户" : "Registered users"}
            value={number(data.audience.registeredTotal, locale)}
            detail={`${locale === "zh-CN" ? "今日新增" : "New today"} +${number(data.audience.registeredToday, locale)}`}
          />
          <Metric
            label={locale === "zh-CN" ? "今日活跃访客" : "Active guests"}
            value={number(data.audience.guestActiveToday, locale)}
            detail={`${locale === "zh-CN" ? "累计访客" : "All-time guests"} ${number(data.audience.guestTotal, locale)}`}
          />
          <Metric
            label={locale === "zh-CN" ? "近 5 分钟在线" : "Online, 5 min"}
            value={
              data.live.onlineFiveMinutes === null
                ? "--"
                : number(data.live.onlineFiveMinutes, locale)
            }
            detail={
              data.live.onlineRegistered === null
                ? locale === "zh-CN"
                  ? "等待 Analytics 数据"
                  : "Waiting for analytics"
                : `${locale === "zh-CN" ? "注册" : "Registered"} ${data.live.onlineRegistered} · ${locale === "zh-CN" ? "访客" : "Guests"} ${data.live.onlineGuests ?? 0}`
            }
          />
          <Metric
            label={locale === "zh-CN" ? "今日完成率" : "Completion rate"}
            value={percent(data.gameplay.completionRate)}
            detail={`${number(data.gameplay.completedToday, locale)} / ${number(data.gameplay.startedToday, locale)}`}
          />
        </div>
      </section>

      <section className="ops-section">
        <SectionTitle icon={Activity} title={locale === "zh-CN" ? "业务趋势" : "Business trend"} />
        <div
          className="segmented-control ops-range-control"
          aria-label={locale === "zh-CN" ? "趋势范围" : "Trend range"}
        >
          {([7, 30] as const).map((days) => (
            <button
              key={days}
              className={trendDays === days ? "active" : undefined}
              onClick={() => setTrendDays(days)}
            >
              {days}D
            </button>
          ))}
        </div>
        <TrendChart data={data.trends} locale={locale} />
      </section>

      <section className="ops-section">
        <SectionTitle icon={Gamepad2} title={locale === "zh-CN" ? "实时业务" : "Live activity"} />
        <div className="ops-live-grid">
          <Metric
            label={locale === "zh-CN" ? "进行中答题" : "Active solo"}
            value={number(data.live.activeSoloGames, locale)}
            detail={locale === "zh-CN" ? "每日与随机" : "Daily and random"}
          />
          <Metric
            label={locale === "zh-CN" ? "进行中对局" : "Active matches"}
            value={number(data.live.activeMatches, locale)}
            detail={locale === "zh-CN" ? "多人房间" : "Multiplayer rooms"}
          />
          <Metric
            label={locale === "zh-CN" ? "匹配队列" : "Matchmaking queue"}
            value={number(data.live.matchmakingWaiting, locale)}
            detail={`${locale === "zh-CN" ? "配对中" : "Reserved"} ${number(data.live.matchmakingReserved, locale)}`}
          />
          <Metric
            label={locale === "zh-CN" ? "今日中断" : "Interrupted today"}
            value={number(data.gameplay.interruptedToday, locale)}
            detail={
              locale === "zh-CN"
                ? "认输、过期、掉线或离开"
                : "Conceded, expired, disconnected or left"
            }
          />
        </div>
      </section>

      <section className="ops-section">
        <SectionTitle icon={Clock3} title={locale === "zh-CN" ? "API 响应" : "API response"} />
        <div
          className="segmented-control ops-range-control"
          aria-label={locale === "zh-CN" ? "延迟范围" : "Latency range"}
        >
          {(["1h", "24h", "7d"] as const).map((item) => (
            <button
              key={item}
              className={range === item ? "active" : undefined}
              onClick={() => setRange(item)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        {!data.api.available ? <p className="ops-inline-notice">{data.api.error}</p> : null}
        <div className="ops-live-grid">
          <Metric
            label="P50"
            value={latency(data.api.p50Ms)}
            detail={locale === "zh-CN" ? "典型响应" : "Typical response"}
          />
          <Metric
            label="P95"
            value={latency(data.api.p95Ms)}
            detail={locale === "zh-CN" ? "慢请求边界" : "Slow request edge"}
          />
          <Metric
            label="P99"
            value={latency(data.api.p99Ms)}
            detail={locale === "zh-CN" ? "尾延迟" : "Tail latency"}
          />
          <Metric
            label={locale === "zh-CN" ? "成功率" : "Success rate"}
            value={percent(data.api.successRate)}
            detail={`${number(data.api.requests, locale)} ${locale === "zh-CN" ? "次请求" : "requests"}`}
          />
        </div>
        {data.api.endpoints.length > 0 ? (
          <div className="admin-table-wrap ops-table-wrap">
            <table className="admin-table ops-endpoint-table">
              <thead>
                <tr>
                  <th>ENDPOINT</th>
                  <th>REQUESTS</th>
                  <th>P50</th>
                  <th>P95</th>
                  <th>P99</th>
                  <th>5XX</th>
                </tr>
              </thead>
              <tbody>
                {data.api.endpoints.map((endpoint) => (
                  <tr key={`${endpoint.method}-${endpoint.route}`}>
                    <td>
                      <span className="ops-route">
                        <b>{endpoint.method}</b>
                        <code>{endpoint.route}</code>
                      </span>
                    </td>
                    <td>{number(endpoint.requests, locale)}</td>
                    <td>{latency(endpoint.p50Ms)}</td>
                    <td>{latency(endpoint.p95Ms)}</td>
                    <td>{latency(endpoint.p99Ms)}</td>
                    <td className={endpoint.serverErrors > 0 ? "ops-danger" : undefined}>
                      {endpoint.serverErrors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="ops-section ops-two-column">
        <div>
          <SectionTitle
            icon={UserRoundCheck}
            title={locale === "zh-CN" ? "账号流程" : "Account flows"}
          />
          <div className="ops-flow-list">
            {[
              [
                locale === "zh-CN" ? "注册" : "Registration",
                data.accountFlows.registerSuccess,
                data.accountFlows.registerFailure,
              ],
              [
                locale === "zh-CN" ? "验证邮件" : "Verification email",
                data.accountFlows.emailSendSuccess,
                data.accountFlows.emailSendFailure,
              ],
              [
                locale === "zh-CN" ? "邮箱验证" : "Email verification",
                data.accountFlows.verificationSuccess,
                data.accountFlows.verificationFailure,
              ],
              [
                locale === "zh-CN" ? "登录" : "Login",
                data.accountFlows.loginSuccess,
                data.accountFlows.loginFailure,
              ],
            ].map(([label, success, failure]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <strong>{success}</strong>
                <small>{failure} FAILED</small>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle
            icon={Cloud}
            title="Cloudflare"
            meta={locale === "zh-CN" ? "免费额度 · UTC 重置" : "Free quota · UTC reset"}
          />
          {!data.cloudflare.available ? (
            <p className="ops-inline-notice">{data.cloudflare.error}</p>
          ) : null}
          <div className="ops-quota-list">
            {data.cloudflare.quotas.map((item) => (
              <div key={item.id}>
                <span>
                  <strong>{item.label}</strong>
                  <small>
                    {quotaValue(item.used, item.unit, locale)} /{" "}
                    {quotaValue(item.limit, item.unit, locale)}
                  </small>
                </span>
                <div>
                  <i
                    className={item.percent >= 0.8 ? "warning" : undefined}
                    style={{ width: `${Math.min(100, item.percent * 100)}%` }}
                  />
                </div>
                <b>{percent(item.percent)}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ops-section">
        <SectionTitle
          icon={ShieldAlert}
          title={locale === "zh-CN" ? "预警历史" : "Alert history"}
          meta={locale === "zh-CN" ? "最近 7 天" : "Last 7 days"}
        />
        {data.alerts.length === 0 ? (
          <p className="ops-empty">{locale === "zh-CN" ? "没有预警记录" : "No alert history"}</p>
        ) : (
          <div className="ops-alert-history">
            {data.alerts.map((alert) => (
              <div key={alert.id}>
                <span className={`${alert.status} ${alert.severity}`}>
                  {alert.status.toUpperCase()}
                </span>
                <strong>{alert.title}</strong>
                <small>
                  {new Date(alert.lastSeenAt).toLocaleString(locale)} · {alert.occurrences}×
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ops-section">
        <SectionTitle
          icon={AlertTriangle}
          title={locale === "zh-CN" ? "最近错误" : "Recent errors"}
          meta={locale === "zh-CN" ? "脱敏事件 · 最近 100 条" : "Sanitized · Latest 100"}
        />
        {data.recentErrors.length === 0 ? (
          <p className="ops-empty">{locale === "zh-CN" ? "没有错误事件" : "No error events"}</p>
        ) : (
          <div className="admin-table-wrap ops-table-wrap">
            <table className="admin-table ops-errors-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>STATUS</th>
                  <th>ENDPOINT</th>
                  <th>ERROR</th>
                  <th>REQUEST ID</th>
                </tr>
              </thead>
              <tbody>
                {data.recentErrors.map((error) => (
                  <tr key={error.id}>
                    <td>{new Date(error.occurredAt).toLocaleString(locale)}</td>
                    <td className={error.statusCode >= 500 ? "ops-danger" : undefined}>
                      {error.statusCode}
                    </td>
                    <td>
                      <code>
                        {error.method} {error.route}
                      </code>
                    </td>
                    <td>
                      <code>{error.errorCode}</code>
                    </td>
                    <td>
                      <code>{error.requestId}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
