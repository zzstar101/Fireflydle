/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildPlayableManifest,
  characters,
  contentManifest,
  factions,
  getRegionName,
  getNpcSearchText,
  npcEntities,
  npcManifest,
  searchEntities,
  versions,
  currencyWarsManifest,
  currencyWarsRuleset,
  currencyWarsUnitSummaries,
  aeonAssetAudit,
  aeonManifest,
  characterSkins,
} from "./index.ts";
import { playableShell } from "./playable-shell.ts";

function matchingIds(query: string): string[] {
  return searchEntities(query, "zh-CN", characters, contentManifest.searchIndex).map(
    (result) => result.entity.id,
  );
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

describe("角色时装视觉变体", () => {
  test("每套时装都绑定到现有角色并使用本地官方素材", () => {
    expect(characterSkins).toHaveLength(5);
    for (const skin of characterSkins) {
      expect(characters.some((character) => character.id === skin.characterId)).toBeTrue();
      expect(skin.imagePath).toMatch(/^\/assets\/skins\/.+\.png$/);
      expect(skin.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});

describe("4.5 独立角色", () => {
  test("晴歌与戏浪使用独立角色身份而不是时装绑定", () => {
    const robin = characters.find((character) => character.id === "robin-summeretto");
    const aventurine = characters.find((character) => character.id === "aventurine-waveflair");

    expect(robin).toBeDefined();
    expect(aventurine).toBeDefined();
    expect(robin?.officialId).toBe("1512");
    expect(robin?.baseCharacterId).toBe(robin?.id);
    expect(robin?.element).toBe("wind");
    expect(robin?.path).toBe("remembrance");
    expect(aventurine?.officialId).toBe("1513");
    expect(aventurine?.baseCharacterId).toBe(aventurine?.id);
    expect(aventurine?.element).toBe("quantum");
    expect(aventurine?.path).toBe("elation");
    expect(characterSkins.some((skin) => skin.id === robin?.id)).toBeFalse();
    expect(characterSkins.some((skin) => skin.id === aventurine?.id)).toBeFalse();
  });
});

describe("NPC 正式题池", () => {
  test("只发布审核通过的三名正式 target", () => {
    const mode = npcManifest.modes.find((entry) => entry.id === "npc");
    const pool = npcManifest.pools.find((entry) => entry.id === mode?.targetPoolId);

    expect(mode?.maxAttempts).toBe(4);
    expect(mode?.fields.map((field) => field.id)).toEqual(["region", "faction", "debut-version"]);
    expect(pool?.targetIds).toEqual(["npc-pom-pom", "npc-siobhan", "npc-skott"]);
    expect(
      npcManifest.entities.every(
        (entity) => entity.kind === "npc" && entity.reviewStatus === "approved",
      ),
    ).toBeTrue();
  });

  test("候选池没有把非 target 或其它模式实体带入 NPC", () => {
    const pool = npcManifest.pools.find((entry) => entry.id === "npc-candidates");

    expect(pool?.candidateIds).toEqual(["npc-pom-pom", "npc-siobhan", "npc-skott"]);
    expect(
      pool?.candidateIds.every(
        (id) => npcManifest.entities.find((entity) => entity.id === id)?.kind === "npc",
      ),
    ).toBeTrue();
  });

  test("答案与搜索只来自审核 NPC 池，且不混入普通角色", () => {
    const mode = npcManifest.modes.find((entry) => entry.id === "npc");
    const targets = npcManifest.pools.find((pool) => pool.id === mode?.targetPoolId);
    const candidates = npcManifest.pools.find((pool) => pool.id === mode?.candidatePoolId);
    expect(candidates?.candidateIds).toEqual(targets?.targetIds);
    expect(npcEntities.every((entity) => entity.kind === "npc")).toBeTrue();
    expect(
      characters.some((character) => candidates?.candidateIds.includes(character.id)),
    ).toBeFalse();
  });

  test("统一搜索文本支持 NPC 三语名称和别名", () => {
    const pomPom = npcEntities.find((entity) => entity.id === "npc-pom-pom");
    expect(pomPom).toBeDefined();
    expect(getNpcSearchText(pomPom!)).toContain("pamu");
  });
});

describe("货币战争独立规则集", () => {
  test("候选与目标只来自完整币战单位子池", () => {
    const mode = currencyWarsManifest.modes.find((entry) => entry.id === "currency-wars");
    const targetPool = currencyWarsManifest.pools.find((pool) => pool.id === mode?.targetPoolId);
    const candidatePool = currencyWarsManifest.pools.find(
      (pool) => pool.id === mode?.candidatePoolId,
    );
    expect(mode?.maxAttempts).toBe(6);
    expect(mode?.fields.map((field) => field.id)).toEqual(["cost", "position", "synergies"]);
    expect(candidatePool?.candidateIds.length).toBe(targetPool?.targetIds.length ?? 0);
    expect(candidatePool?.candidateIds.length).toBe(72);
    expect(candidatePool?.candidateIds).toContain("cw-acheron");
    expect(currencyWarsRuleset.units.some((unit) => unit.id === "cw-acheron")).toBeTrue();
    expect(currencyWarsRuleset.units.find((unit) => unit.id === "cw-acheron")?.synergies).toEqual([
      "debuff",
      "galaxy-rangers",
    ]);
    expect(currencyWarsRuleset.units.every((unit) => unit.id.startsWith("cw-"))).toBeTrue();
    expect(
      currencyWarsRuleset.units.find((unit) => unit.id === "cw-silver-wolf-lv-999")?.cost,
    ).toEqual([3, 4, 5]);
    expect(
      currencyWarsRuleset.units.every(
        (unit) => unit.assets.avatarPath && unit.synergies.length > 0,
      ),
    ).toBeTrue();
    expect(currencyWarsUnitSummaries.every((unit) => !("synergies" in unit))).toBeTrue();
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

describe("地区显示", () => {
  test("二相乐园不再错误显示为哀丽秘榭", () => {
    const evanescia = characters.find((character) => character.id === "evanescia");
    expect(evanescia?.factionGroupId).toBe("planarcadia");
    expect(getRegionName("planarcadia", "zh-CN")).toBe("二相乐园");
    expect(getRegionName("planarcadia", "ja")).toBe("二相楽園");
  });

  test("遐蝶仍归入有来源支持的翁法罗斯", () => {
    const castorice = characters.find((character) => character.id === "castorice");
    expect(castorice?.factionGroupId).toBe("amphoreus");
    expect(getRegionName("amphoreus", "zh-CN")).toBe("翁法罗斯");
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
  test("首屏模式壳与完整发布 manifest 保持同步", () => {
    expect(playableShell).toEqual({
      manifestVersion: contentManifest.manifestVersion,
      modes: contentManifest.modes,
      activities: contentManifest.activities,
    });
  });

  test("旧角色导出与版本化 manifest 来自同一份发布数据", () => {
    expect(contentManifest).toEqual(buildPlayableManifest(characters));
    const mode = contentManifest.modes.find((entry) => entry.id === "playable");
    expect(mode?.maxAttempts).toBe(6);
    expect(contentManifest.entities).toHaveLength(characters.length);
  });
});

describe("星神正式题池", () => {
  const expected = [
    ["aeon-aha", "阿哈", "Aha", "アッハ"],
    ["aeon-ena", "太一", "Ena", "エナ"],
    ["aeon-fuli", "浮黎", "Fuli", "浮黎"],
    ["aeon-hooh", "互", "HooH", "互"],
    ["aeon-ix", "Ⅸ", "IX", "IX"],
    ["aeon-lan", "岚", "Lan", "嵐"],
    ["aeon-mythus", "迷思", "Mythus", "ミュトゥス"],
    ["aeon-nanook", "纳努克", "Nanook", "ナヌーク"],
    ["aeon-nous", "博识尊", "Nous", "ヌース"],
    ["aeon-oroboros", "奥博洛斯", "Oroboros", "ウロボロス"],
    ["aeon-qlipoth", "克里珀", "Qlipoth", "クリフォト"],
    ["aeon-tayzzyronth", "塔伊兹育罗斯", "Tayzzyronth", "タイズルス"],
    ["aeon-xipe", "希佩", "Xipe", "シペ"],
    ["aeon-yaoshi", "药师", "Yaoshi", "薬師"],
  ];

  test("答案是 14 位且有星神本体图的具名星神，三语名称固定", () => {
    expect(
      aeonManifest.entities.map((entity) => [
        entity.id,
        entity.names["zh-CN"],
        entity.names.en,
        entity.names.ja,
      ]),
    ).toEqual(expected);
    expect(new Set(aeonManifest.entities.map(({ id }) => id)).size).toBe(14);
    expect(aeonManifest.entities.some(({ names }) => names.en === "Herta")).toBeFalse();
    expect(aeonManifest.entities.map(({ names }) => names["zh-CN"])).not.toContain("开拓");
    expect(aeonManifest.entities.map(({ names }) => names["zh-CN"])).not.toContain("毁灭");
    expect(aeonManifest.entities.map(({ names }) => names["zh-CN"])).not.toContain("智识");
  });

  test("图片审计与 manifest 一一对应且全部为星神本体图", () => {
    expect(aeonAssetAudit).toHaveLength(14);
    expect(
      aeonAssetAudit.filter(({ assetKind }) => assetKind === "official-main-art"),
    ).toHaveLength(14);
    expect(aeonAssetAudit.every(({ assetKind }) => assetKind === "official-main-art")).toBeTrue();
    expect(aeonAssetAudit.map(({ localPath }) => localPath)).toEqual(
      aeonManifest.entities.map((entity) => {
        if (entity.kind !== "aeon") throw new Error(`${entity.id} 不是星神实体`);
        return entity.payload.assets.imagePath;
      }),
    );
    for (const asset of aeonAssetAudit) {
      expect(asset.officialPageUrl).toBe("https://wiki.biligame.com/sr/星神");
      expect(asset.sourceAssetUrl).toMatch(/^https:\/\//);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.focus).toHaveLength(2);
    }
  });

  test("14 张本地图片存在、不是 SVG 或占位，并且 SHA-256 全部唯一", async () => {
    const actualHashes: string[] = [];
    for (const asset of aeonAssetAudit) {
      const absolutePath = join(import.meta.dir, "../../../apps/web/public", asset.localPath);
      const bytes = await readFile(absolutePath);
      const hash = createHash("sha256").update(bytes).digest("hex");
      expect(asset.localPath.endsWith(".webp")).toBeTrue();
      expect(bytes.byteLength).toBeGreaterThan(5_000);
      expect(hash).toBe(asset.sha256);
      actualHashes.push(hash);
    }
    expect(new Set(actualHashes).size).toBe(14);
  });
});
