import 'server-only';

import { fetchWithTimeout } from './fetch-with-timeout.ts';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const runtimeCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();

export const ENRICHMENT_CACHE_TTL = {
  medium: 1000 * 60 * 15,
  long: 1000 * 60 * 60 * 6,
} as const;

export const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
export const IMDB_SEARCH_URL = 'https://imdb.iamidiotareyoutoo.com/search';
export const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
export const GOOGLE_BOOKS_SEARCH_URL = 'https://www.googleapis.com/books/v1/volumes';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export type TMDBImageSize = 'w500' | 'w780' | 'w1280';

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

export async function withRuntimeCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
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

export async function fetchJson<T>(url: string, headersOverride?: HeadersInit): Promise<T> {
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

export function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSearchTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scoreTitleSimilarity(sourceTitle: string, candidateTitle?: string): number {
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
