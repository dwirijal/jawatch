import { buildDramaItemSlug } from '../media-slugs.ts';

export interface DramaCatalogCard {
  slug: string;
  title: string;
  image: string;
  subtitle?: string;
  badgeText?: string;
  bookId?: string;
}

export interface DrachinHomeData {
  featured: DramaCatalogCard[];
  latest: DramaCatalogCard[];
  popular: DramaCatalogCard[];
}

export interface DrachinDetailEpisode {
  episode: string;
  index: string;
  slug: string;
}

export interface DrachinDetailData {
  slug: string;
  title: string;
  poster: string;
  synopsis: string;
  tags: string[];
  totalEpisodes: number;
  episodes: DrachinDetailEpisode[];
}

export interface DrachinMirror {
  label: string;
  embed_url: string;
}

export interface DrachinEpisodeData {
  slug: string;
  episodeSlug: string;
  title: string;
  episode: string;
  episodeIndex: number;
  poster: string;
  mirrors: DrachinMirror[];
  defaultUrl: string;
}

export interface DramaboxHomeData {
  latest: DramaCatalogCard[];
  trending: DramaCatalogCard[];
}

export interface DramaboxDetailData {
  bookId: string;
  title: string;
  cover: string;
  synopsis: string;
  totalEpisodes: string;
}

type JsonRequestOptions = {
  cache?: RequestCache;
};

function isServerRuntime() {
  return typeof window === 'undefined';
}

function buildDramaApiUrl(path: string): string {
  if (isServerRuntime()) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://127.0.0.1:3000';
    return `${baseUrl}${path}`;
  }
  return path;
}

async function fetchDramaJson<T>(path: string, options: JsonRequestOptions = {}): Promise<T> {
  const response = await fetch(buildDramaApiUrl(path), {
    headers: {
      Accept: 'application/json',
    },
    cache: options.cache ?? 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Drama route ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function extractDramaboxBookId(coverUrl: string): string {
  const match = coverUrl.match(/\/(4\d{10})\//);
  return match?.[1] ?? '';
}

export function isDramaboxBookId(value: string): boolean {
  return /^4\d{10}$/.test(value.trim());
}

export async function getDrachinHome(): Promise<DrachinHomeData> {
  return fetchDramaJson<DrachinHomeData>('/api/vertical-drama/home?entry=drachin');
}

export async function searchDrachin(query: string): Promise<DramaCatalogCard[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  return fetchDramaJson<DramaCatalogCard[]>(`/api/vertical-drama/search?q=${encodeURIComponent(trimmed)}`);
}

export async function getDrachinDetailBySlug(slug: string): Promise<DrachinDetailData | null> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return await fetchDramaJson<DrachinDetailData | null>(`/api/vertical-drama/detail?slug=${encodeURIComponent(trimmed)}`);
  } catch {
    return null;
  }
}

export async function getDrachinEpisodeBySlug(slug: string, index = 1): Promise<DrachinEpisodeData | null> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return await fetchDramaJson<DrachinEpisodeData | null>(
      `/api/vertical-drama/episode?slug=${encodeURIComponent(trimmed)}&index=${encodeURIComponent(String(index))}`,
    );
  } catch {
    return null;
  }
}

export async function getDramaboxHome(): Promise<DramaboxHomeData> {
  return fetchDramaJson<DramaboxHomeData>('/api/vertical-drama/home?entry=dramabox');
}

export async function searchDramabox(query: string): Promise<DramaCatalogCard[]> {
  return searchDrachin(query);
}

export async function getDramaboxDetailByBookId(bookId: string): Promise<DramaboxDetailData | null> {
  const trimmed = readString(bookId);
  if (!trimmed) {
    return null;
  }

  if (!isDramaboxBookId(trimmed)) {
    return {
      bookId: trimmed,
      title: trimmed.replace(/-/g, ' '),
      cover: '',
      synopsis: '',
      totalEpisodes: '',
    };
  }

  return {
    bookId: trimmed,
    title: `DramaBox ${trimmed}`,
    cover: '',
    synopsis: '',
    totalEpisodes: '',
  };
}

export function normalizeDramaBoxCard(item: Pick<DramaCatalogCard, 'slug' | 'title' | 'image' | 'subtitle' | 'bookId'>): DramaCatalogCard {
  const candidateBookId = readString(item.bookId) || extractDramaboxBookId(item.image);
  const bookId = isDramaboxBookId(candidateBookId) ? candidateBookId : '';
  return {
    ...item,
    slug: bookId || item.slug || buildDramaItemSlug({ title: item.title }),
    bookId: bookId || undefined,
  };
}
