import { describe, expect, it } from "vitest";
import type { WeeklyRun } from "@fireflydle/contracts";
import { getWeeklyRoundTransition, weeklyModeLabel, weeklyModePath } from "./WeeklyPage";

describe("三种模式周赛入口", () => {
  it.each([
    ["playable", "/playable/weekly", "普通角色"],
    ["currency-wars", "/currency-wars/weekly", "货币战争"],
    ["aeon", "/aeon/weekly", "星神"],
  ] as const)("%s 保留 modeId 路径契约", (modeId, path, label) => {
    expect(weeklyModePath(modeId)).toBe(path);
    expect(weeklyModeLabel(modeId, "zh-CN")).toBe(label);
  });
});

describe("周赛题间过渡", () => {
  const run = (gameId: string, gameCount: number, status: WeeklyRun["status"] = "active") =>
    ({
      status,
      games: Array.from({ length: gameCount }, (_, index) => ({
        id: index === gameCount - 1 ? gameId : `finished-${index}`,
      })),
      currentGame: status === "active" ? { id: gameId } : null,
    }) as WeeklyRun;

  it("服务端切换到下一题时生成明确题间状态", () => {
    expect(getWeeklyRoundTransition(run("game-1", 1), run("game-2", 2))).toEqual({
      completedQuestion: 1,
      nextQuestion: 2,
    });
  });

  it("同一题更新或周赛完成时不插入过渡", () => {
    expect(getWeeklyRoundTransition(run("game-1", 1), run("game-1", 1))).toBeNull();
    expect(getWeeklyRoundTransition(run("game-5", 5), run("game-5", 5, "completed"))).toBeNull();
  });
});
