import { describe, expect, it } from "vitest";
import { isOnlineActivityAllowed } from "./network-status";

describe("离线活动边界", () => {
  it("离线仅允许四种内容模式的本地练习", () => {
    expect(isOnlineActivityAllowed(false, "practice")).toBe(true);
    expect(isOnlineActivityAllowed(false, "daily")).toBe(false);
    expect(isOnlineActivityAllowed(false, "endless")).toBe(false);
    expect(isOnlineActivityAllowed(false, "duel")).toBe(false);
  });

  it("在线时不限制既有活动", () => {
    expect(isOnlineActivityAllowed(true, "daily")).toBe(true);
    expect(isOnlineActivityAllowed(true, "duel")).toBe(true);
  });
});
