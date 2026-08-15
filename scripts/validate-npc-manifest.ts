import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ContentManifestSchema } from "../packages/contracts/src/index.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");

type CensusEntry = {
  censusEntryKey: string;
  projectId?: string;
  status: "target" | "candidate-only" | "pending" | "excluded";
  sourceEntryPageId: string;
  names: Record<string, string>;
  fallbackLocale: string;
  quizFields?: { region?: string; faction?: string; debutVersion?: string };
  recognizableAsset?: { status: string; sourceUrls?: string[]; manuallyChecked?: boolean };
  sources: Array<{ sourceId: string; url: string; locator: string; supports: string[] }>;
  review: Record<string, boolean>;
};

export type NpcManifestInput = {
  manifest: unknown;
  audit: {
    censusSnapshot: {
      unionEntries: number;
      targetCount: number;
      candidateOnlyCount: number;
      pendingCount: number;
      excludedCount: number;
    };
    formalTargetIds: string[];
    candidateOnlyIds: string[];
    evidence: Array<{
      projectId: string;
      censusEntryKey: string;
      sourceEntryPageId: string;
      names: Record<string, string>;
      fallbackLocale: string;
      quizFields: { region: string; faction: string; debutVersion: string };
      sources: Array<{ sourceId: string; url: string; locator: string; supports: string[] }>;
      asset: { path: string; sourceUrl: string; sha256: string; manuallyChecked: boolean };
      review: Record<string, boolean>;
    }>;
  };
  census: { entries: CensusEntry[] };
};

export type NpcManifestValidationResult = {
  targetIds: string[];
  candidateOnlyIds: string[];
  targetCount: number;
  evidenceClosedIds: string[];
  assetVerifiedIds: string[];
};

export async function loadNpcManifest(): Promise<NpcManifestInput> {
  const readJson = async <T>(path: string): Promise<T> =>
    JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8")) as T;

  return {
    manifest: await readJson("packages/game-data/src/data/npc-manifest.json"),
    audit: await readJson("packages/game-data/src/data/npc-manifest-audit.json"),
    census: await readJson("packages/game-data/src/data/npc-census.json"),
  };
}

function fail(message: string): never {
  throw new Error(`NPC 正式题池校验失败：${message}`);
}

function hashFile(path: string): Promise<string> {
  return readFile(path).then((contents) => createHash("sha256").update(contents).digest("hex"));
}

