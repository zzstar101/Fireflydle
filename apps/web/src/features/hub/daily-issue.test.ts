import { describe, expect, it } from "vitest";
import {
  beijingDateKey,
  beijingDaysLeftInWeek,
  beijingWeekKeys,
  dailyIssueNumber,
  formatCountdown,
  millisecondsUntilBeijingMidnight,
} from "./daily-issue";

describe("beijingDateKey", () => {
  it("按 UTC+8 切日期，北京 0 点是分界", () => {
    expect(beijingDateKey(Date.parse("2026-10-11T15:59:59.999Z"))).toBe("2026-10-11");
    expect(beijingDateKey(Date.parse("2026-10-11T16:00:00.000Z"))).toBe("2026-10-12");
  });

  it("不受本机时区影响", () => {
    expect(beijingDateKey(0)).toBe("1970-01-01");
  });
});

describe("dailyIssueNumber", () => {
  it("锚点当天是第 1 期", () => {
    expect(dailyIssueNumber("2026-08-17")).toBe(1);
  });

  it("逐日递增，跨月跨年也对", () => {
    expect(dailyIssueNumber("2026-08-18")).toBe(2);
    expect(dailyIssueNumber("2026-10-12")).toBe(57);
    expect(dailyIssueNumber("2027-01-01")).toBe(138);
  });
});

describe("beijingWeekKeys", () => {
  it("返回周一到周日的 7 个连续日期键", () => {
    const keys = beijingWeekKeys(Date.parse("2026-10-14T04:00:00.000Z"));
    expect(keys).toHaveLength(7);
    expect(new Date(`${keys[0]}T00:00:00.000Z`).getUTCDay()).toBe(1);
    expect(new Date(`${keys[6]}T00:00:00.000Z`).getUTCDay()).toBe(0);
    for (let index = 1; index < keys.length; index += 1) {
      const gap =
        Date.parse(`${keys[index]}T00:00:00.000Z`) - Date.parse(`${keys[index - 1]}T00:00:00.000Z`);
      expect(gap).toBe(24 * 60 * 60 * 1_000);
    }
  });

  it("本周一定包含今天", () => {
    const timestamps = [
      Date.parse("2026-10-12T00:30:00.000Z"), // 北京时间周一上午
      Date.parse("2026-10-18T15:30:00.000Z"), // 北京时间周日深夜
      Date.parse("2027-01-01T03:00:00.000Z"),
    ];
    for (const timestamp of timestamps) {
      expect(beijingWeekKeys(timestamp)).toContain(beijingDateKey(timestamp));
    }
  });
});

describe("beijingDaysLeftInWeek", () => {
  it("周一为 6，周日为 0", () => {
    // 2026-10-12 是周一，2026-10-18 是周日。
    expect(beijingDaysLeftInWeek(Date.parse("2026-10-12T04:00:00.000Z"))).toBe(6);
    expect(beijingDaysLeftInWeek(Date.parse("2026-10-14T04:00:00.000Z"))).toBe(4);
    expect(beijingDaysLeftInWeek(Date.parse("2026-10-18T04:00:00.000Z"))).toBe(0);
  });

  it("跨北京 0 点时递减", () => {
    // 北京 2026-10-17 23:59 仍是周六，0 点后进入周日。
    expect(beijingDaysLeftInWeek(Date.parse("2026-10-17T15:59:00.000Z"))).toBe(1);
    expect(beijingDaysLeftInWeek(Date.parse("2026-10-17T16:01:00.000Z"))).toBe(0);
  });
});

describe("millisecondsUntilBeijingMidnight", () => {
  it("在整点前给出到北京 0 点的时间", () => {
    const before = Date.parse("2026-10-11T15:59:00.000Z"); // 北京 23:59
    expect(millisecondsUntilBeijingMidnight(before)).toBe(60_000);
  });

  it("刚过 0 点时给出接近一整天", () => {
    const justAfter = Date.parse("2026-10-11T16:00:01.000Z"); // 北京 00:00:01
    expect(millisecondsUntilBeijingMidnight(justAfter)).toBe(24 * 60 * 60 * 1_000 - 1_000);
  });
});

describe("formatCountdown", () => {
  it("分钟级省略小时位", () => {
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(65_000)).toBe("01:05");
    expect(formatCountdown(3_599_000)).toBe("59:59");
  });

  it("超过一小时带上小时位", () => {
    // 小时位同样补零，对齐设计稿里的 `02:53:55`
    expect(formatCountdown(3_600_000)).toBe("01:00:00");
    expect(formatCountdown(45_296_000)).toBe("12:34:56");
  });

  it("负数按 0 处理", () => {
    expect(formatCountdown(-5_000)).toBe("00:00");
  });
});
