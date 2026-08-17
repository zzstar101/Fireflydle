import type { AeonSummary, GameEntitySummary } from "@fireflydle/contracts";
import { aeonEntities, aeonManifest } from "@fireflydle/game-data/aeon";
import { createAeonGuessResult } from "@fireflydle/game-engine";
import { useSpecialModePack } from "../../offline/use-special-mode-pack";
import { EndlessPage } from "./EndlessPage";
import { ModeGamePage } from "./GamePage";
import type { SoloModeRuntime } from "./mode-runtime";

const runtime: SoloModeRuntime = {
  contentModeId: "aeon",
  manifest: aeonManifest,
  roster: aeonEntities,
  createGuessResult: (target: GameEntitySummary, guess: GameEntitySummary) =>
    createAeonGuessResult(target as AeonSummary, guess as AeonSummary),
};

export default function AeonGamePage() {
  return <ModeGamePage activityId="practice" runtime={runtime} />;
}

export function AeonEndlessPage() {
  useSpecialModePack("aeon", true);
  return <EndlessPage contentModeId="aeon" bundledRoster={aeonEntities} />;
}
