import { describe, expect, test } from "bun:test";
import { validateWikiPayload, wikiCharacterFacts, type WikiPayload } from "./wiki-characters.ts";

const fixture = (): WikiPayload => ({
  query: {
    results: {
      真珠: {
        fulltext: "真珠",
        fullurl: "https://wiki.biligame.com/sr/真珠",
        printouts: { 元素属性: ["冰"], 命途: ["欢愉"], 稀有度: ["5星"], 实装版本: ["4.6"] },
      },
    },
  },
});

describe("Wiki 属性兜底", () => {
  test("只接受精确名称和一致的正式版本", () => {
    expect(wikiCharacterFacts(fixture(), "真珠", "4.6")).toMatchObject({
      element: "ice",
      path: "elation",
      rarity: 5,
    });
    expect(() => wikiCharacterFacts(fixture(), "真珠", "4.5")).toThrow("版本不一致");
    expect(() => wikiCharacterFacts(fixture(), "珠", "4.6")).toThrow("精确匹配");
  });
  test("缺失、多值、未知属性必须停止", () => {
    for (const values of [[], ["欢愉", "存护"], ["新命途"]]) {
      const payload = fixture();
      payload.query.results.真珠!.printouts.命途 = values;
      expect(() => wikiCharacterFacts(payload, "真珠", "4.6")).toThrow();
    }
  });
  test("不接受错误和残缺的接口响应", () => {
    expect(() => validateWikiPayload({ error: "maintenance" })).toThrow();
    expect(() => validateWikiPayload(fixture())).toThrow("不完整");
  });
});
