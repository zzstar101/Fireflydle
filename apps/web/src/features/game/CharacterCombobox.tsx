import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search, Send } from "lucide-react";
import type { Character, Locale } from "@fireflydle/contracts";
import { getSearchText } from "@fireflydle/game-data";
import { useTranslation } from "react-i18next";
import { CharacterAvatar } from "../../components/CharacterAvatar";

export function CharacterCombobox({
  characters,
  locale,
  excludedIds,
  disabled,
  onSubmit,
}: {
  characters: readonly Character[];
  locale: Locale;
  excludedIds: ReadonlySet<string>;
  disabled: boolean;
  onSubmit: (characterId: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return characters
      .filter((character) => !excludedIds.has(character.id))
      .filter((character) => getSearchText(character).includes(normalized))
      .slice(0, 9);
  }, [characters, excludedIds, query]);

  const select = (character: Character) => {
    setSelectedId(character.id);
    setQuery(character.names[locale]);
    setOpen(false);
  };

  const submit = () => {
    if (!selectedId && !query.trim()) return;
    const fallback = results[highlighted];
    const id = selectedId ?? fallback?.id;
    if (!id || disabled) return;
    onSubmit(id);
    setSelectedId(null);
    setQuery("");
    setHighlighted(0);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setHighlighted((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && query.trim() && results[highlighted]) select(results[highlighted]);
      else submit();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="guess-composer">
      <label className="combobox-label" htmlFor="character-search">
        {t("game.prompt")}
      </label>
      <div className="combobox-row">
        <div className="character-combobox">
          <Search size={19} aria-hidden="true" />
          <input
            ref={inputRef}
            id="character-search"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && Boolean(query.trim())}
            aria-controls="character-results"
            aria-activedescendant={
              open && results[highlighted]
                ? `character-option-${results[highlighted].id}`
                : undefined
            }
            autoComplete="off"
            placeholder={t("game.placeholder")}
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(Boolean(query.trim()))}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setSelectedId(null);
              setHighlighted(0);
              setOpen(Boolean(value.trim()));
            }}
            onKeyDown={onKeyDown}
          />
          {open && !disabled && Boolean(query.trim()) && (
            <div id="character-results" className="combobox-results" role="listbox">
              {results.length === 0 ? (
                <p className="no-results">{t("game.noResult")}</p>
              ) : (
                results.map((character, index) => (
                  <button
                    id={`character-option-${character.id}`}
                    key={character.id}
                    type="button"
                    role="option"
                    aria-selected={index === highlighted}
                    className={index === highlighted ? "highlighted" : undefined}
                    onMouseEnter={() => setHighlighted(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(character)}
                  >
                    <CharacterAvatar character={character} size="small" />
                    <strong>{character.names[locale]}</strong>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          className="ticket-button guess-submit"
          type="button"
          onClick={submit}
          disabled={disabled || (!selectedId && (!query.trim() || results.length === 0))}
        >
          <Send size={17} aria-hidden="true" /> <span>{t("game.submit")}</span>
        </button>
      </div>
    </div>
  );
}
