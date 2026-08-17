import type { Character } from "@fireflydle/contracts";
import { contentManifest } from "@fireflydle/game-data";
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
