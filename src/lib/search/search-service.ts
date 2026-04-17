import 'server-only';

import { searchManga } from '@/lib/adapters/comic-server';
import { searchMovieCatalog } from '@/lib/adapters/movie';
import { searchSeriesCatalog } from '@/lib/adapters/series';
import {
  formatComicCardSubtitle,
  formatMovieCardMetaLine,
  formatMovieCardSubtitle,
  getComicCardBadgeText,
  getMovieCardBadgeText,
} from '@/lib/card-presentation';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesCardItem,
} from '@/lib/series-presentation';
import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import type { MangaSearchResult, MovieCardItem } from '@/lib/types';
import {
  getSearchGroupLabel,
  type SearchDomain,
  type SearchIndexDocument,
  type SearchResultGroup,
  type SearchResultItem,
  type UnifiedSearchResult,
} from './search-contract';
import { searchIndexedDocuments, upsertSearchDocuments } from './opensearch';

type UnifiedSearchOptions = {
  domain?: SearchDomain;
  limit?: number;
  includeNsfw?: boolean;
};

const SEARCH_RESPONSE_TTL_SECONDS = 60 * 3;

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit)) {
    return 6;
  }
  return Math.min(Math.max(Number(limit), 1), 24);
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

function toResultItem(document: SearchIndexDocument & { score?: number }): SearchResultItem {
  return {
    id: document.id,
    href: document.href,
    title: document.title,
    image: document.image,
    subtitle: document.subtitle,
    metaLine: document.metaLine,
    badgeText: document.badgeText,
    routeType: document.routeType,
    theme: document.theme,
    score: document.score,
  };
}

function buildGroups(
  documents: Array<SearchIndexDocument & { score?: number }>,
  domain: SearchDomain,
  limit: number,
): SearchResultGroup[] {
  const domains = domain === 'all' ? (['series', 'movies', 'comic'] as const) : [domain];

  return domains
    .map((groupDomain) => {
      const items = documents
        .filter((document) => document.routeType === groupDomain)
        .slice(0, limit)
        .map(toResultItem);

      if (items.length === 0) {
        return null;
      }

      return {
        key: groupDomain,
        label: getSearchGroupLabel(groupDomain),
        total: items.length,
        items,
      } satisfies SearchResultGroup;
    })
    .filter((group): group is SearchResultGroup => group !== null);
}

function buildResult(
  query: string,
  domain: SearchDomain,
  source: UnifiedSearchResult['source'],
  documents: Array<SearchIndexDocument & { score?: number }>,
  limit: number,
): UnifiedSearchResult {
  const groups = buildGroups(documents, domain, limit);
  const flattened = groups.flatMap((group) => group.items);

  return {
    query,
    domain,
    source: flattened.length > 0 ? source : 'empty',
    total: flattened.length,
    topMatch: flattened[0] || null,
    groups,
  };
}

function toSeriesDocument(item: SeriesCardItem, rank: number): SearchIndexDocument {
  return {
    id: `series:${item.slug}`,
    slug: item.slug,
    href: `/series/${item.slug}`,
    title: item.title,
    image: item.poster,
    subtitle: formatSeriesCardSubtitle(item) || undefined,
    badgeText: getSeriesBadgeText(item.type || 'anime'),
    routeType: 'series',
    theme: getSeriesTheme(item.type || 'anime'),
    keywords: [item.type || '', item.country || '', item.latestEpisode || ''].filter(Boolean),
    popularity: Math.max(1, 200 - rank),
  };
}

function toMovieDocument(item: MovieCardItem, rank: number): SearchIndexDocument {
  return {
    id: `movies:${item.slug}`,
    slug: item.slug,
    href: `/movies/${item.slug}`,
    title: item.title,
    image: item.poster,
    subtitle: formatMovieCardSubtitle(item) || undefined,
    metaLine: formatMovieCardMetaLine(item) || undefined,
    badgeText: getMovieCardBadgeText(),
    routeType: 'movies',
    theme: 'movie',
    keywords: [item.genres || '', item.year || '', item.type || ''].filter(Boolean),
    popularity: Math.max(1, 200 - rank),
  };
}

