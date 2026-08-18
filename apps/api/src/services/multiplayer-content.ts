import type { Character, ContentModeId, GameEntitySummary } from "@fireflydle/contracts";
import {
  aeonEntities,
  aeonManifest,
  contentManifest,
  currencyWarsManifest,
  currencyWarsUnits,
  npcEntities,
  npcManifest,
  npcSummary,
} from "@fireflydle/game-data";
import {
  selectSnapshotFieldDefinitions,
  snapshotRulesFromFieldDefinitions,
} from "@fireflydle/game-engine";
import type { MultiplayerContentSnapshot } from "../domain/multiplayer";
import { getEnabledCharacters, getTargetPool } from "../lib/db";

const playableMode =
  contentManifest.modes.find((mode) => mode.id === "playable") ??
  (() => {
    throw new Error("普通角色模式未注册");
  })();

export function createPlayableMultiplayerContentSnapshot(
  candidates: readonly Character[],
  targets: readonly Character[],
): MultiplayerContentSnapshot {
  const candidateSnapshots = Object.fromEntries(
    candidates.map((character) => [character.id, character]),
  );
  const targetIds = targets.map((character) => character.id);
  if (Object.keys(candidateSnapshots).length === 0 || targetIds.length === 0) {
    throw new Error("多人题库不能为空");
  }
  return {
    modeId: "playable",
    poolRuleVersion: playableMode.rulesVersion,
    manifestVersion: contentManifest.manifestVersion,
    candidateSnapshots,
    targetIds,
    fieldRules: {
      rules: snapshotRulesFromFieldDefinitions(playableMode.fields),
      definitions: selectSnapshotFieldDefinitions(playableMode.fields),
    },
  };
}

export async function loadPlayableMultiplayerContentSnapshot(
  db: D1Database,
): Promise<MultiplayerContentSnapshot | null> {
  const [candidates, targets] = await Promise.all([getEnabledCharacters(db), getTargetPool(db)]);
  if (candidates.length === 0 || targets.length === 0) return null;
  return createPlayableMultiplayerContentSnapshot(candidates, targets);
}

export function createStaticMultiplayerContentSnapshot(
  modeId: Exclude<ContentModeId, "playable">,
): MultiplayerContentSnapshot {
  const manifest =
    modeId === "npc"
      ? npcManifest
      : modeId === "currency-wars"
        ? currencyWarsManifest
        : aeonManifest;
  const mode = manifest.modes.find((entry) => entry.id === modeId);
  if (!mode) throw new Error(`多人模式未注册：${modeId}`);
  const entities: (GameEntitySummary & Record<string, unknown>)[] =
    modeId === "npc"
      ? npcEntities.map((entity) => npcSummary(entity))
      : modeId === "currency-wars"
        ? currencyWarsUnits.map((unit) => unit as GameEntitySummary & Record<string, unknown>)
        : aeonEntities.map((entity) => ({
            id: entity.id,
            names: entity.names,
            aliases: entity.aliases,
            assets: entity.assets,
          }));
  const candidateSnapshots = Object.fromEntries(entities.map((entity) => [entity.id, entity]));
  return {
    modeId,
    poolRuleVersion: mode.rulesVersion,
    manifestVersion: manifest.manifestVersion,
    candidateSnapshots,
    targetIds: entities.map((entity) => entity.id),
    fieldRules: {
      rules:
        modeId === "npc"
          ? [
              { field: "region", comparison: "exact" as const },
              { field: "faction", comparison: "faction" as const },
              { field: "debut-version", comparison: "version" as const },
            ]
          : modeId === "currency-wars"
            ? [
                { field: "cost", comparison: "version" as const },
                { field: "position", comparison: "exact" as const },
                { field: "synergies", comparison: "faction" as const },
              ]
            : [{ field: "image", comparison: "exact" as const }],
      definitions:
        modeId === "aeon"
          ? mode.fields.filter((field) => field.id === "image")
          : selectSnapshotFieldDefinitions(mode.fields),
    },
  };
}

export async function loadMultiplayerContentSnapshot(
  db: D1Database,
  modeId: ContentModeId,
): Promise<MultiplayerContentSnapshot | null> {
  if (modeId !== "playable") return createStaticMultiplayerContentSnapshot(modeId);
  return loadPlayableMultiplayerContentSnapshot(db);
}
