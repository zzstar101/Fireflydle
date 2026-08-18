import { describe, expect, test } from "bun:test";

import { loadNpcManifest, validateNpcManifest } from "./validate-npc-manifest.ts";

describe("NPC 正式题池发布 seam", () => {
  test("正式 manifest 的 target 与候选成员均来自证据闭合的 census target", async () => {
    const result = await validateNpcManifest(await loadNpcManifest());

    expect(result.targetIds).toEqual(["npc-pom-pom", "npc-siobhan", "npc-skott"]);
    expect(result.candidateOnlyIds).toEqual([]);
    expect(result.targetCount).toBe(3);
  });

  test("正式 target 逐项通过来源、素材、三语回退和判题事实审核", async () => {
    const result = await validateNpcManifest(await loadNpcManifest());

    expect(result.evidenceClosedIds).toEqual(result.targetIds);
    expect(result.assetVerifiedIds).toEqual(result.targetIds);
  });

  test("target 与 candidate 池使用同一份正式成员顺序", async () => {
    const input = await loadNpcManifest();
    const manifest = structuredClone(input.manifest) as {
      pools: Array<{ id: string; targetIds: string[]; candidateIds: string[] }>;
    };
    const candidates = manifest.pools.find((pool) => pool.id === "npc-candidates");
    if (!candidates) throw new Error("测试 fixture 缺少 candidate 池");
    candidates.targetIds = ["npc-skott", "npc-pom-pom", "npc-siobhan"];

    await expect(validateNpcManifest({ ...input, manifest })).rejects.toThrow("正式目标列表不一致");
  });

  test("拒绝 manifest 中脱离证据的名称或判题事实", async () => {
    const input = await loadNpcManifest();
    const manifest = structuredClone(input.manifest) as {
      entities: Array<{ names: Record<string, string>; payload: Record<string, unknown> }>;
    };
    manifest.entities[0].names["zh-CN"] = "错误名称";

    await expect(validateNpcManifest({ ...input, manifest })).rejects.toThrow(
      "名称与审计证据不一致",
    );
  });
});
