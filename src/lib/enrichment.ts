import type { AnimeCastMember, JikanEnrichment } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

type TMDBImageSize = 'w500' | 'w780' | 'w1280';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const runtimeCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();
const CACHE_TTL = {
  medium: 1000 * 60 * 15,
  long: 1000 * 60 * 60 * 6,
} as const;

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const IMDB_SEARCH_URL = 'https://imdb.iamidiotareyoutoo.com/search';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const GOOGLE_BOOKS_SEARCH_URL = 'https://www.googleapis.com/books/v1/volumes';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function withRuntimeCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = runtimeCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inflight = inflightCache.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const pending = loader()
    .then((value) => {
      runtimeCache.set(key, {
        expiresAt: now + ttlMs,
        value,
      });
      return value;
    })
    .finally(() => {
      inflightCache.delete(key);
    });

  inflightCache.set(key, pending as Promise<unknown>);
  return pending;
}

async function fetchJson<T>(url: string, headersOverride?: HeadersInit): Promise<T> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: headersOverride ?? { Accept: 'application/json' },
      next: { revalidate: 3600 },
      timeoutMs: 10_000,
      retries: 1,
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}`);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      throw new Error('API timeout');
    }
    throw error;
  }
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

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

export type MovieVisuals = {
  poster: string;
  backdrop: string;
};

export type WrittenMetadata = {
  title?: string;
  cover?: string;
  description?: string;
  authors?: string[];
  source?: 'google-books' | 'open-library';
};

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

type TMDBMovieSearchResult = {
  title?: string;
  original_title?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
};

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

  return withRuntimeCache(`tmdb:movie:${normalizedTitle.toLowerCase()}:${normalizedYear}`, CACHE_TTL.long, async () => {
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
  }
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
  return withRuntimeCache(`imdb:${normalizedTitle}`, CACHE_TTL.long, async () => {
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

function normalizeGoogleBooksCover(url: string): string {
  if (!url) return '';
  return url.replace(/^http:\/\//i, 'https://').replace(/&zoom=\d+/i, '&zoom=2');
}

function normalizeOpenLibraryCover(coverId: unknown): string {
  const id = typeof coverId === 'number' ? coverId : Number(coverId);
  if (!Number.isFinite(id) || id <= 0) {
    return '';
  }
  return `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
}

function normalizeSearchTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTitleSimilarity(sourceTitle: string, candidateTitle?: string): number {
  const source = normalizeSearchTitle(sourceTitle);
  const candidate = normalizeSearchTitle(candidateTitle || '');

  if (!source || !candidate) {
    return 0;
  }
  if (source === candidate) {
    return 1;
  }
  if (source.includes(candidate) || candidate.includes(source)) {
    return 0.88;
  }

  const sourceTokens = new Set(source.split(' '));
  const candidateTokens = new Set(candidate.split(' '));
  const overlap = [...sourceTokens].filter((token) => candidateTokens.has(token)).length;
  const longestTokenCount = Math.max(sourceTokens.size, candidateTokens.size);

  return longestTokenCount > 0 ? overlap / longestTokenCount : 0;
}

function pickBestWrittenMetadata(title: string, options: Array<WrittenMetadata | null>): WrittenMetadata | null {
  const ranked = options
    .map((option) => ({
      option,
      score: scoreTitleSimilarity(title, option?.title),
    }))
    .filter((entry) => entry.option && entry.score >= 0.72)
    .sort((left, right) => right.score - left.score);

  const best = ranked[0]?.option;
  if (!best) {
    return null;
  }

  const fallback = ranked.find((entry) => entry.option !== best)?.option || null;

  return {
    title: best.title,
    cover: best.cover || fallback?.cover,
    description: best.description || fallback?.description,
    authors: (best.authors && best.authors.length > 0 ? best.authors : fallback?.authors) || [],
    source: best.source,
  };
}

async function fetchOpenLibraryMetadata(title: string): Promise<WrittenMetadata | null> {
  try {
    const data = await fetchJson<{
      docs?: Array<Record<string, unknown>>;
    }>(`${OPEN_LIBRARY_SEARCH_URL}?title=${encodeURIComponent(title)}&limit=1`);

    const item = data.docs?.[0];
    if (!item) {
      return null;
    }

    const authors = Array.isArray(item.author_name)
      ? item.author_name.filter((author): author is string => typeof author === 'string')
      : [];

    return {
      title: typeof item.title === 'string' ? item.title : undefined,
      cover: normalizeOpenLibraryCover(item.cover_i),
      description: typeof item.first_sentence === 'string' ? item.first_sentence : undefined,
      authors,
      source: 'open-library',
    };
  } catch {
    return null;
  }
}

