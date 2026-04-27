function normalizeAliasKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

const SERIES_QUERY_ALIASES = new Map<string, string[]>([
  ['jjk', ['Jujutsu Kaisen']],
  ['jujutsu', ['Jujutsu Kaisen']],
  ['frieren', ['Sousou no Frieren']],
  ['tensura', ['Tensei shitara Slime Datta Ken']],
  ['slime datta ken', ['Tensei shitara Slime Datta Ken']],
  ['that time i got reincarnated as a slime', ['Tensei shitara Slime Datta Ken']],
  ['ngnl', ['No Game No Life']],
  ['no game no life', ['No Game No Life']],
  ['mob psycho', ['Mob Psycho 100']],
  ['mob psycho 100', ['Mob Psycho 100']],
  ['mob 100', ['Mob Psycho 100']],
]);

const PUBLIC_SERIES_SEARCH_OVERRIDES = new Set([
  'ngnl',
  'no game no life',
]);

export function expandSeriesSearchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const normalizedQuery = normalizeAliasKey(trimmed);
  const seen = new Set<string>();
  const terms: string[] = [];

  const push = (value: string) => {
    const candidate = value.trim();
    const key = normalizeAliasKey(candidate);
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    terms.push(candidate);
  };

  push(trimmed);

  for (const [alias, mappedTerms] of SERIES_QUERY_ALIASES.entries()) {
    if (!normalizedQuery.includes(alias)) {
      continue;
    }

    for (const mappedTerm of mappedTerms) {
      push(mappedTerm);
    }
  }

  return terms;
}

export function shouldAllowPublicSeriesSearch(query: string): boolean {
  return PUBLIC_SERIES_SEARCH_OVERRIDES.has(normalizeAliasKey(query));
}
