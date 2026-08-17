import {
  LOCALES,
  type GameEntitySummary,
  type Locale,
  type SearchIndexEntry,
  type SearchIndexTerm,
} from "@fireflydle/contracts";

export type SearchMatchKind =
  "name-exact" | "name-prefix" | "term-exact" | "term-prefix" | "substring" | "id";

export interface EntitySearchResult<T extends Pick<GameEntitySummary, "id" | "names">> {
  entity: T;
  matchedText: string;
  matchedLocale: Locale | null;
  matchKind: SearchMatchKind;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function initialism(value: string): string | undefined {
  const words = normalizeSearchText(value).split(" ").filter(Boolean);
  if (words.length < 2 || words.some((word) => !/^[a-z0-9]+$/.test(word))) return undefined;
  return words.map((word) => word[0]).join("");
}

function uniqueTerms(terms: readonly SearchIndexTerm[]): SearchIndexTerm[] {
  const seen = new Set<string>();
  return terms.filter((term) => {
    const key = `${term.locale}:${term.normalized}`;
    if (!term.normalized || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 生成可直接发布的搜索键，运行时不再重复推导拼音或简称。 */
export function buildSearchIndexEntry(
  entity: Pick<GameEntitySummary, "id" | "names" | "aliases">,
): SearchIndexEntry {
  const names = LOCALES.map((locale) => ({
    value: entity.names[locale],
    normalized: normalizeSearchText(entity.names[locale]),
    locale,
  }));
  const terms = LOCALES.flatMap((locale) => {
    const values = entity.aliases[locale].flatMap((alias) => {
      const abbreviation = initialism(alias);
      return abbreviation ? [alias, abbreviation] : [alias];
    });
    const nameAbbreviation = initialism(entity.names[locale]);
    if (nameAbbreviation) values.push(nameAbbreviation);
    return values.map((value) => ({ value, normalized: normalizeSearchText(value), locale }));
  });
  return {
    entityId: entity.id,
    names,
    terms: uniqueTerms([...names, ...terms]).slice(names.length),
  };
}

interface RankedMatch {
  rank: number;
  term: SearchIndexTerm | null;
  kind: SearchMatchKind;
}

function firstTerm(
  terms: readonly SearchIndexTerm[],
  locale: Locale,
  predicate: (normalized: string) => boolean,
): SearchIndexTerm | undefined {
  return terms
    .filter((term) => predicate(term.normalized))
    .toSorted((left, right) => {
      const localeOrder = Number(right.locale === locale) - Number(left.locale === locale);
      return localeOrder || left.normalized.localeCompare(right.normalized, "en");
    })[0];
}

function rankEntry(
  entry: SearchIndexEntry,
  query: string,
  locale: Locale,
): RankedMatch | undefined {
  const exactName = firstTerm(entry.names, locale, (value) => value === query);
  if (exactName) return { rank: 0, term: exactName, kind: "name-exact" };
  const namePrefix = firstTerm(entry.names, locale, (value) => value.startsWith(query));
  if (namePrefix) return { rank: 1, term: namePrefix, kind: "name-prefix" };
  const exactTerm = firstTerm(entry.terms, locale, (value) => value === query);
  if (exactTerm) return { rank: 2, term: exactTerm, kind: "term-exact" };
  const termPrefix = firstTerm(entry.terms, locale, (value) => value.startsWith(query));
  if (termPrefix) return { rank: 3, term: termPrefix, kind: "term-prefix" };
  const substring = firstTerm([...entry.names, ...entry.terms], locale, (value) =>
    value.includes(query),
  );
  if (substring) return { rank: 4, term: substring, kind: "substring" };
  if (normalizeSearchText(entry.entityId).includes(query)) {
    return { rank: 5, term: null, kind: "id" };
  }
  return undefined;
}

export function searchEntities<T extends Pick<GameEntitySummary, "id" | "names">>(
  query: string,
  locale: Locale,
  entities: readonly T[],
  index: readonly SearchIndexEntry[],
  excludedIds: ReadonlySet<string> = new Set(),
): EntitySearchResult<T>[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  return index
    .flatMap((entry) => {
      const entity = entitiesById.get(entry.entityId);
      if (!entity || excludedIds.has(entity.id)) return [];
      const match = rankEntry(entry, normalizedQuery, locale);
      if (!match) return [];
      return [{ entry, entity, match }];
    })
    .toSorted(
      (left, right) =>
        left.match.rank - right.match.rank || left.entity.id.localeCompare(right.entity.id, "en"),
    )
    .map(({ entity, match }) => ({
      entity,
      matchedText: match.term?.value ?? entity.id,
      matchedLocale: match.term?.locale ?? null,
      matchKind: match.kind,
    }));
}