function toComicDocument(item: MangaSearchResult, rank: number): SearchIndexDocument {
  return {
    id: `comic:${item.slug}`,
    slug: item.slug,
    href: `/comics/${item.slug}`,
    title: item.title,
    image: item.thumbnail || item.image,
    subtitle: formatComicCardSubtitle(item) || undefined,
    badgeText: getComicCardBadgeText(item) || undefined,
    routeType: 'comic',
    theme: 'manga',
    keywords: [item.type || '', item.genre || '', item.subtype || ''].filter(Boolean),
    popularity: Math.max(1, 200 - rank),
  };
}

async function searchFallbackDocuments(
  query: string,
  domain: SearchDomain,
  limit: number,
  includeNsfw: boolean,
): Promise<SearchIndexDocument[]> {
  const perDomainLimit = domain === 'all' ? limit : Math.max(limit, 8);
  const options = { includeNsfw };
  const [seriesItems, movieItems, comicItems] = await Promise.all([
    domain === 'all' || domain === 'series'
      ? searchSeriesCatalog(query, perDomainLimit, options).catch(() => [])
      : Promise.resolve([] as SeriesCardItem[]),
    domain === 'all' || domain === 'movies'
      ? searchMovieCatalog(query, perDomainLimit, options).catch(() => [])
      : Promise.resolve([] as MovieCardItem[]),
    domain === 'all' || domain === 'comic'
      ? searchManga(query, 1, perDomainLimit, options).then((response) => response.data || []).catch(() => [])
      : Promise.resolve([] as MangaSearchResult[]),
  ]);

  return [
    ...seriesItems.map((item, index) => toSeriesDocument(item, index)),
    ...movieItems.map((item, index) => toMovieDocument(item, index)),
    ...comicItems.map((item, index) => toComicDocument(item, index)),
  ];
}

export async function searchUnifiedTitles(
  query: string,
  options: UnifiedSearchOptions = {},
): Promise<UnifiedSearchResult> {
  const normalizedQuery = normalizeQuery(query);
  const domain = options.domain ?? 'all';
  const limit = normalizeLimit(options.limit);
  const includeNsfw = options.includeNsfw === true;

  if (normalizedQuery.length < 2) {
    return {
      query: normalizedQuery,
      domain,
      source: 'empty',
      total: 0,
      topMatch: null,
      groups: [],
    };
  }

  const visibility = includeNsfw ? 'auth' : 'public';
  const cacheKey = buildComicCacheKey('search', 'unified', visibility, domain, normalizedQuery.toLowerCase(), limit);

  return rememberComicCacheValue(cacheKey, SEARCH_RESPONSE_TTL_SECONDS, async () => {
    const indexedDocuments = await searchIndexedDocuments({
      query: normalizedQuery,
      domain,
      limit,
    });

    if (indexedDocuments && indexedDocuments.length > 0) {
      return buildResult(normalizedQuery, domain, 'opensearch', indexedDocuments, limit);
    }

    const fallbackDocuments = await searchFallbackDocuments(normalizedQuery, domain, limit, includeNsfw);
    if (fallbackDocuments.length > 0) {
      void upsertSearchDocuments(fallbackDocuments);
    }

    return buildResult(normalizedQuery, domain, 'fallback', fallbackDocuments, limit);
  });
}

export async function warmSearchIndexDocuments(documents: SearchIndexDocument[]): Promise<void> {
  if (documents.length === 0) {
    return;
  }

  void upsertSearchDocuments(documents);
}

export function buildSearchWarmDocuments(input: {
  series?: SeriesCardItem[];
  movies?: MovieCardItem[];
  comics?: MangaSearchResult[];
}): SearchIndexDocument[] {
  const documents: SearchIndexDocument[] = [];

  for (const [index, item] of (input.series || []).entries()) {
    documents.push(toSeriesDocument(item, index));
  }

  for (const [index, item] of (input.movies || []).entries()) {
    documents.push(toMovieDocument(item, index));
  }

  for (const [index, item] of (input.comics || []).entries()) {
    documents.push(toComicDocument(item, index));
  }

  return documents;
}
