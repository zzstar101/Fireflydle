import type { ContentManifest, GameEntitySummary, GuessResult } from "@fireflydle/contracts";

export type SoloContentMode = "playable" | "npc" | "currency-wars" | "aeon";

export interface SoloModeRuntime {
  contentModeId: SoloContentMode;
  manifest: ContentManifest;
  roster: readonly GameEntitySummary[];
  createGuessResult: (target: GameEntitySummary, guess: GameEntitySummary) => GuessResult;
}
