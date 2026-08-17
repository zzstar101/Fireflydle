import { describe, expect, test } from "bun:test";

import type { CharacterSummary, LocalizedAliases, LocalizedText } from "@fireflydle/contracts";

import { buildSearchIndexEntry, searchEntities } from "./search";

const names = (en: string): LocalizedText => ({ "zh-CN": `中${en}`, en, ja: `日${en}` });
const aliases = (en: string[] = [], zh: string[] = []): LocalizedAliases => ({
  "zh-CN": zh,
  en,
  ja: [],
});
const entity = (
  id: string,
  entityNames: LocalizedText,
  entityAliases: LocalizedAliases = aliases(),
): CharacterSummary => ({
  id,
  names: entityNames,
  aliases: entityAliases,
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "penacony",
  factionGroupId: "penacony",
  releaseVersionId: "2.3",
  releaseOrder: 1,
  assets: {
    avatarPath: "/avatar.png",
    portraitPath: "/portrait.png",
    sourceUrl: "https://example.com/avatar.png",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: "a".repeat(64),
    rightsNotice: "仅用于测试",
  },
});

describe("统一搜索索引", () => {
  test("生成期覆盖三语名称、审核别名、拼音、首字母和英文简称", () => {
    const firefly = entity(
      "firefly",
      { "zh-CN": "流萤", en: "Firefly", ja: "ホタル" },
      { "zh-CN": ["萤宝", "liu ying", "liuying"], en: ["SAM"], ja: ["hotaru"] },
    );
    const march = entity("march-7th", { "zh-CN": "三月七", en: "March 7th", ja: "三月なのか" });

    const fireflyIndex = buildSearchIndexEntry(firefly);
    const marchIndex = buildSearchIndexEntry(march);

    expect(fireflyIndex.names.map((term) => term.value)).toEqual(["流萤", "Firefly", "ホタル"]);
    expect(fireflyIndex.terms.map((term) => term.normalized)).toEqual(
      expect.arrayContaining(["萤宝", "liu ying", "liuying", "ly", "sam", "hotaru"]),
    );
    expect(marchIndex.terms.map((term) => term.normalized)).toContain("m7");
  });

  test("严格按名称精确、名称前缀、词精确、词前缀、子串和永久 ID 排序", () => {
    const candidates = [
      entity("id-name-exact", names("Fire")),
      entity("id-name-prefix", names("Firefly")),
      entity("id-term-exact", names("Exact term"), aliases(["Fire"])),
      entity("id-term-prefix", names("Term prefix"), aliases(["Firebrand"])),
      entity("id-substring", names("Bonfire")),
      entity("fire-id", names("Permanent identifier")),
    ];
    const index = candidates.map(buildSearchIndexEntry);

    expect(
      searchEntities("fire", "en", candidates.toReversed(), index).map((item) => item.entity.id),
    ).toEqual(candidates.map((item) => item.id));
  });

  test("同级结果以永久 ID 稳定排序且不做编辑距离纠错", () => {
    const candidates = [entity("zeta", names("Fire Zeta")), entity("alpha", names("Fire Alpha"))];
    const index = candidates.map(buildSearchIndexEntry).toReversed();

    expect(searchEntities("fire", "en", candidates, index).map((item) => item.entity.id)).toEqual([
      "alpha",
      "zeta",
    ]);
    expect(searchEntities("firrfly", "en", candidates, index)).toEqual([]);
  });

  test("跨语言名称命中返回实际词但保留当前语言主标题", () => {
    const firefly = entity("firefly", { "zh-CN": "流萤", en: "Firefly", ja: "ホタル" });
    const [result] = searchEntities(
      "Firefly",
      "zh-CN",
      [firefly],
      [buildSearchIndexEntry(firefly)],
    );

    expect(result?.entity.names["zh-CN"]).toBe("流萤");
    expect(result?.matchedText).toBe("Firefly");
    expect(result?.matchedLocale).toBe("en");
    expect(result?.matchKind).toBe("name-exact");
  });
});
