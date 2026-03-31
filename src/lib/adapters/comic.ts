import { getJikanEnrichment } from '@/lib/enrichment';
import type {
  ChapterDetail,
  JikanEnrichment,
  MangaDetail,
  MangaSearchResult,
  MangaSubtype,
} from '@/lib/types';

type SearchResponse = {
  data: MangaSearchResult[];
};

type ComicListResponse = {
  comics: MangaSearchResult[];
};

function readBaseUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    '';
  return value.replace(/\/+$/, '');
}

function buildApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return path;
  }

  const baseUrl = readBaseUrl();
  if (!baseUrl) {
    throw new Error(`Comic API base URL is not configured for server usage: ${path}`);
  }

  return `${baseUrl}${path}`;
}

async function fetchComicJson<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
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
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return url;
  return url.split('?')[0];
};

export const searchManga = async (q: string, p = 1) => {
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return { data: [] };
  }

  const data = await fetchComicJson<MangaSearchResult[]>(
    `/api/search/comic?q=${encodeURIComponent(trimmed)}&page=${Math.max(p, 1)}`,
  );
  return { data } satisfies SearchResponse;
};

export async function getMangaDetail(slug: string): Promise<MangaDetail> {
  return fetchComicJson<MangaDetail>(`/api/comic/title/${encodeURIComponent(slug)}`);
}

export async function getMangaChapter(seg: string): Promise<ChapterDetail> {
  return fetchComicJson<ChapterDetail>(`/api/comic/chapter/${encodeURIComponent(seg)}`);
}

export const getPopularManga = async () =>
  fetchComicJson<ComicListResponse>('/api/comic/popular?limit=40');

export const getNewManga = async (p = 1, l = 10) =>
  fetchComicJson<ComicListResponse>(`/api/comic/latest?page=${Math.max(p, 1)}&limit=${Math.max(l, 1)}`);

export const getMangaRecommendations = async (slug: string) => {
  const detail = await getMangaDetail(slug);
  return {
    recommendations: detail.similar_manga.map((item) => ({
      title: item.title,
      altTitle: null,
      slug: item.slug,
      href: item.link,
      thumbnail: item.image,
      type: item.type || 'Manga',
      subtype: getMangaSubtype(item),
      genre: '',
      description: item.description || '',
      link: item.link,
      image: item.image,
    })),
  };
};

export const getMangaByGenre = async (g: string, p = 1) =>
  fetchComicJson<ComicListResponse>(`/api/comic/genre?genre=${encodeURIComponent(g)}&page=${Math.max(p, 1)}`);

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
export { getJikanEnrichment };
export type { ChapterDetail, JikanEnrichment, MangaDetail, MangaSearchResult, MangaSubtype };
