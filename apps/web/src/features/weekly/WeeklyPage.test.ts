import { describe, expect, it } from "vitest";
import { weeklyModeLabel, weeklyModePath } from "./WeeklyPage";

describe("四模式周赛入口", () => {
  it.each([
    ["playable", "/playable/weekly", "普通角色"],
    ["npc", "/npc/weekly", "NPC"],
    ["currency-wars", "/currency-wars/weekly", "货币战争"],
    ["aeon", "/aeon/weekly", "星神"],
  ] as const)("%s 保留 modeId 路径契约", (modeId, path, label) => {
    expect(weeklyModePath(modeId)).toBe(path);
    expect(weeklyModeLabel(modeId, "zh-CN")).toBe(label);
  });
});
