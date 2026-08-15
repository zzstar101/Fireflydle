import { describe, expect, test } from "bun:test";

import {
  buildPlayableManifest,
  characters,
  contentManifest,
  factions,
  getSearchText,
  versions,
} from "./index.ts";

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

describe("阵营层级", () => {
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

  test("角色阵营严格采用 BWiki 图鉴的阵营字段", () => {
    const expectedFactions: Record<string, string> = {
      sunday: "cosmic",
      robin: "penacony",
      sampo: "belobog",
      sparxie: "masked-fools",
      ashveil: "galaxy-rangers",
      "dan-heng-il": "xianzhou-luofu",
      "yao-guang": "xianzhou-yuque",
      "the-dahlia": "the-cremators",
      herta: "herta-space-station",
      bronya: "belobog",
      aventurine: "ipc",
      aglaea: "amphoreus",
    };

    for (const [characterId, factionId] of Object.entries(expectedFactions)) {
      const character = characters.find((entry) => entry.id === characterId);
      expect(character, characterId).toBeDefined();
      expect(character?.factionId, characterId).toBe(factionId);
    }
  });

  test("阵营字段不使用初始阵营或派系替换", () => {
    const sunday = characters.find((character) => character.id === "sunday");
    const robin = characters.find((character) => character.id === "robin");
    expect(sunday?.factionId).toBe("cosmic");
    expect(sunday?.factionGroupId).toBe("cosmic");
    expect(robin?.factionId).toBe("penacony");
    expect(robin?.factionGroupId).toBe("penacony");
  });

  test("阵营目录不包含只出现在派系字段中的组织", () => {
    const publishedFactionIds = new Set(factions.map((faction) => faction.id));
    const partyOnlyIds = [
      "genius-society",
      "silvermane-guards",
      "wildfire",
      "the-moles",
      "robot-settlement",
      "ipc-strategic-investment",
      "the-family",
      "bloodhound-family",
      "chrysos-heirs",
    ];

    for (const factionId of partyOnlyIds) {
      expect(publishedFactionIds.has(factionId), factionId).toBeFalse();
    }
  });
});

describe("角色版本", () => {
  test("欢愉开拓者从 4.2 开始实装", () => {
    const trailblazer = characters.find((character) => character.id === "trailblazer-elation");
    expect(trailblazer?.releaseVersionId).toBe("4.2");
  });

  test("每个角色的版本引用与排序一致", () => {
    const orderByVersion = new Map(versions.map((version) => [version.id, version.order]));
    for (const character of characters) {
      const expectedOrder = orderByVersion.get(character.releaseVersionId);
      if (expectedOrder === undefined) throw new Error(`${character.id} 引用了未知版本`);
      expect(character.releaseOrder, character.id).toBe(expectedOrder);
    }
  });
});

describe("普通角色内容兼容入口", () => {
  test("旧角色导出与版本化 manifest 来自同一份发布数据", () => {
    expect(contentManifest).toEqual(buildPlayableManifest(characters));
    const mode = contentManifest.modes.find((entry) => entry.id === "playable");
    expect(mode?.maxAttempts).toBe(6);
    expect(contentManifest.entities).toHaveLength(characters.length);
  });
});
