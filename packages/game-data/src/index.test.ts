import { describe, expect, test } from "bun:test";

import { characters, getSearchText } from "./index.ts";

function matchingIds(query: string): string[] {
  const normalized = query.toLocaleLowerCase();
  return characters
    .filter((character) => getSearchText(character).includes(normalized))
    .map((character) => character.id);
}

describe("角色输入搜索", () => {
  test.each([
    ["liuying", "firefly"],
    ["sanyueqi", "march-7th"],
    ["hotaru", "firefly"],
    ["buronya", "bronya"],
  ])("%s 可匹配 %s", (query, expectedId) => {
    expect(matchingIds(query)).toContain(expectedId);
  });

  test("每个形态都有拼音/拉丁输入与日文罗马字降级", () => {
    const asciiAlias = /^[a-z0-9]+(?: [a-z0-9]+)*$/;
    for (const character of characters) {
      expect(character.aliases["zh-CN"].some((alias) => asciiAlias.test(alias))).toBeTrue();
      expect(character.aliases.ja.some((alias) => asciiAlias.test(alias))).toBeTrue();
    }
  });
});

describe("势力层级", () => {
  test("仙舟不同舰属于同一官网大组", () => {
    const jingYuan = characters.find((character) => character.id === "jing-yuan");
    const feixiao = characters.find((character) => character.id === "feixiao");
    expect(jingYuan).toBeDefined();
    expect(feixiao).toBeDefined();
    expect(jingYuan?.factionId).toBe("xianzhou-luofu");
    expect(feixiao?.factionId).toBe("xianzhou-yaoqing");
    expect(jingYuan?.factionGroupId).toBe("xianzhou-alliance");
    expect(feixiao?.factionGroupId).toBe(jingYuan?.factionGroupId);
  });
});
