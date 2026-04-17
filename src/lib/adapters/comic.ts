import type {
  MangaSearchResult,
  MangaSubtype,
} from '@/lib/types';
import { normalizeComicImageUrl } from '@/lib/comic-media';
import {
  normalizeComicListPayload,
  normalizeComicSearchPayload,
} from '@/lib/adapters/comic-response';

type SearchResponse = {
  data: MangaSearchResult[];
};

type ComicListResponse = {
  comics: MangaSearchResult[];
};

async function fetchComicJson<T>(path: string): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error(`Comic client adapter cannot be used on the server: ${path}`);
  }

  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Comic route ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const extractSlugFromUrl = (url: string) => (url ? url.split('/').filter(Boolean).pop() || '' : '');

export const getHDThumbnail = (url: string) => {
  return normalizeComicImageUrl(url);
};

export const searchManga = async (q: string, p = 1) => {
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return { data: [] };
  }

  const payload = await fetchComicJson<unknown>(
    `/api/search/comic?q=${encodeURIComponent(trimmed)}&page=${Math.max(p, 1)}`,
  );
  return normalizeComicSearchPayload(payload) satisfies SearchResponse;
};

export const getPopularManga = async () =>
  normalizeComicListPayload(await fetchComicJson<unknown>('/api/comic/popular?limit=40')) satisfies ComicListResponse;

export const getNewManga = async (p = 1, l = 10) =>
  normalizeComicListPayload(
    await fetchComicJson<unknown>(`/api/comic/latest?page=${Math.max(p, 1)}&limit=${Math.max(l, 1)}`),
  ) satisfies ComicListResponse;

export const getMangaByGenre = async (g: string, p = 1) =>
  normalizeComicListPayload(
    await fetchComicJson<unknown>(`/api/comic/genre?genre=${encodeURIComponent(g)}&page=${Math.max(p, 1)}`),
  ) satisfies ComicListResponse;

export const getMangaSubtype = (item: Pick<MangaSearchResult, 'type' | 'subtype'>): MangaSubtype => {
  const subtype = item.subtype?.toLowerCase() ?? '';
  if (subtype === 'manhwa' || subtype === 'manhua' || subtype === 'manga') {
    return subtype;
  }

  const type = item.type?.toLowerCase() ?? '';
  if (type.includes('manhwa')) return 'manhwa';
  if (type.includes('manhua')) return 'manhua';
  return 'manga';
};

export const filterMangaBySubtype = (items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] =>
  items.filter((item) => getMangaSubtype(item) === subtype);

export type NewManga = MangaSearchResult;
export type RecommendationManga = MangaSearchResult;
export type { MangaSearchResult, MangaSubtype };