async function fetchGoogleBooksMetadata(title: string): Promise<WrittenMetadata | null> {
  try {
    const data = await fetchJson<{
      items?: Array<{
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
          };
        };
      }>;
    }>(`${GOOGLE_BOOKS_SEARCH_URL}?q=${encodeURIComponent(title)}&maxResults=1&printType=books`);

    const item = data.items?.[0]?.volumeInfo;
    if (!item) {
      return null;
    }

    return {
      title: item.title,
      cover: normalizeGoogleBooksCover(item.imageLinks?.thumbnail || item.imageLinks?.smallThumbnail || ''),
      description: item.description,
      authors: Array.isArray(item.authors) ? item.authors : [],
      source: 'google-books',
    };
  } catch {
    return null;
  }
}

export async function getWrittenMetadata(title: string): Promise<WrittenMetadata | null> {
  const normalizedTitle = title.trim().toLowerCase();
  return withRuntimeCache(`written:${normalizedTitle}`, CACHE_TTL.long, async () => {
    const [googleBooksResult, openLibraryResult] = await Promise.allSettled([
      fetchGoogleBooksMetadata(title),
      fetchOpenLibraryMetadata(title),
    ]);

    const google = googleBooksResult.status === 'fulfilled' ? googleBooksResult.value : null;
    const openLibrary = openLibraryResult.status === 'fulfilled' ? openLibraryResult.value : null;

    const best = pickBestWrittenMetadata(title, [google, openLibrary]);
    if (!best) {
      return null;
    }

    return best;
  });
}

export async function getJikanEnrichment(type: 'anime' | 'manga', title: string): Promise<JikanEnrichment | null> {
  try {
    const data = await fetchJson<{ data: Record<string, unknown>[] }>(
      `${JIKAN_BASE_URL}/${type}?q=${encodeURIComponent(title)}&limit=1`,
    );
    const item = data.data?.[0];
    if (!item) {
      return null;
    }

    const extractNames = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) {
        return [];
      }
      return arr
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return '';
          }
          return typeof (entry as Record<string, unknown>).name === 'string'
            ? ((entry as Record<string, unknown>).name as string)
            : '';
        })
        .filter(Boolean);
    };

    return {
      malId: item.mal_id as number,
      score: item.score as number,
      rank: item.rank as number,
      popularity: item.popularity as number,
      synopsis: item.synopsis as string,
      trailer_url: ((item.trailer as Record<string, unknown> | undefined)?.url as string) || '',
      status: item.status as string,
      source: item.source as string,
      rating: item.rating as string,
      year: item.year as number | null,
      season: item.season as string,
      genres: extractNames(item.genres),
      themes: extractNames(item.themes),
      studios: extractNames(item.studios),
      title: item.title as string,
      url: item.url as string,
      mediaType: type,
      chapters: item.chapters as number | null,
      episodes: item.episodes as number | null,
    };
  } catch {
    return null;
  }
}

export async function getAnimeCast(malId: number): Promise<AnimeCastMember[]> {
  return withRuntimeCache(`jikan:anime-cast:${malId}`, CACHE_TTL.long, async () => {
    try {
      const data = await fetchJson<{
        data?: Array<{
          role?: string;
          favorites?: number;
          character?: {
            mal_id?: number;
            name?: string;
            images?: {
              webp?: { image_url?: string };
              jpg?: { image_url?: string };
            };
          };
          voice_actors?: Array<{
            language?: string;
            person?: {
              name?: string;
            };
          }>;
        }>;
      }>(`${JIKAN_BASE_URL}/anime/${malId}/characters`);

      return (data.data ?? [])
        .sort((left, right) => {
          const roleScore = (entry: { role?: string }) =>
            entry.role === 'Main' ? 2 : entry.role === 'Supporting' ? 1 : 0;
          return roleScore(right) - roleScore(left) || (right.favorites ?? 0) - (left.favorites ?? 0);
        })
        .map((entry, index) => {
          const japaneseVoiceActor =
            entry.voice_actors?.find((voiceActor) => voiceActor.language === 'Japanese') ??
            entry.voice_actors?.[0];

          return {
            id: entry.character?.mal_id ?? index + 1,
            name: entry.character?.name ?? 'Unknown Character',
            role: entry.role ?? 'Cast',
            image: entry.character?.images?.webp?.image_url || entry.character?.images?.jpg?.image_url,
            voiceActor: japaneseVoiceActor?.person?.name,
            voiceActorLanguage: japaneseVoiceActor?.language,
          };
        })
        .filter((entry) => entry.name)
        .slice(0, 6);
    } catch {
      return [];
    }
  });
}
