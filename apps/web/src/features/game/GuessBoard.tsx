import { ArrowDown, ArrowUp, Check, CircleDot, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FieldDefinition, GuessCell, GuessResult, Locale } from "@fireflydle/contracts";
import { contentManifest, elementLabels, getFactionName, pathLabels } from "@fireflydle/game-data";
import { selectSnapshotFieldDefinitions } from "@fireflydle/game-engine";
import { CharacterAvatar } from "../../components/CharacterAvatar";

const legacyFields = selectSnapshotFieldDefinitions(
  contentManifest.modes.find((mode) => mode.id === "playable")?.fields ?? [],
);

function StatusIcon({ cell }: { cell: GuessCell }) {
  if (cell.direction === "higher") return <ArrowUp size={17} aria-hidden="true" />;
  if (cell.direction === "lower") return <ArrowDown size={17} aria-hidden="true" />;
  if (cell.state === "exact") return <Check size={17} aria-hidden="true" />;
  if (cell.state === "close") return <CircleDot size={16} aria-hidden="true" />;
  return <X size={16} aria-hidden="true" />;
}

function cellValue(guess: GuessResult, field: string, locale: Locale): string {
  switch (field) {
    case "element":
      return elementLabels[guess.character.element][locale];
    case "path":
      return pathLabels[guess.character.path][locale];
    case "rarity":
      return `${guess.character.rarity} ★`;
    case "faction":
      return getFactionName(guess.character.factionId, locale);
    case "version":
      return `V${guess.character.releaseVersionId}`;
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
}: {
  guesses: readonly GuessResult[];
  locale: Locale;
  fields?: readonly FieldDefinition[] | undefined;
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
            {guesses.map((guess, rowIndex) => (
              <tr
                key={`${guess.character.id}-${guess.guessedAt}`}
                style={{ "--row-delay": `${Math.min(rowIndex, 5) * 35}ms` } as React.CSSProperties}
              >
                <th scope="row">
                  <CharacterAvatar character={guess.character} size="medium" />
                  <span>
                    {guess.character.names[locale]}
                    <small>{guess.character.names.en}</small>
                  </span>
                </th>
                {visibleFields.map((field) => {
                  const status =
                    guess.cells.find((cell) => cell.field === field.id) ??
                    ({
                      field: field.id,
                      state: "unavailable",
                      direction: "none",
                    } satisfies GuessCell);
                  const direction = directionLabel(status, t);
                  const value = cellValue(guess, field.id, locale);
                  return (
                    <td
                      key={field.id}
                      className={`feedback-cell state-${status.state}`}
                      aria-label={`${field.label[locale]}: ${value}; ${t(`game.${status.state}`)}${direction ? `; ${direction}` : ""}`}
                    >
                      <span className="feedback-icon">
                        <StatusIcon cell={status} />
                      </span>
                      <strong>{value}</strong>
                      <small>{t(`game.${status.state}`)}</small>
                      {direction ? <small className="feedback-direction">{direction}</small> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
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
