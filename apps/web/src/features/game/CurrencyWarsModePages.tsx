import type { CurrencyWarsUnitSummary, GameEntitySummary } from "@fireflydle/contracts";
import {
  currencyWarsManifest,
  currencyWarsRuleset,
  currencyWarsUnitSummaries,
} from "@fireflydle/game-data/currency-wars";
import { createCurrencyWarsGuessResult } from "@fireflydle/game-engine";
import { useSpecialModePack } from "../../offline/use-special-mode-pack";
import { EndlessPage } from "./EndlessPage";
import { ModeGamePage } from "./GamePage";
import type { SoloModeRuntime } from "./mode-runtime";

const runtime: SoloModeRuntime = {
  contentModeId: "currency-wars",
  manifest: currencyWarsManifest,
  roster: currencyWarsUnitSummaries,
  createGuessResult: (target: GameEntitySummary, guess: GameEntitySummary) =>
    createCurrencyWarsGuessResult(
      currencyWarsRuleset.units.find((unit) => unit.id === target.id)!,
      currencyWarsRuleset.units.find((unit) => unit.id === guess.id)!,
    ),
};

export default function CurrencyWarsGamePage() {
  return <ModeGamePage activityId="practice" runtime={runtime} />;
}

export function CurrencyWarsEndlessPage() {
  useSpecialModePack("currency-wars", true);
  return (
    <EndlessPage
      contentModeId="currency-wars"
      bundledRoster={currencyWarsUnitSummaries as readonly CurrencyWarsUnitSummary[]}
    />
  );
}
