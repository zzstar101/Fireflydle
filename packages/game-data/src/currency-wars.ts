import {
  ContentManifestSchema,
  CurrencyWarsRulesetSchema,
  CurrencyWarsUnitSummarySchema,
  type CurrencyWarsUnit,
  type CurrencyWarsUnitSummary,
} from "@fireflydle/contracts";
import currencyWarsManifestData from "./data/currency-wars-manifest.json";
import { getEntitySearchText } from "./playable";

export const currencyWarsManifest = Object.freeze(
  ContentManifestSchema.parse(currencyWarsManifestData),
);
export const currencyWarsRuleset = Object.freeze(
  CurrencyWarsRulesetSchema.parse(currencyWarsManifest.currencyWars),
);
export const currencyWarsUnits: readonly CurrencyWarsUnit[] = Object.freeze(
  currencyWarsRuleset.units,
);

export function currencyWarsSummary(unit: CurrencyWarsUnit): CurrencyWarsUnitSummary {
  return CurrencyWarsUnitSummarySchema.parse({
    id: unit.id,
    names: unit.names,
    aliases: unit.aliases,
    cost: unit.cost,
    position: unit.position,
    assets: unit.assets,
  });
}

export const currencyWarsUnitSummaries: readonly CurrencyWarsUnitSummary[] = Object.freeze(
  currencyWarsUnits.map(currencyWarsSummary),
);

export function getCurrencyWarsSearchText(
  unit: Pick<CurrencyWarsUnit, "names" | "aliases">,
): string {
  return getEntitySearchText(unit);
}
