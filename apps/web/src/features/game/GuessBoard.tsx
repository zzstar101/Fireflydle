import { ArrowDown, ArrowUp, Check, CircleDot, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GuessCell, GuessResult, Locale } from "@fireflydle/contracts";
import { elementLabels, getFactionName, pathLabels } from "@fireflydle/game-data";
import { CharacterAvatar } from "../../components/CharacterAvatar";

const fieldKeys = ["element", "path", "rarity", "faction", "version"] as const;

function StatusIcon({ cell }: { cell: GuessCell }) {
  if (cell.direction === "higher") return <ArrowUp size={17} aria-hidden="true" />;
  if (cell.direction === "lower") return <ArrowDown size={17} aria-hidden="true" />;
  if (cell.state === "exact") return <Check size={17} aria-hidden="true" />;
  if (cell.state === "close") return <CircleDot size={16} aria-hidden="true" />;
  return <X size={16} aria-hidden="true" />;
}

function cellValue(guess: GuessResult, field: (typeof fieldKeys)[number], locale: Locale): string {
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
  }
}

export function GuessBoard({
  guesses,
  locale,
}: {
  guesses: readonly GuessResult[];
  locale: Locale;
}) {
  const { t } = useTranslation();
  return (
    <section className="guess-board-section" aria-live="polite">
      <div className="guess-board-scroll">
        <table className="guess-board">
          <thead>
            <tr>
              <th>{locale === "en" ? "Character" : locale === "ja" ? "キャラクター" : "角色"}</th>
              {fieldKeys.map((field) => (
                <th key={field}>{t(`game.${field}`)}</th>
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
                {fieldKeys.map((field) => {
                  const status = guess.cells.find((cell) => cell.field === field);
                  if (!status) return <td key={field}>—</td>;
                  return (
                    <td key={field} className={`feedback-cell state-${status.state}`}>
                      <span className="feedback-icon">
                        <StatusIcon cell={status} />
                      </span>
                      <strong>{cellValue(guess, field, locale)}</strong>
                      <small>{t(`game.${status.state}`)}</small>
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
