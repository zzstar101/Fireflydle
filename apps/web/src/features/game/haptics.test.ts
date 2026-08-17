import { describe, expect, it, vi } from "vitest";
import { triggerGameHaptic } from "./haptics";

describe("普通角色触觉反馈", () => {
  it.each([
    ["submit", 10],
    ["win", [14, 24, 18]],
    ["life-lost", 18],
  ] as const)("在 %s 时只发出对应的短触觉", (event, pattern) => {
    const vibrate = vi.fn(() => true);

    expect(triggerGameHaptic(event, { vibrate })).toBe(true);
    expect(vibrate).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenCalledWith(pattern);
  });

  it("设备不支持或拒绝触觉时静默跳过", () => {
    expect(triggerGameHaptic("submit", undefined)).toBe(false);
    expect(
      triggerGameHaptic("win", {
        vibrate: () => {
          throw new Error("not allowed");
        },
      }),
    ).toBe(false);
  });
});
