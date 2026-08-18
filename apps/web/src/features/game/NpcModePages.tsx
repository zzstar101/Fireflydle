import type { GameEntitySummary, NpcSummary } from "@fireflydle/contracts";
import { npcEntities, npcManifest, npcSummary } from "@fireflydle/game-data/npc";
import { createNpcGuessResult } from "@fireflydle/game-engine";
import { useSpecialModePack } from "../../offline/use-special-mode-pack";
import { EndlessPage } from "./EndlessPage";
import { ModeGamePage } from "./GamePage";
import type { SoloModeRuntime } from "./mode-runtime";

const roster = npcEntities.map(npcSummary);
const runtime: SoloModeRuntime = {
  contentModeId: "npc",
  manifest: npcManifest,
  roster,
  createGuessResult: (target: GameEntitySummary, guess: GameEntitySummary) =>
    createNpcGuessResult(target as NpcSummary, guess as NpcSummary),
};

export default function NpcGamePage() {
  return <ModeGamePage activityId="practice" runtime={runtime} />;
}

export function NpcEndlessPage() {
  useSpecialModePack("npc", true);
  return <EndlessPage contentModeId="npc" bundledRoster={roster} />;
}
