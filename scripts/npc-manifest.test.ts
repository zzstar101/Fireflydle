import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateNpcManifest } from "./npc-manifest";

type JsonRecord = Record<string, any>;

const fixtureDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/npc-manifest");

async function readFixture(name: string): Promise<any> {
  return JSON.parse(await readFile(resolve(fixtureDirectory, name), "utf8"));
}

function findEntity(manifest: JsonRecord, id: string): JsonRecord {
  const entity = manifest.entities.find((entry: JsonRecord) => entry.id === id);
  if (!entity) throw new Error(`fixture 缺少实体 ${id}`);
  return entity;
}

function applyFailureMutation(census: JsonRecord, manifest: JsonRecord, mutation: string): void {
  const target = census.entries[0];
  const candidate = census.entries[1];
  const excludedBoss = census.entries[2];
  const targetPool = manifest.pools.find((pool: JsonRecord) => pool.id === "npc-targets");
  const candidatePool = manifest.pools.find((pool: JsonRecord) => pool.id === "npc-candidates");

  switch (mutation) {
    case "missing-source":
      target.sources = [];
      return;
    case "missing-region":
      target.quizFields.region = null;
      return;
    case "missing-faction":
      target.quizFields.faction = null;
      return;
    case "missing-debut-version":
      target.quizFields.debutVersion = null;
      return;
    case "unreviewed-target":
      target.review.humanApproved = false;
      return;
    case "duplicate-project-id":
      candidate.projectId = target.projectId;
      return;
    case "empty-target-pool":
      targetPool.targetIds = [];
      return;
    case "candidate-only-target":
      targetPool.targetIds = [candidate.projectId];
      targetPool.candidateIds = [candidate.projectId];
      candidatePool.targetIds = [candidate.projectId];
      return;
    case "playable-contamination": {
      const playable = findEntity(manifest, candidate.projectId);
      playable.kind = "playable";
      playable.payload = {
        element: "fire",
        path: "destruction",
        rarity: 5,
        factionId: "herta-space-station",
        factionGroupId: "herta-space-station",
        regionId: "herta-space-station",
        releaseVersionId: "1.0",
        releaseOrder: 0,
        assets: playable.payload.assets,
      };
      return;
    }
    case "boss-form": {
      const bossEntity = structuredClone(findEntity(manifest, target.projectId));
      bossEntity.id = excludedBoss.projectId;
      bossEntity.names = {
        "zh-CN": excludedBoss.names["zh-CN"],
        en: excludedBoss.names.en,
        ja: excludedBoss.names.ja,
      };
      bossEntity.source.url = excludedBoss.sources[0].url;
      bossEntity.payload.regionId = excludedBoss.quizFields.region;
      bossEntity.payload.factionId = excludedBoss.quizFields.faction;
      bossEntity.payload.debutVersionId = excludedBoss.quizFields.debutVersion;
      manifest.entities.push(bossEntity);
      candidatePool.candidateIds.push(excludedBoss.projectId);
      return;
    }
    case "missing-debut-evidence":
      target.sources[0].supports = target.sources[0].supports.filter(
        (support: string) => support !== "debutEvidence",
      );
      return;
    case "candidate-human-approved":
      candidate.review.humanApproved = true;
      return;
    default:
      throw new Error(`未知失败 fixture mutation: ${mutation}`);
  }
}

describe("NPC 发布 manifest", () => {
  test("通过 T01 ContentManifest seam 接受已审核的独立目标池和候选池", async () => {
    const census = await readFixture("valid-census.json");
    const manifestInput = await readFixture("valid-manifest.json");

    const manifest = validateNpcManifest(census, manifestInput);
    const mode = manifest.modes.find((entry) => entry.id === "npc");

    expect(mode?.targetPoolId).toBe("npc-targets");
    expect(mode?.candidatePoolId).toBe("npc-candidates");
    expect(manifest.entities.map((entity) => entity.kind)).toEqual(["npc", "npc"]);
  });

  test("缺失非关键翻译时接受记录的语言回退", async () => {
    const census = await readFixture("valid-census.json");
    const manifestInput = await readFixture("valid-manifest.json");

    const manifest = validateNpcManifest(census, manifestInput);
    const target = manifest.entities.find((entity) => entity.id === "npc-express-guide");

    expect(target?.names.ja).toBe("列车向导");
  });

  test("可人工审阅的失败 fixtures 全部阻止发布", async () => {
    const baseCensus = await readFixture("valid-census.json");
    const baseManifest = await readFixture("valid-manifest.json");
    const cases = (await readFixture("failure-cases.json")) as Array<{
      name: string;
      mutation: string;
      expectedMessage: string;
    }>;

    for (const fixture of cases) {
      const census = structuredClone(baseCensus);
      const manifest = structuredClone(baseManifest);
      applyFailureMutation(census, manifest, fixture.mutation);

      expect(() => validateNpcManifest(census, manifest), fixture.name).toThrow(
        fixture.expectedMessage,
      );
    }
  });
});
