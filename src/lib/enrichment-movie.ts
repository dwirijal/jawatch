import 'server-only';

import {
  ENRICHMENT_CACHE_TTL,
  fetchJson,
  IMDB_SEARCH_URL,
  readText,
  scoreTitleSimilarity,
  TMDB_BASE_URL,
  type MovieVisuals,
  type TMDBImageSize,
  withRuntimeCache,
} from './enrichment-shared.ts';

type TMDBMovieSearchResult = {
  title?: string;
  original_title?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
};

function readTMDBAsset(value: unknown): string {
  const trimmed = readText(value);
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (/^https:\/\/image\.tmdb\.org\/t\/p\//i.test(trimmed)) {
    return trimmed;
  }

  return '';
}

export function buildTMDBImageUrl(path: unknown, size: TMDBImageSize = 'w500'): string {
  const trimmed = readTMDBAsset(path);
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (!trimmed.startsWith('/')) {
    return '';
  }
  return `https://image.tmdb.org/t/p/${size}${trimmed}`;
}

export function resolveMovieVisuals(input: {
  poster?: unknown;
  poster_path?: unknown;
  image?: unknown;
  poster_url?: unknown;
  backdrop?: unknown;
  backdrop_path?: unknown;
}): MovieVisuals {
  return {
    poster: buildTMDBImageUrl(input.poster_path),
    backdrop: buildTMDBImageUrl(input.backdrop_path, 'w1280'),
  };
}

function normalizeMovieLookupTitle(title: string): string {
  return title
    .replace(/\s*\(\d{4}\)\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readTMDBYear(value: unknown): string {
  const text = readText(value);
  if (/^\d{4}$/u.test(text)) {
    return text;
  }
  return '';
}

function getTMDBCredential(): { token?: string; apiKey?: string } {
  const token =
    process.env.TMDB_ACCESS_TOKEN ||
    process.env.TMDB_API_READ_ACCESS_TOKEN ||
    process.env.TMDB_BEARER_TOKEN ||
    '';
  const apiKey = process.env.TMDB_API_KEY || '';

  return {
    token: token.trim() || undefined,
    apiKey: apiKey.trim() || undefined,
  };
}

async function fetchTMDBMovieSearch(title: string, year?: string): Promise<TMDBMovieSearchResult[]> {
  const credential = getTMDBCredential();
  if (!credential.token && !credential.apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    query: title,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });

  if (year) {
    params.set('year', year);
  }
  if (!credential.token && credential.apiKey) {
    params.set('api_key', credential.apiKey);
  }

  const url = `${TMDB_BASE_URL}/search/movie?${params.toString()}`;
  const headers: HeadersInit = { Accept: 'application/json' };

  if (credential.token) {
    headers.Authorization = `Bearer ${credential.token}`;
  }

  try {
    const data = await fetchJson<{ results?: TMDBMovieSearchResult[] }>(url, headers);
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

function pickBestTMDBMovieResult(title: string, year: string, results: TMDBMovieSearchResult[]): TMDBMovieSearchResult | null {
  const normalizedYear = readTMDBYear(year);
  const normalizedTitle = normalizeMovieLookupTitle(title);

  const ranked = results
    .map((item) => {
      const titleScore = Math.max(
        scoreTitleSimilarity(normalizedTitle, item.title),
        scoreTitleSimilarity(normalizedTitle, item.original_title),
      );
      const releaseYear = readTMDBYear(item.release_date?.slice(0, 4));
      const yearScore = normalizedYear && releaseYear === normalizedYear ? 0.08 : 0;

      return {
        item,
        score: titleScore + yearScore,
      };
    })
    .filter((entry) => entry.score >= 0.72)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.item ?? null;
}

async function lookupTMDBMovieVisuals(title: string, year?: string): Promise<MovieVisuals | null> {
  if (typeof window !== 'undefined') {
    return null;
  }

  const normalizedTitle = normalizeMovieLookupTitle(title);
  if (!normalizedTitle) {
    return null;
  }

  const normalizedYear = readTMDBYear(year);

  return withRuntimeCache(`tmdb:movie:${normalizedTitle.toLowerCase()}:${normalizedYear}`, ENRICHMENT_CACHE_TTL.long, async () => {
    const [withYearResults, withoutYearResults] = await Promise.all([
      fetchTMDBMovieSearch(normalizedTitle, normalizedYear || undefined),
      normalizedYear ? fetchTMDBMovieSearch(normalizedTitle) : Promise.resolve([]),
    ]);

    const best =
      pickBestTMDBMovieResult(normalizedTitle, normalizedYear, withYearResults) ||
      pickBestTMDBMovieResult(normalizedTitle, normalizedYear, withoutYearResults);

    if (!best) {
      return null;
    }

    return {
      poster: buildTMDBImageUrl(best.poster_path),
      backdrop: buildTMDBImageUrl(best.backdrop_path, 'w1280'),
    };
  });
}

export async function enrichMovieVisuals(
  input: {
    poster?: unknown;
    poster_path?: unknown;
    image?: unknown;
    poster_url?: unknown;
    backdrop?: unknown;
    backdrop_path?: unknown;
  },
  context: {
    title: string;
    year?: unknown;
  },
): Promise<MovieVisuals> {
  const direct = resolveMovieVisuals(input);
  if (direct.poster && direct.backdrop) {
    return direct;
  }

  const enriched = await lookupTMDBMovieVisuals(context.title, readText(context.year));

  return {
    poster: direct.poster || enriched?.poster || '',
    backdrop: direct.backdrop || enriched?.backdrop || '',
  };
}

export async function getMovieMetadata(title: string): Promise<{ poster?: string; rating?: string; actors?: string }> {
  const normalizedTitle = title.trim().toLowerCase();
  return withRuntimeCache(`imdb:${normalizedTitle}`, ENRICHMENT_CACHE_TTL.long, async () => {
    if (typeof window !== 'undefined') {
      return {};
    }

    try {
      const data = await fetchJson<Record<string, unknown>>(`${IMDB_SEARCH_URL}?q=${encodeURIComponent(title)}`);
      const description = Array.isArray(data.description) ? data.description as Array<Record<string, unknown>> : [];
      if (data.ok && description.length > 0) {
        const top = description[0] ?? {};
        return {
          poster: typeof top['#IMG_POSTER'] === 'string' ? top['#IMG_POSTER'] : undefined,
          rating: top['#RANK'] ? String(top['#RANK']) : undefined,
          actors: typeof top['#ACTORS'] === 'string' ? top['#ACTORS'] : undefined,
        };
      }
      return {};
    } catch {
      return {};
    }
  });
}
