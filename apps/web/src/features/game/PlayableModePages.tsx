import type { Character, GameEntitySummary } from "@fireflydle/contracts";
import { characters, contentManifest } from "@fireflydle/game-data/playable";
import {
  createGuessResultWithRules,
  snapshotRulesFromFieldDefinitions,
} from "@fireflydle/game-engine";
import { EndlessPage } from "./EndlessPage";
import { ModeGamePage } from "./GamePage";
import type { SoloModeRuntime } from "./mode-runtime";

const playableMode = contentManifest.modes.find((mode) => mode.id === "playable");
if (!playableMode) throw new Error("普通角色模式未注册");
const rules = snapshotRulesFromFieldDefinitions(playableMode.fields);

const runtime: SoloModeRuntime = {
  contentModeId: "playable",
  manifest: contentManifest,
  roster: characters,
  createGuessResult: (target: GameEntitySummary, guess: GameEntitySummary) =>
    createGuessResultWithRules(target as Character, guess as Character, rules),
};

export default function PlayableGamePage({ activityId }: { activityId: "daily" | "practice" }) {
  return <ModeGamePage activityId={activityId} runtime={runtime} />;
}

export function PlayableEndlessPage() {
  return <EndlessPage contentModeId="playable" bundledRoster={characters} />;
}
