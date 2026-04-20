type SearchDomain = 'all' | 'series' | 'movies' | 'comic';

export type SearchOpenSearchInput = {
  query: string;
  domain: SearchDomain;
  limit: number;
};

const SEARCH_SOURCE_FIELDS = [
  'id',
  'slug',
  'href',
  'title',
  'image',
  'subtitle',
  'meta_line',
  'badge_text',
  'route_type',
  'theme',
  'keywords',
  'popularity',
  'updated_at',
] as const;

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeSearchSlugCandidate(value: string): string {
  return normalizeSearchQuery(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveSearchSize(domain: SearchDomain, limit: number): number {
  return domain === 'all'
    ? Math.min(Math.max(limit * 3, 18), 36)
    : Math.min(Math.max(limit, 8), 24);
}

function buildSearchFilters(domain: SearchDomain): Array<Record<string, unknown>> {
  return domain === 'all' ? [] : [{ term: { route_type: domain } }];
}

export function buildPrimarySearchRequestBody({
  query,
  domain,
  limit,
}: SearchOpenSearchInput): Record<string, unknown> {
  const normalizedQuery = normalizeSearchQuery(query);
  const slugCandidate = normalizeSearchSlugCandidate(normalizedQuery);
  const should: Array<Record<string, unknown>> = [
    {
      term: {
        title_exact: {
          value: normalizedQuery.toLowerCase(),
          boost: 24,
        },
      },
    },
    {
      match_phrase_prefix: {
        title: {
          query: normalizedQuery,
          boost: 10,
        },
      },
    },
    {
      multi_match: {
        query: normalizedQuery,
        type: 'bool_prefix',
        fields: ['title^8', 'title._2gram^4', 'title._3gram^2'],
      },
    },
  ];

  if (slugCandidate.length >= 2) {
    should.unshift({
      prefix: {
        slug: {
          value: slugCandidate,
          boost: 20,
        },
      },
    });
  }

  return {
    size: resolveSearchSize(domain, limit),
    _source: SEARCH_SOURCE_FIELDS,
    query: {
      bool: {
        filter: buildSearchFilters(domain),
        should,
        minimum_should_match: 1,
      },
    },
    sort: [
      { _score: { order: 'desc' } },
      { popularity: { order: 'desc' } },
      { updated_at: { order: 'desc' } },
    ],
  };
}

export function buildFuzzySearchRequestBody({
  query,
  domain,
  limit,
}: SearchOpenSearchInput): Record<string, unknown> {
  const normalizedQuery = normalizeSearchQuery(query);

  return {
    size: resolveSearchSize(domain, limit),
    _source: SEARCH_SOURCE_FIELDS,
    query: {
      bool: {
        filter: buildSearchFilters(domain),
        should: [
          {
            multi_match: {
              query: normalizedQuery,
              fields: ['title^4', 'subtitle^2', 'meta_line', 'keywords^2'],
              fuzziness: 'AUTO',
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
    sort: [
      { _score: { order: 'desc' } },
      { popularity: { order: 'desc' } },
      { updated_at: { order: 'desc' } },
    ],
  };
}
