import { describe, expect, test } from "bun:test";

import type { Character } from "@fireflydle/contracts";

import { buildPlayableManifest } from "./content-manifest";

const character = (overrides: Partial<Character> = {}): Character => ({
  id: "firefly",
  officialId: "8001",
  baseCharacterId: "firefly",
  names: { "zh-CN": "流萤", en: "Firefly", ja: "ホタル" },
  aliases: { "zh-CN": ["liu ying"], en: ["firefly"], ja: ["hotaru"] },
  element: "fire",
  path: "destruction",
  rarity: 5,
  factionId: "penacony",
  factionGroupId: "penacony",
  releaseVersionId: "2.3",
  releaseOrder: 10,
  assets: {
    avatarPath: "/assets/characters/firefly.png",
    portraitPath: "/assets/characters/firefly.png",
    sourceUrl: "https://example.com/firefly.png",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: "a".repeat(64),
    rightsNotice: "仅用于测试",
  },
  enabled: true,
  targetEligible: true,
  sourceRevision: "source-a",
  ...overrides,
});

describe("普通角色内容 manifest 迁移", () => {
  test("为每个旧角色生成 playable 实体和题池成员", () => {
    const manifest = buildPlayableManifest([
      character({ id: "zeta", releaseOrder: 20 }),
      character(),
    ]);

    expect(manifest.manifestVersion).toMatch(/^1\.0\.\d+$/);
    expect(manifest.entities.map((entity) => entity.id)).toEqual(["firefly", "zeta"]);
    expect(manifest.entities.every((entity) => entity.kind === "playable")).toBeTrue();
    expect(manifest.searchIndex.map((entry) => entry.entityId)).toEqual(["firefly", "zeta"]);
    expect(manifest.searchIndex[0]?.names.map((term) => term.value)).toEqual([
      "流萤",
      "Firefly",
      "ホタル",
    ]);
    const firefly = manifest.entities.find((entity) => entity.id === "firefly");
    expect(firefly?.source).toEqual({
      url: "https://example.com/firefly.png",
      revision: "source-a",
    });
    expect(firefly?.payload).toMatchObject({
      element: "fire",
      path: "destruction",
      rarity: 5,
      regionId: "penacony",
    });

    const targetPool = manifest.pools.find((entry) => entry.id === "playable-targets");
    const candidatePool = manifest.pools.find((entry) => entry.id === "playable-candidates");
    expect(targetPool?.targetIds).toEqual(["firefly", "zeta"]);
    expect(candidatePool?.candidateIds).toEqual(["firefly", "zeta"]);
    expect(manifest.activities.find((activity) => activity.id === "daily")?.enabled).toBeTrue();
    expect(manifest.activities.find((activity) => activity.id === "weekly")?.enabled).toBeTrue();
    expect(manifest.activities.find((activity) => activity.id === "endless")?.enabled).toBeTrue();
    expect(
      manifest.activities.find((activity) => activity.id === "ranked-match")?.enabled,
    ).toBeFalse();
  });

  test("同一输入生成稳定排序和一致 manifest 版本内容", () => {
    const input = [character({ id: "zeta", releaseOrder: 20 }), character()];
    expect(buildPlayableManifest(input)).toEqual(buildPlayableManifest(input));
    expect(buildPlayableManifest(input)).toEqual(buildPlayableManifest(input.toReversed()));
    expect(buildPlayableManifest(input).manifestVersion).not.toBe(
      buildPlayableManifest([character(), character({ id: "zeta", releaseOrder: 21 })])
        .manifestVersion,
    );
  });

  test("拒绝重复 ID、缺少必填数据、空目标池和未知地区", () => {
    expect(() => buildPlayableManifest([character(), character()])).toThrow(/ID/);
    expect(() => buildPlayableManifest([character({ sourceRevision: "" })])).toThrow();
    expect(() => buildPlayableManifest([character({ targetEligible: false })])).toThrow(/目标池/);
    expect(() => buildPlayableManifest([character({ factionGroupId: "unknown-faction" })])).toThrow(
      /地区映射/,
    );
  });

  test("停用角色保留实体审计记录但不进入候选或目标池", () => {
    const manifest = buildPlayableManifest([
      character(),
      character({ id: "disabled", enabled: false, targetEligible: true }),
    ]);
    const disabled = manifest.entities.find((entity) => entity.id === "disabled");
    expect(disabled?.reviewStatus).toBe("rejected");
    expect(manifest.pools.flatMap((pool) => pool.candidateIds)).not.toContain("disabled");
    expect(manifest.pools.flatMap((pool) => pool.targetIds)).not.toContain("disabled");
  });
});
