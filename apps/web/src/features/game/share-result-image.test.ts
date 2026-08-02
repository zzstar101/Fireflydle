import { describe, expect, it } from "vitest";
import type { GuessResult } from "@fireflydle/contracts";
import { buildShareCardModel } from "./share-result-image";

const guesses = [
  {
    character: { names: { "zh-CN": "不应出现的答案", en: "Hidden", ja: "非表示" } },
    cells: [
      { field: "element", state: "exact", direction: "none" },
      { field: "path", state: "close", direction: "none" },
      { field: "rarity", state: "miss", direction: "none" },
      { field: "faction", state: "miss", direction: "none" },
      { field: "version", state: "close", direction: "higher" },
    ],
  },
] as unknown as GuessResult[];

describe("结果分享图片", () => {
  it("把每次猜测的本地化角色名称、头像与判定状态写入卡片模型", () => {
    const model = buildShareCardModel({
      locale: "zh-CN",
      mode: "daily",
      dateKey: "2026-08-02",
      difficulty: "standard",
      guesses,
      maxAttempts: 6,
      won: true,
      elapsedMs: 83_000,
      siteUrl: "https://fireflydle.games/",
    });

    expect(model).toMatchObject({
      brand: "萤一把",
      mode: "每日一题",
      date: "2026.08.02",
      status: "猜中",
      attempts: "1 / 6",
      time: "01:23",
      difficulty: "标准",
      site: "fireflydle.games",
      qrUrl: "https://fireflydle.games/",
      guesses: [
        {
          name: "不应出现的答案",
          avatarPath: undefined,
          cells: ["exact", "close", "miss", "miss", "close"],
        },
      ],
    });
  });
});
