import { z } from "zod";

export const NPC_CENSUS_LOCALES = ["zh-CN", "en", "ja"] as const;
export const NPC_REVIEW_CHECKLIST = [
  "sourceChecked",
  "namesChecked",
  "fallbackChecked",
  "assetChecked",
  "identityBoundaryChecked",
  "regionChecked",
  "factionChecked",
  "debutChecked",
  "humanApproved",
] as const;

const ReviewSchema = z
  .object({
    sourceChecked: z.boolean(),
    namesChecked: z.boolean(),
    fallbackChecked: z.boolean(),
    assetChecked: z.boolean(),
    identityBoundaryChecked: z.boolean(),
    regionChecked: z.boolean(),
    factionChecked: z.boolean(),
    debutChecked: z.boolean(),
    humanApproved: z.boolean(),
    note: z.string().min(1),
  })
  .strict();

const SourceSchema = z
  .object({
    sourceId: z.string().min(1),
    url: z.string().url(),
    locator: z.string().min(1),
    supports: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const NpcCensusEntrySchema = z
  .object({
    censusEntryKey: z.string().regex(/^hoyowiki:105:\d+$/),
    projectId: z
      .string()
      .regex(/^npc-[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .nullable(),
    sourceEntryPageId: z.string().regex(/^\d+$/),
    status: z.enum(["target", "candidate-only", "pending", "excluded"]),
    names: z
      .object({
        "zh-CN": z.string().min(1).optional(),
        en: z.string().min(1).optional(),
        ja: z.string().min(1).optional(),
      })
      .strict(),
    fallbackLocale: z.enum(NPC_CENSUS_LOCALES),
    factionsByLocale: z
      .object({
        "zh-CN": z.array(z.string().min(1)).optional(),
        en: z.array(z.string().min(1)).optional(),
        ja: z.array(z.string().min(1)).optional(),
      })
      .strict(),
    recognizableAsset: z
      .object({
        status: z.enum(["available", "missing"]),
        sourceUrls: z.array(z.string().url()),
        manuallyChecked: z.boolean(),
      })
      .strict(),
    quizFields: z
      .object({
        region: z.string().min(1).nullable(),
        faction: z.string().min(1).nullable(),
        debutVersion: z
          .string()
          .regex(/^\d+\.\d+$/)
          .nullable(),
      })
      .strict(),
    identity: z
      .object({
        decision: z.enum(["standalone", "merge", "split", "exclude", "pending"]),
        mergedIntoProjectId: z
          .string()
          .regex(/^npc-[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .nullable(),
      })
      .strict(),
    sources: z.array(SourceSchema).min(1, "缺少来源"),
    review: ReviewSchema,
  })
  .strict();

export const NpcCensusSchema = z
  .object({
    schemaVersion: z.literal(1),
    asOf: z.string().date(),
    scope: z
      .object({
        sourceRoster: z.string().min(1),
        sourceCounts: z.object({ "zh-CN": z.number(), en: z.number(), ja: z.number() }).strict(),
        unionEntries: z.number().int().positive(),
        policy: z.string().min(1),
      })
      .strict(),
    coverage: z
      .object({
        statusCounts: z
          .object({
            target: z.number().int().nonnegative(),
            candidateOnly: z.number().int().nonnegative(),
            pending: z.number().int().nonnegative(),
            excluded: z.number().int().nonnegative(),
          })
          .strict(),
        anyUsableName: z.string(),
        threeLocaleNames: z.string(),
        recognizableAsset: z.string(),
        sourceTrace: z.string(),
        completeQuizFields: z.string(),
        humanApprovedTargets: z.string(),
      })
      .strict(),
    policy: z
      .object({
        target: z.string().min(1),
        candidateOnly: z.string().min(1),
        pending: z.string().min(1),
        excluded: z.string().min(1),
        identity: z.string().min(1),
        complexity: z.string().min(1),
      })
      .strict(),
    reviewChecklist: z.array(z.enum(NPC_REVIEW_CHECKLIST)),
    unresolvedEvidenceGaps: z.array(z.string().min(1)),
    sources: z
      .object({
        officialHoyowikiNpc: z
          .object({
            menuId: z.literal("105"),
            menuUrl: z.string().url(),
            listApi: z.string().url(),
            retrievedAt: z.string().datetime({ offset: true }),
            responseSha256: z.string().regex(/^[a-f0-9]{64}$/),
            rights: z.string().min(1),
          })
          .strict(),
        officialVersionNotices: z
          .object({ listApi: z.string().url(), use: z.string().min(1) })
          .strict(),
      })
      .strict(),
    entries: z.array(NpcCensusEntrySchema).min(1),
  })
  .strict();

export type NpcCensus = z.infer<typeof NpcCensusSchema>;
export type NpcCensusEntry = z.infer<typeof NpcCensusEntrySchema>;
export type NpcCensusStatusCounts = {
  target: number;
  candidateOnly: number;
  pending: number;
  excluded: number;
};

function fail(message: string): never {
  throw new Error(`NPC census 校验失败：${message}`);
}

export function getNpcCensusStatusCounts(census: NpcCensus): NpcCensusStatusCounts {
  return {
    target: census.entries.filter((entry) => entry.status === "target").length,
    candidateOnly: census.entries.filter((entry) => entry.status === "candidate-only").length,
    pending: census.entries.filter((entry) => entry.status === "pending").length,
    excluded: census.entries.filter((entry) => entry.status === "excluded").length,
  };
}

export function validateNpcCensus(input: unknown): NpcCensus {
  const parsed = NpcCensusSchema.safeParse(input);
  if (!parsed.success) fail(z.prettifyError(parsed.error));
  const census = parsed.data;

  if (census.entries.length !== census.scope.unionEntries) {
    fail(`unionEntries=${census.scope.unionEntries}，实际 entries=${census.entries.length}`);
  }
  if (
    census.reviewChecklist.length !== NPC_REVIEW_CHECKLIST.length ||
    NPC_REVIEW_CHECKLIST.some((item, index) => census.reviewChecklist[index] !== item)
  ) {
    fail("reviewChecklist 与 schema 规定的逐项清单不一致");
  }

  const censusKeys = new Set<string>();
  const projectIds = new Set<string>();
  const sourceEntryIds = new Set<string>();
  for (const entry of census.entries) {
    if (censusKeys.has(entry.censusEntryKey)) fail(`重复 census key ${entry.censusEntryKey}`);
    if (sourceEntryIds.has(entry.sourceEntryPageId)) {
      fail(`重复 HoYoWiki entry_page_id ${entry.sourceEntryPageId}`);
    }
    censusKeys.add(entry.censusEntryKey);
    sourceEntryIds.add(entry.sourceEntryPageId);
    if (entry.projectId) {
      if (projectIds.has(entry.projectId)) fail(`重复项目永久 ID ${entry.projectId}`);
      projectIds.add(entry.projectId);
    }

    if (!entry.names[entry.fallbackLocale]) {
      fail(`${entry.censusEntryKey} 的 fallbackLocale=${entry.fallbackLocale} 没有对应名称`);
    }

    if (entry.status === "target" || entry.status === "candidate-only") {
      if (!entry.projectId) fail(`${entry.censusEntryKey} 缺少项目永久 ID`);
      if (entry.sources.length === 0) fail(`${entry.projectId} 缺少来源`);
      for (const field of ["region", "faction", "debutVersion"] as const) {
        if (!entry.quizFields[field]) fail(`${entry.projectId} 缺少 ${field}`);
      }
      if (
        entry.recognizableAsset.status !== "available" ||
        entry.recognizableAsset.sourceUrls.length === 0 ||
        !entry.recognizableAsset.manuallyChecked
      ) {
        fail(`${entry.projectId} 缺少经人工确认的可辨识素材`);
      }
      const hasDebutEvidence = entry.sources.some((source) =>
        source.supports.includes("debutEvidence"),
      );
      if (!hasDebutEvidence) fail(`${entry.projectId} 缺少具名首次登场证据`);
      for (const checklistItem of NPC_REVIEW_CHECKLIST) {
        if (checklistItem !== "humanApproved" && !entry.review[checklistItem]) {
          fail(`${entry.projectId} 的 ${checklistItem} 未完成`);
        }
      }
    }

    if (entry.status === "target" && !entry.review.humanApproved) {
      fail(`${entry.projectId} 是 target 但未获得人工批准`);
    }
    if (entry.status !== "target" && entry.review.humanApproved) {
      fail(`${entry.censusEntryKey} 不是 target 却标记为 humanApproved`);
    }
    if (entry.status === "excluded" && !["merge", "exclude"].includes(entry.identity.decision)) {
      fail(`${entry.censusEntryKey} 已排除但身份决策不是 merge/exclude`);
    }
  }

  for (const entry of census.entries) {
    if (entry.identity.mergedIntoProjectId && !projectIds.has(entry.identity.mergedIntoProjectId)) {
      fail(`${entry.censusEntryKey} 合并到了不存在的 ${entry.identity.mergedIntoProjectId}`);
    }
  }

  const actualCounts = getNpcCensusStatusCounts(census);
  for (const key of Object.keys(actualCounts) as Array<keyof NpcCensusStatusCounts>) {
    if (actualCounts[key] !== census.coverage.statusCounts[key]) {
      fail(
        `coverage.statusCounts.${key}=${census.coverage.statusCounts[key]}，实际为 ${actualCounts[key]}`,
      );
    }
  }

  return census;
}
