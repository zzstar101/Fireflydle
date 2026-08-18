import { ArrowDown, ArrowUp, Check, CircleDot, CloudFog, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FieldDefinition, GuessCell, GuessResult, Locale } from "@fireflydle/contracts";
import {
  contentManifest,
  elementLabels,
  getFactionName,
  getRegionName,
  pathLabels,
} from "@fireflydle/game-data/playable";
import { selectSnapshotFieldDefinitions } from "@fireflydle/game-engine";
import { CharacterAvatar } from "../../components/CharacterAvatar";

const legacyFields = selectSnapshotFieldDefinitions(
  contentManifest.modes.find((mode) => mode.id === "playable")?.fields ?? [],
);

function StatusIcon({ cell }: { cell: GuessCell }) {
  if (cell.state === "fog") return <CloudFog size={17} aria-hidden="true" />;
  if (cell.direction === "higher") return <ArrowUp size={17} aria-hidden="true" />;
  if (cell.direction === "lower") return <ArrowDown size={17} aria-hidden="true" />;
  if (cell.state === "exact") return <Check size={17} aria-hidden="true" />;
  if (cell.state === "close") return <CircleDot size={16} aria-hidden="true" />;
  return <X size={16} aria-hidden="true" />;
}

function cellValue(guess: GuessResult, field: string, locale: Locale): string {
  switch (field) {
    case "cost":
      return "cost" in guess.character ? String(guess.character.cost) : "—";
    case "position": {
      if (!("position" in guess.character)) return "—";
      return {
        front: locale === "zh-CN" ? "前台" : locale === "ja" ? "前衛" : "Front",
        back: locale === "zh-CN" ? "后台" : locale === "ja" ? "後衛" : "Back",
        "front-back": locale === "zh-CN" ? "前后台" : locale === "ja" ? "前後" : "Front / back",
      }[guess.character.position];
    }
    case "synergies":
      return "—";
    case "element":
      return "element" in guess.character ? elementLabels[guess.character.element][locale] : "—";
    case "path":
      return "path" in guess.character ? pathLabels[guess.character.path][locale] : "—";
    case "rarity":
      return "rarity" in guess.character ? `${guess.character.rarity} ★` : "—";
    case "faction":
      return "factionId" in guess.character
        ? getFactionName(guess.character.factionId, locale)
        : "—";
    case "region":
      return "regionId" in guess.character ? getRegionName(guess.character.regionId, locale) : "—";
    case "version":
      return "releaseVersionId" in guess.character ? `V${guess.character.releaseVersionId}` : "—";
    case "debut-version":
      return "debutVersionId" in guess.character ? `V${guess.character.debutVersionId}` : "—";
    default: {
      const value = (guess.character as unknown as Record<string, unknown>)[field];
      return value === undefined || value === null ? "—" : String(value);
    }
  }
}

function directionLabel(cell: GuessCell, t: (key: string) => string): string | null {
  if (cell.direction === "higher") return `↑ ${t("game.higher")}`;
  if (cell.direction === "lower") return `↓ ${t("game.lower")}`;
  return null;
}

export function GuessBoard({
  guesses,
  locale,
  fields,
  animateLatest = false,
}: {
  guesses: readonly GuessResult[];
  locale: Locale;
  fields?: readonly FieldDefinition[] | undefined;
  animateLatest?: boolean;
}) {
  const { t } = useTranslation();
  const definitions = fields ?? legacyFields;
  const observedFields = new Set(guesses.flatMap((guess) => guess.cells.map((cell) => cell.field)));
  const visibleFields =
    fields || guesses.length === 0
      ? definitions
      : definitions.filter((definition) => observedFields.has(definition.id));
  return (
    <section className="guess-board-section" aria-live="polite">
      <div className="guess-board-scroll">
        <table
          className="guess-board"
          style={{ minWidth: `${175 + Math.max(1, visibleFields.length) * 142}px` }}
        >
          <thead>
            <tr>
              <th>{locale === "en" ? "Character" : locale === "ja" ? "キャラクター" : "角色"}</th>
              {visibleFields.map((field) => (
                <th key={field.id}>{field.label[locale]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guesses.map((guess, rowIndex) => {
              const isLatest = animateLatest && rowIndex === guesses.length - 1;
              return (
                <tr
                  key={`${guess.character.id}-${guess.guessedAt}`}
                  className={`guess-row${isLatest ? " is-latest" : ""}${guess.isCorrect ? " is-correct" : " is-incorrect"}`}
                >
                  <th scope="row">
                    <CharacterAvatar character={guess.character} size="medium" />
                    <span>
                      {guess.character.names[locale]}
                      <small>{guess.character.names.en}</small>
                    </span>
                  </th>
                  {visibleFields.map((field, fieldIndex) => {
                    const status =
                      guess.cells.find((cell) => cell.field === field.id) ??
                      ({
                        field: field.id,
                        state: "unavailable",
                        direction: "none",
                      } satisfies GuessCell);
                    const direction = directionLabel(status, t);
                    const value = status.state === "fog" ? "?" : cellValue(guess, field.id, locale);
                    return (
                      <td
                        key={field.id}
                        className={`feedback-cell state-${status.state} direction-${status.direction}`}
                        style={
                          {
                            "--cell-delay": `${90 + fieldIndex * 105}ms`,
                          } as React.CSSProperties
                        }
                        aria-label={`${field.label[locale]}: ${value}; ${t(`game.${status.state}`)}${direction ? `; ${direction}` : ""}`}
                      >
                        <span className="feedback-icon">
                          <StatusIcon cell={status} />
                        </span>
                        <strong>{value}</strong>
                        <small>{t(`game.${status.state}`)}</small>
                        {direction ? (
                          <small className="feedback-direction">{direction}</small>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {guesses.length === 0 && (
        <div className="board-empty">
          <span className="empty-orbit" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2>{t("game.emptyTitle")}</h2>
          <p>{t("game.emptyBody")}</p>
        </div>
      )}
    </section>
  );
}
