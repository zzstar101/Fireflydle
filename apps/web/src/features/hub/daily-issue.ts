/**
 * 总站首页要用的纯日期计算：每日题期号、北京时间的本周日期键、已过去的秒数。
 *
 * 约定：日期键统一是北京时间的 `YYYY-MM-DD`，在 UTC 毫秒轴上做加减（日期键没有时区，
 * 这样加减是精确的），只在「当前时刻 → 日期键」这一步加 8 小时偏移。
 */

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;

/**
 * 每日题的期号锚点：第 1 期就是这一天。
 *
 * 与 `packages/game-engine` 里周赛轮换使用的锚点（2026-08-17 +08:00）保持同一天，
 * 这样「每日 #N」和「本周是哪个模式」在同一个上线口径上。
 */
export const DAILY_ISSUE_EPOCH = "2026-08-17";

/** 北京时间的日期键。 */
export function beijingDateKey(timestamp: number = Date.now()): string {
  return new Date(timestamp + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}

/** 把日期键当作 UTC 零点解析，避免本机时区影响天数差。 */
function dateKeyToMs(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00.000Z`);
}

function shiftDateKey(dateKey: string, days: number): string {
  return new Date(dateKeyToMs(dateKey) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 期号从 1 开始；锚点当天是 #1，早于锚点也会得到正数（上线前预览用）。 */
export function dailyIssueNumber(dateKey: string): number {
  const days = Math.round((dateKeyToMs(dateKey) - dateKeyToMs(DAILY_ISSUE_EPOCH)) / DAY_MS);
  return days + 1;
}

/** 北京时间本周（周一 → 周日）的 7 个日期键。 */
export function beijingWeekKeys(timestamp: number = Date.now()): string[] {
  const today = beijingDateKey(timestamp);
  // getUTCDay: 0 = 周日，这里换算成「距离本周一过了几天」
  const sinceMonday = (new Date(dateKeyToMs(today)).getUTCDay() + 6) % 7;
  const monday = shiftDateKey(today, -sinceMonday);
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(monday, index));
}

/** 北京时间本周还剩几天（周日为 0）。 */
export function beijingDaysLeftInWeek(timestamp: number = Date.now()): number {
  const today = beijingDateKey(timestamp);
  const index = beijingWeekKeys(timestamp).indexOf(today);
  return Math.max(0, 6 - index);
}

/** 距离下一个北京时间 0 点的毫秒数。 */
export function millisecondsUntilBeijingMidnight(timestamp: number = Date.now()): number {
  const tomorrow = shiftDateKey(beijingDateKey(timestamp), 1);
  return Math.max(0, dateKeyToMs(tomorrow) - BEIJING_OFFSET_MS - timestamp);
}

/** 秒 → `mm:ss` 或 `h:mm:ss`。 */
export function formatCountdown(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .slice(hours > 0 ? 0 : 1)
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}
