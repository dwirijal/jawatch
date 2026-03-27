import { fetchSankaJson } from './sanka';

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown): string[] {
  return readArray(value)
    .map((item) => readString(item))
    .filter(Boolean);
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function stripEpisodeSuffix(title: string): string {
  return title
    .replace(/\s+EP\s+\d+$/i, '')
    .replace(/\s*-\s*Episode\s+\d+$/i, '')
    .trim();
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractDramaboxBookId(coverUrl: string): string {
  const match = coverUrl.match(/\/(4\d{10})\//);
  return match?.[1] ?? '';
}

function qualityRank(label: string): number {
  const parsed = Number.parseInt(label.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface DramaCatalogCard {
  slug: string;
  title: string;
  image: string;
  subtitle?: string;
  badgeText?: string;
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
  title: string;
  episode: string;
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

function normalizeDrachinCard(item: unknown): DramaCatalogCard | null {
  const record = readObject(item);
  const slug = readString(record.slug);
  const title = stripEpisodeSuffix(readString(record.title) || titleFromSlug(slug));
  const image = readString(record.poster) || readString(record.cover);
  const subtitle = readString(record.episode_info) || readString(record.total_episode);

  if (!slug || !title) {
    return null;
  }

  return {
    slug,
    title,
    image,
    subtitle: subtitle || undefined,
    badgeText: 'Drachin',
  };
}

function normalizeDramaBoxCard(item: unknown): DramaCatalogCard | null {
  const record = readObject(item);
  const title = readString(record.judul) || readString(record.title);
  const image = readString(record.cover) || readString(record.poster);
  const bookId = readString(record.bookId) || extractDramaboxBookId(image);
  const slug = bookId || slugifyTitle(title);

  if (!slug || !title) {
    return null;
  }

  return {
    slug,
    title,
    image,
    subtitle: readString(record.total_episode) || undefined,
    badgeText: 'DramaBox',
  };
}

function normalizeCardList(items: unknown, normalizer: (item: unknown) => DramaCatalogCard | null): DramaCatalogCard[] {
  return readArray(items)
    .map((item) => normalizer(item))
    .filter((item): item is DramaCatalogCard => item !== null);
}

export async function getDrachinHome(): Promise<DrachinHomeData> {
  const [homePayload, latestPayload, popularPayload] = await Promise.all([
    fetchSankaJson<{ data?: { slider?: unknown[] } }>('/anime/drachin/home'),
    fetchSankaJson<{ data?: unknown[] }>('/anime/drachin/latest?page=1'),
    fetchSankaJson<{ data?: unknown[] }>('/anime/drachin/popular?page=1'),
  ]);

  return {
    featured: normalizeCardList(readObject(homePayload).data ? readObject(homePayload.data).slider : [], normalizeDrachinCard),
    latest: normalizeCardList(readObject(latestPayload).data, normalizeDrachinCard),
    popular: normalizeCardList(readObject(popularPayload).data, normalizeDrachinCard),
  };
}

export async function searchDrachin(query: string): Promise<DramaCatalogCard[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const payload = await fetchSankaJson<{ data?: unknown[] }>(`/anime/drachin/search/${encodeURIComponent(trimmed)}`);
  return normalizeCardList(readObject(payload).data, normalizeDrachinCard);
}

export async function getDrachinDetailBySlug(slug: string): Promise<DrachinDetailData | null> {
  const payload = await fetchSankaJson<{ data?: Record<string, unknown> }>(`/anime/drachin/detail/${encodeURIComponent(slug)}`);
  const data = readObject(payload.data);
  if (Object.keys(data).length === 0) {
    return null;
  }

  const episodes = readArray(data.episodes)
    .map((item) => {
      const record = readObject(item);
      const index = readString(record.index);
      const episode = readString(record.episode);
      const episodeSlug = readString(record.slug) || slug;
      return index ? { index, episode: episode || index, slug: episodeSlug } : null;
    })
    .filter((item): item is DrachinDetailEpisode => item !== null);

  return {
    slug,
    title: stripEpisodeSuffix(readString(data.title) || titleFromSlug(slug)),
    poster: readString(data.poster),
    synopsis: readString(data.synopsis),
    tags: readStringArray(data.tags),
    totalEpisodes: Number.parseInt(readString(data.total_episodes), 10) || episodes.length,
    episodes,
  };
}

export async function getDrachinEpisodeBySlug(slug: string, index = 1): Promise<DrachinEpisodeData | null> {
  const payload = await fetchSankaJson<{ data?: Record<string, unknown> }>(
    `/anime/drachin/episode/${encodeURIComponent(slug)}?index=${encodeURIComponent(String(index))}`
  );
  const data = readObject(payload.data);
  if (Object.keys(data).length === 0) {
    return null;
  }

  const mirrors = Object.entries(readObject(data.videos))
    .map(([label, url]) => ({
      label: label.toUpperCase(),
      embed_url: readString(url),
    }))
    .filter((item) => item.embed_url)
    .sort((left, right) => qualityRank(right.label) - qualityRank(left.label));

  return {
    slug,
    title: readString(data.title) || `${titleFromSlug(slug)} Episode ${index}`,
    episode: readString(data.episode) || String(index),
    poster: readString(data.poster),
    mirrors,
    defaultUrl: mirrors[0]?.embed_url || '',
  };
}

export async function getDramaboxHome(): Promise<DramaboxHomeData> {
  const [latestPayload, trendingPayload] = await Promise.all([
    fetchSankaJson<{ data?: unknown[] }>('/anime/dramabox/latest?page=1'),
    fetchSankaJson<{ data?: unknown[] }>('/anime/dramabox/trending'),
  ]);

  return {
    latest: normalizeCardList(readObject(latestPayload).data, normalizeDramaBoxCard),
    trending: normalizeCardList(readObject(trendingPayload).data, normalizeDramaBoxCard),
  };
}

export async function searchDramabox(query: string): Promise<DramaCatalogCard[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const payload = await fetchSankaJson<{ data?: unknown[] }>(`/anime/dramabox/search?q=${encodeURIComponent(trimmed)}`);
  return normalizeCardList(readObject(payload).data, normalizeDramaBoxCard);
}

export async function getDramaboxDetailByBookId(bookId: string): Promise<DramaboxDetailData | null> {
  try {
    const payload = await fetchSankaJson<{ status?: string; data?: Record<string, unknown> }>(
      `/anime/dramabox/detail?bookId=${encodeURIComponent(bookId)}`
    );
    if (readString(payload.status).toLowerCase() !== 'success') {
      return null;
    }

    const data = readObject(payload.data);
    if (Object.keys(data).length === 0) {
      return null;
    }

    return {
      bookId,
      title: readString(data.title) || readString(data.judul) || `DramaBox ${bookId}`,
      cover: readString(data.cover) || readString(data.poster),
      synopsis: readString(data.synopsis) || readString(data.description),
      totalEpisodes: readString(data.total_episode) || readString(data.totalEpisodes),
    };
  } catch {
    return null;
  }
}