export async function validateNpcManifest(
  input: NpcManifestInput,
): Promise<NpcManifestValidationResult> {
  const manifest = ContentManifestSchema.parse(input.manifest);
  const mode = manifest.modes.find((entry) => entry.id === "npc");
  if (!mode) fail("缺少 npc 模式");
  if (mode.maxAttempts !== 4) fail(`NPC 猜测次数应为 4，实际为 ${mode.maxAttempts}`);
  const fieldIds = mode.fields.map((field) => field.id);
  if (fieldIds.join(",") !== "region,faction,debut-version") {
    fail(`NPC 判题字段不符合三项固定事实：${fieldIds.join(",")}`);
  }

  const targetPool = manifest.pools.find((pool) => pool.id === mode.targetPoolId);
  const candidatePool = manifest.pools.find((pool) => pool.id === mode.candidatePoolId);
  if (!targetPool || !candidatePool) fail("模式引用的正式题池不存在");
  const targetIds = targetPool.targetIds;
  const candidateIds = candidatePool.candidateIds;
  if (targetIds.length === 0) fail("正式目标池为空");
  if (JSON.stringify(candidatePool.targetIds) !== JSON.stringify(targetIds)) {
    fail("target 池与 candidate 池的正式目标列表不一致");
  }
  if (JSON.stringify(targetPool.candidateIds) !== JSON.stringify(candidateIds)) {
    fail("target 池与 candidate 池的候选成员列表不一致");
  }
  if (targetIds.some((id) => !candidateIds.includes(id))) fail("正式目标必须属于候选池");
  if (candidateIds.some((id) => !targetIds.includes(id))) {
    const candidateOnlyIds = candidateIds.filter((id) => !targetIds.includes(id));
    if (candidateOnlyIds.length > 0)
      fail("candidate-only 尚无证据闭合发布路径；保持 0，待逐项审核后再开放");
  }

  const publicAssetManifestPath = resolve(repositoryRoot, "apps/web/public/assets/manifest.json");
  const publicAssetManifest = JSON.parse(await readFile(publicAssetManifestPath, "utf8")) as {
    files: Array<{ path: string; bytes: number; sha256: string; sourceUrl?: string }>;
  };
  const publicAssetManifestBytes = await readFile(publicAssetManifestPath);
  const publicAssetManifestDigest = createHash("sha256")
    .update(publicAssetManifestBytes)
    .digest("hex");
  const recordedAssetManifestDigest = (
    await readFile(resolve(repositoryRoot, "apps/web/public/assets/manifest.sha256"), "utf8")
  ).trim();
  if (!recordedAssetManifestDigest.startsWith(`${publicAssetManifestDigest}  manifest.json`))
    fail("assets/manifest.sha256 与 manifest.json 不一致");

  const targetEntities = manifest.entities.filter((entity) => targetIds.includes(entity.id));
  if (targetEntities.length !== targetIds.length) fail("目标池存在缺少实体定义的 ID");
  if (
    targetEntities.some((entity) => entity.kind !== "npc" || entity.reviewStatus !== "approved")
  ) {
    fail("正式目标必须是 approved NPC 实体");
  }

  const censusByProjectId = new Map(
    input.census.entries
      .filter((entry) => entry.projectId)
      .map((entry) => [entry.projectId!, entry]),
  );
  const evidenceByProjectId = new Map(
    input.audit.evidence.map((entry) => [entry.projectId, entry]),
  );
  const evidenceClosedIds: string[] = [];
  const assetVerifiedIds: string[] = [];
  for (const entity of targetEntities) {
    if (entity.kind !== "npc") fail(`${entity.id} 不是 NPC 实体`);
    const census = censusByProjectId.get(entity.id);
    const evidence = evidenceByProjectId.get(entity.id);
    if (!census || census.status !== "target") fail(`${entity.id} 未在 census target 中`);
    if (!evidence) fail(`${entity.id} 缺少独立审计证据`);
    if (
      evidence.censusEntryKey !== census.censusEntryKey ||
      evidence.sourceEntryPageId !== census.sourceEntryPageId
    ) {
      fail(`${entity.id} 的 census key 或 entry_page_id 不一致`);
    }
    if (
      JSON.stringify(evidence.names) !== JSON.stringify(census.names) ||
      evidence.fallbackLocale !== census.fallbackLocale
    ) {
      fail(`${entity.id} 的三语名称或回退与 census 不一致`);
    }
    if (JSON.stringify(evidence.quizFields) !== JSON.stringify(census.quizFields))
      fail(`${entity.id} 的三项判题事实与 census 不一致`);
    if (JSON.stringify(entity.names) !== JSON.stringify(evidence.names))
      fail(`${entity.id} 的 manifest 名称与审计证据不一致`);
    const toContentId = (value: string) =>
      value
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (
      entity.payload.regionId !== toContentId(evidence.quizFields.region) ||
      entity.payload.factionId !== toContentId(evidence.quizFields.faction) ||
      entity.payload.debutVersionId !== evidence.quizFields.debutVersion
    )
      fail(`${entity.id} 的三项判题事实与审计证据不一致`);
    const censusSources = new Map(census.sources.map((source) => [source.sourceId, source]));
    for (const source of evidence.sources) {
      const expected = censusSources.get(source.sourceId);
      if (
        !expected ||
        source.url !== expected.url ||
        source.locator !== expected.locator ||
        JSON.stringify(source.supports) !== JSON.stringify(expected.supports)
      ) {
        fail(`${entity.id} 的来源 ${source.sourceId} 与 census 不一致`);
      }
    }
    if (
      entity.source.url !==
        census.sources.find((source) => source.sourceId === "official-hoyowiki-npc")?.url ||
      entity.source.revision !== census.censusEntryKey
    ) {
      fail(`${entity.id} 的实体来源信封与 census 不一致`);
    }
    const requiredSupports = [
      "identity",
      "names",
      "asset",
      "faction",
      "debutVersion",
      "debutEvidence",
      "region",
    ];
    const supported = new Set(evidence.sources.flatMap((source) => source.supports));
    if (requiredSupports.some((support) => !supported.has(support)))
      fail(
        `${entity.id} 缺少 ${requiredSupports.find((support) => !supported.has(support))} 来源证据`,
      );
    const reviewKeys = [
      "sourceChecked",
      "namesChecked",
      "fallbackChecked",
      "assetChecked",
      "identityBoundaryChecked",
      "regionChecked",
      "factionChecked",
      "debutChecked",
      "humanApproved",
    ];
    if (reviewKeys.some((key) => census.review[key] !== true || evidence.review[key] !== true))
      fail(`${entity.id} 审核清单未全部通过`);
    const asset = entity.payload.assets;
    if (
      asset.avatarPath !== evidence.asset.path ||
      asset.portraitPath !== evidence.asset.path ||
      asset.sha256 !== evidence.asset.sha256 ||
      !evidence.asset.manuallyChecked
    )
      fail(`${entity.id} 素材 manifest 与审计记录不一致`);
    for (const assetPath of [asset.avatarPath, asset.portraitPath]) {
      const indexedAsset = publicAssetManifest.files.find((file) => file.path === assetPath);
      if (!indexedAsset) fail(`${entity.id} 素材未登记在 apps/web/public/assets/manifest.json`);
      const localAsset = resolve(repositoryRoot, "apps/web/public", assetPath.replace(/^\//, ""));
      const actualBytes = await readFile(localAsset);
      const actualHash = await hashFile(localAsset);
      if (
        actualHash !== asset.sha256 ||
        indexedAsset.sha256 !== asset.sha256 ||
        indexedAsset.bytes !== actualBytes.byteLength ||
        indexedAsset.sourceUrl !== evidence.asset.sourceUrl
      )
        fail(`${entity.id} 本地素材、全局 manifest 与审计记录不一致`);
    }
    evidenceClosedIds.push(entity.id);
    assetVerifiedIds.push(entity.id);
  }

  const expectedCounts = input.audit.censusSnapshot;
  const actualCounts = {
    unionEntries: input.census.entries.length,
    targetCount: input.census.entries.filter((entry) => entry.status === "target").length,
    candidateOnlyCount: input.census.entries.filter((entry) => entry.status === "candidate-only")
      .length,
    pendingCount: input.census.entries.filter((entry) => entry.status === "pending").length,
    excludedCount: input.census.entries.filter((entry) => entry.status === "excluded").length,
  };
  for (const key of Object.keys(actualCounts) as Array<keyof typeof actualCounts>) {
    if (expectedCounts[key] !== actualCounts[key])
      fail(`census 统计 ${key} 漂移：审计 ${expectedCounts[key]}，实际 ${actualCounts[key]}`);
  }
  if (JSON.stringify(input.audit.formalTargetIds) !== JSON.stringify(targetIds))
    fail("审计 formalTargetIds 与 manifest 不一致");
  if (
    JSON.stringify(input.audit.candidateOnlyIds) !==
    JSON.stringify(candidateIds.filter((id) => !targetIds.includes(id)))
  )
    fail("审计 candidateOnlyIds 与候选池不一致");

  return {
    targetIds,
    candidateOnlyIds: candidateIds.filter((id) => !targetIds.includes(id)),
    targetCount: targetIds.length,
    evidenceClosedIds,
    assetVerifiedIds,
  };
}

if (import.meta.main) {
  const result = await validateNpcManifest(await loadNpcManifest());
  console.log(
    `NPC 正式题池校验通过：target ${result.targetCount}，candidate-only ${result.candidateOnlyIds.length}，素材 ${result.assetVerifiedIds.length}`,
  );
}
