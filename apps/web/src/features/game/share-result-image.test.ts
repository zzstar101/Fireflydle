import { describe, expect, it } from "vitest";
import type { FieldDefinition, GuessResult } from "@fireflydle/contracts";
import { buildShareCardModel } from "./share-result-image";

const guesses = [
  {
    character: { names: { "zh-CN": "不应出现的答案", en: "Hidden", ja: "非表示" } },
    cells: [
      { field: "element", state: "exact", direction: "none" },
      { field: "path", state: "close", direction: "none" },
      { field: "rarity", state: "miss", direction: "none" },
      { field: "faction", state: "miss", direction: "none" },
      { field: "region", state: "exact", direction: "none" },
      { field: "version", state: "close", direction: "higher" },
    ],
  },
] as unknown as GuessResult[];

describe("结果分享图片", () => {
  it("分享卡只包含猜测序号和判定状态，不包含答案身份", () => {
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
          name: "#01",
          cells: ["exact", "close", "miss", "miss", "exact", "close"],
        },
      ],
    });
    expect(model.fields).toEqual(["属性", "命途", "稀有度", "派系", "地区", "版本"]);
    expect(JSON.stringify(model)).not.toContain("不应出现的答案");
    expect(JSON.stringify(model)).not.toContain("Hidden");
  });

  it("按对局字段快照排列标题和反馈格", () => {
    const fieldDefinitions: FieldDefinition[] = [
      {
        id: "version",
        label: { "zh-CN": "快照版本", en: "Snapshot version", ja: "スナップ版" },
        valueType: "number",
        comparison: "direction",
        required: true,
        directional: true,
      },
      {
        id: "region",
        label: { "zh-CN": "快照地区", en: "Snapshot region", ja: "スナップ地域" },
        valueType: "enum",
        comparison: "exact",
        required: true,
      },
    ];
    const model = buildShareCardModel({
      locale: "zh-CN",
      mode: "daily",
      dateKey: "2026-08-02",
      difficulty: "standard",
      guesses,
      fieldDefinitions,
      maxAttempts: 6,
      won: false,
      elapsedMs: 0,
      siteUrl: "https://fireflydle.games/",
    });

    expect(model.fields).toEqual(["快照版本", "快照地区"]);
    expect(model.guesses[0]?.cells).toEqual(["close", "exact"]);
  });
});
