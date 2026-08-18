import { describe, expect, it } from "vitest";
import { motionModeFromPreference, motionPausedForPage } from "./motion";

describe("动效运行时状态", () => {
  it("将系统低动态偏好映射为 reduced 模式", () => {
    expect(motionModeFromPreference(false)).toBe("full");
    expect(motionModeFromPreference(true)).toBe("reduced");
  });

  it("页面隐藏或失焦时暂停循环信号", () => {
    expect(motionPausedForPage(true, true)).toBe(false);
    expect(motionPausedForPage(false, true)).toBe(true);
    expect(motionPausedForPage(true, false)).toBe(true);
  });
});
