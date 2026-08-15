import {
  ContentManifestSchema,
  type ContentManifest,
  type Locale,
} from "../packages/contracts/src/index.ts";
import { validateNpcCensus, type NpcCensusEntry } from "./npc-census";

function fail(message: string): never {
  throw new Error(`NPC manifest 校验失败：${message}`);
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function expectedName(entry: NpcCensusEntry, locale: Locale): string {
  const name = entry.names[locale] ?? entry.names[entry.fallbackLocale];
  if (!name) fail(`${entry.projectId ?? entry.censusEntryKey} 没有可用的 ${locale} 名称或回退`);
  return name;
}

export function validateNpcManifest(censusInput: unknown, manifestInput: unknown): ContentManifest {
  const census = validateNpcCensus(censusInput);
  const parsedManifest = ContentManifestSchema.safeParse(manifestInput);
  if (!parsedManifest.success) {
    const issue = parsedManifest.error.issues[0];
    if (issue?.code === "too_small" && issue.path.at(-1) === "targetIds") {
      fail("目标池不能为空");
    }
    fail(`不符合 ContentManifestSchema：${issue?.message ?? "未知错误"}`);
  }
  const manifest = parsedManifest.data;
  const mode = manifest.modes.find((entry) => entry.id === "npc");
  if (!mode) fail("缺少 npc 模式定义");

  const targetPool = manifest.pools.find((pool) => pool.id === mode.targetPoolId);
  const candidatePool = manifest.pools.find((pool) => pool.id === mode.candidatePoolId);
  if (!targetPool || !candidatePool) fail("npc 模式缺少目标池或候选池");
  if (targetPool.id === candidatePool.id) fail("NPC 目标池和候选池必须独立声明");
  if (!sameIds(targetPool.targetIds, targetPool.candidateIds)) {
    fail("NPC 目标池只能包含正式目标");
  }
  if (!sameIds(targetPool.targetIds, candidatePool.targetIds)) {
    fail("NPC 目标池与候选池的正式目标列表不一致");
  }

  const censusById = new Map(
    census.entries
      .filter((entry): entry is NpcCensusEntry & { projectId: string } => Boolean(entry.projectId))
      .map((entry) => [entry.projectId, entry]),
  );
  const entitiesById = new Map(manifest.entities.map((entity) => [entity.id, entity]));

  for (const id of candidatePool.candidateIds) {
    const censusEntry = censusById.get(id);
    if (!censusEntry) fail(`${id} 不在已审核 NPC census`);
    if (censusEntry.status !== "target" && censusEntry.status !== "candidate-only") {
      fail(`${id} 的 census 状态为 ${censusEntry.status}，不能进入 NPC 池`);
    }

    const entity = entitiesById.get(id);
    if (!entity) fail(`候选 ${id} 缺少 manifest 实体`);
    if (entity.kind !== "npc") fail(`${id} 不是 NPC 实体`);
    for (const locale of ["zh-CN", "en", "ja"] as const) {
      if (entity.names[locale] !== expectedName(censusEntry, locale)) {
        fail(`${id} 的 ${locale} 名称未使用 census 名称或既定回退`);
      }
    }
    if (!censusEntry.sources.some((source) => source.url === entity.source.url)) {
      fail(`${id} 的 manifest 来源无法追溯到 census`);
    }
    if (entity.source.revision !== census.asOf) {
      fail(`${id} 的来源修订 ${entity.source.revision} 未绑定 census ${census.asOf}`);
    }
    if (
      entity.payload.regionId !== censusEntry.quizFields.region ||
      entity.payload.factionId !== censusEntry.quizFields.faction ||
      entity.payload.debutVersionId !== censusEntry.quizFields.debutVersion
    ) {
      fail(`${id} 的三项判题字段与 census 审核结果不一致`);
    }
  }

  for (const id of targetPool.targetIds) {
    const censusEntry = censusById.get(id);
    if (!censusEntry) fail(`${id} 不在已审核 NPC census`);
    if (censusEntry.status !== "target") {
      fail(`${id} 是 ${censusEntry.status}，不能作为正式答案`);
    }
  }

  return manifest;
}
