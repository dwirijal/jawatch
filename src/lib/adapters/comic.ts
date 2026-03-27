import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from '@/lib/runtime-snapshot';
import { buildSankaUrl, fetchSankaJson } from '@/lib/media';
import { getJikanEnrichment } from '@/lib/enrichment';
import type {
  ChapterDetail,
  JikanEnrichment,
  MangaDetail,
  MangaSearchResult,
  MangaSubtype,
} from '@/lib/types';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type ReadingHomeSnapshot = {
  popular?: MangaSearchResult[];
  newest?: MangaSearchResult[];
};

const runtimeCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();
const CACHE_TTL = {
  short: 1000 * 60 * 5,
  medium: 1000 * 60 * 15,
} as const;

const COMIC_SUBTYPES = ['manga', 'manhwa', 'manhua'] as const;

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

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSankaAssetUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return buildSankaUrl(url);
  return url;
}

function normalizeComicType(value: unknown): string {
  const type = readString(value).toLowerCase();
  if (type.includes('manhwa')) return 'Manhwa';
  if (type.includes('manhua')) return 'Manhua';
  if (type.includes('comic')) return 'Comic';
  if (type.includes('novel')) return 'Novel';
  return 'Manga';
}

function readComicEntries(payload: unknown): Record<string, unknown>[] {
  const record = readObject(payload);

  if (Array.isArray(record.data)) {
    return record.data.map((item) => readObject(item)).filter((item) => Object.keys(item).length > 0);
  }
  if (Array.isArray(record.comics)) {
    return record.comics.map((item) => readObject(item)).filter((item) => Object.keys(item).length > 0);
  }
  if (Array.isArray(record.results)) {
    return record.results.map((item) => readObject(item)).filter((item) => Object.keys(item).length > 0);
  }

  return Object.entries(record)
    .filter(([key, value]) => /^\d+$/.test(key) && value && typeof value === 'object' && !Array.isArray(value))
    .map(([, value]) => readObject(value));
}

export const extractSlugFromUrl = (url: string) => (url ? url.split('/').filter(Boolean).pop() || '' : '');

function extractComicSlug(record: Record<string, unknown>): string {
  return (
    readString(record.slug) ||
    extractSlugFromUrl(readString(record.link)) ||
    extractSlugFromUrl(readString(record.href))
  );
}

function normalizeComicCard(item: unknown, forcedType?: MangaSubtype): MangaSearchResult | null {
  const record = readObject(item);
  const title = readString(record.title);
  const slug = extractComicSlug(record);
  const href = readString(record.href);
  const link = readString(record.link) || href || (slug ? `/manga/${slug}/` : '');

  if (!title || !slug || link === '/plus/') {
    return null;
  }

  const inferredType = normalizeComicType(forcedType || record.type);

  return {
    title,
    altTitle: readString(record.altTitle) || null,
    slug,
    href: href || link,
    thumbnail: normalizeSankaAssetUrl(readString(record.thumbnail) || readString(record.image)),
    type: inferredType,
    genre: readString(record.genre),
    description: readString(record.description) || readString(record.note),
    chapter: readString(record.chapter),
    time_ago: readString(record.time_ago),
    link,
    image: normalizeSankaAssetUrl(readString(record.image) || readString(record.thumbnail)),
  };
}

function normalizeComicList(payload: unknown, forcedType?: MangaSubtype): MangaSearchResult[] {
  return readComicEntries(payload)
    .map((item) => normalizeComicCard(item, forcedType))
    .filter((item): item is MangaSearchResult => item !== null);
}

function buildMinimalComicDetail(slug: string, item?: MangaSearchResult | null): MangaDetail {
  const fallbackTitle = slug
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
  const image = item?.image || item?.thumbnail || '';
  const synopsis =
    item?.description ||
    'Detailed metadata is temporarily unavailable from the upstream source, but the title is still available in the catalog.';

  return {
    creator: 'Sanka Vollerei',
    slug: item?.slug || slug,
    title: item?.title || fallbackTitle || slug,
    title_indonesian: item?.altTitle || '',
    image,
    synopsis,
    synopsis_full: synopsis,
    summary: synopsis,
    background_story: '',
    metadata: {
      type: item?.type || 'Manga',
      author: '',
      status: '',
      concept: '',
      age_rating: '',
      reading_direction: '',
    },
    genres: item?.genre
      ? item.genre
          .split(',')
          .map((genre) => genre.trim())
          .filter(Boolean)
          .map((genre) => ({
            name: genre,
            slug: genre.toLowerCase().replace(/\s+/g, '-'),
            link: '',
          }))
      : [],
    chapters: [],
    similar_manga: [],
  };
}

async function findSnapshotComicBySlug(slug: string): Promise<MangaSearchResult | null> {
  for (const domain of COMIC_SUBTYPES) {
    const catalog =
      (await readSnapshotDomainFile<MangaSearchResult[] | { items?: MangaSearchResult[] }>(domain, 'catalog.json')) ??
      (await readSnapshotDomainFile<MangaSearchResult[] | { items?: MangaSearchResult[] }>(domain, 'search.json'));
    const items = Array.isArray(catalog) ? catalog : catalog?.items || [];
    const match = items.find((item) => item.slug === slug);
    if (match) {
      return match;
    }
  }

  return null;
}

async function findLiveComicBySlug(slug: string): Promise<MangaSearchResult | null> {
  const query = slug.replace(/-/g, ' ').trim();
  if (!query) {
    return null;
  }

  try {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/search?q=${encodeURIComponent(query)}&page=1`);
    return normalizeComicList(payload).find((item) => item.slug === slug) || null;
  } catch {
    return null;
  }
}

async function getComicDetailFromSanka(slug: string): Promise<MangaDetail> {
  return withRuntimeCache(`comic:detail:live:${slug}`, CACHE_TTL.medium, async () => {
    try {
      const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/comic/${encodeURIComponent(slug)}`);
      const metadata = readObject(payload.metadata);

      return {
        creator: readString(payload.creator) || 'Sanka Vollerei',
        slug: readString(payload.slug) || slug,
        title: readString(payload.title) || slug,
        title_indonesian: readString(payload.title_indonesian),
        image: normalizeSankaAssetUrl(readString(payload.image)),
        synopsis: readString(payload.synopsis),
        synopsis_full: readString(payload.synopsis_full) || readString(payload.synopsis),
        summary: readString(payload.summary),
        background_story: readString(payload.background_story),
        metadata: {
          type: normalizeComicType(metadata.type),
          author: readString(metadata.author),
          status: readString(metadata.status),
          concept: readString(metadata.concept),
          age_rating: readString(metadata.age_rating),
          reading_direction: readString(metadata.reading_direction),
        },
        genres: (Array.isArray(payload.genres) ? payload.genres : [])
          .map((genre) => {
            const record = readObject(genre);
            return {
              name: readString(record.name),
              slug: readString(record.slug) || extractSlugFromUrl(readString(record.link)),
              link: readString(record.link),
            };
          })
          .filter((genre) => genre.name && genre.slug),
        chapters: (Array.isArray(payload.chapters) ? payload.chapters : [])
          .map((chapter) => {
            const record = readObject(chapter);
            return {
              chapter: readString(record.chapter),
              slug: readString(record.slug) || extractSlugFromUrl(readString(record.link)),
              link: readString(record.link),
              date: readString(record.date),
            };
          })
          .filter((chapter) => chapter.chapter && chapter.slug),
        similar_manga: (Array.isArray(payload.similar_manga) ? payload.similar_manga : [])
          .map((item) => {
            const record = readObject(item);
            const similarSlug = readString(record.slug) || extractSlugFromUrl(readString(record.link));
            return {
              title: readString(record.title),
              slug: similarSlug,
              link: readString(record.link) || (similarSlug ? `/manga/${similarSlug}/` : ''),
              image: normalizeSankaAssetUrl(readString(record.image)),
              type: normalizeComicType(record.type),
              description: readString(record.description),
            };
          })
          .filter((item) => item.title && item.slug),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('status 500')) {
        throw error;
      }

      const fallbackItem = (await findSnapshotComicBySlug(slug)) || (await findLiveComicBySlug(slug));
      if (fallbackItem) {
        return buildMinimalComicDetail(slug, fallbackItem);
      }

      throw error;
    }
  });
}

async function applyComicTypeHints(
  items: MangaSearchResult[],
  options: { detailLookupLimit?: number } = {},
): Promise<MangaSearchResult[]> {
  const detailLookupLimit = options.detailLookupLimit ?? 0;
  if (detailLookupLimit <= 0) {
    return items.map((item) => ({
      ...item,
      type: item.type || 'Manga',
    }));
  }

  const hinted = items.map((item) => ({
    ...item,
    type: item.type || 'Manga',
  }));

  const missing = hinted.filter((item) => !item.type || item.type === 'Manga');
  if (missing.length === 0) {
    return hinted;
  }

  const resolved = new Map<string, string>();
  await Promise.all(
    missing.slice(0, detailLookupLimit).map(async (item) => {
      try {
        const detail = await getComicDetailFromSanka(item.slug);
        resolved.set(item.slug, normalizeComicType(detail.metadata.type));
      } catch {
        // Best-effort only.
      }
    }),
  );

  return hinted.map((item) => ({
    ...item,
    type: resolved.get(item.slug) || item.type || 'Manga',
  }));
}

export const searchManga = async (q: string, p = 1) => {
  if (p === 1) {
    const snapshotResults = (
      await Promise.all(
        (COMIC_SUBTYPES as readonly MangaSubtype[]).map((domain) =>
          searchSnapshotDomain<MangaSearchResult>(domain, q, 24),
        ),
      )
    ).flat();
    if (snapshotResults.length > 0) {
      return { data: snapshotResults };
    }
  }

  return withRuntimeCache(`manga:search:${q.trim().toLowerCase()}:${p}`, CACHE_TTL.short, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/search?q=${encodeURIComponent(q)}&page=${p}`);
    return { data: normalizeComicList(payload) };
  });
};

export async function getMangaDetail(slug: string): Promise<MangaDetail> {
  for (const domain of COMIC_SUBTYPES) {
    const snapshot = await readSnapshotTitle<MangaDetail>(domain, slug);
    if (snapshot) {
      return snapshot;
    }
  }
  return withRuntimeCache(`manga:detail:${slug}`, CACHE_TTL.medium, () => getComicDetailFromSanka(slug));
}

export async function getMangaChapter(seg: string): Promise<ChapterDetail> {
  for (const domain of COMIC_SUBTYPES) {
    const snapshot = await readSnapshotPlayback<ChapterDetail>(domain, seg);
    if (snapshot) {
      return snapshot;
    }
  }

  return withRuntimeCache(`manga:chapter:${seg}`, CACHE_TTL.short, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/chapter/${encodeURIComponent(seg)}`);
    const navigation = readObject(payload.navigation);
    const next = readString(navigation.nextChapter || payload.nextChapter);
    const prev = readString(navigation.previousChapter || payload.previousChapter);

    return {
      title: readString(payload.chapter_title) || readString(payload.title) || seg,
      manga_title: readString(payload.manga_title),
      chapter_title: readString(payload.chapter_title),
      images: (Array.isArray(payload.images) ? payload.images : [])
        .map((image) => normalizeSankaAssetUrl(readString(image)))
        .filter(Boolean),
      navigation: {
        next,
        prev,
        nextChapter: next,
        previousChapter: prev,
      },
    };
  });
}

export const getPopularManga = () =>
  withRuntimeCache('manga:popular', CACHE_TTL.medium, async () => {
    const snapshotResults = (
      await Promise.all(
        COMIC_SUBTYPES.map(async (domain) => {
          const snapshot = await readSnapshotDomainFile<ReadingHomeSnapshot>(domain, 'home.json');
          return snapshot?.popular || [];
        }),
      )
    ).flat();

    if (snapshotResults.length > 0) {
      return { comics: snapshotResults };
    }

    const payload = await fetchSankaJson<Record<string, unknown>>('/comic/populer');
    return {
      comics: await applyComicTypeHints(normalizeComicList(payload), { detailLookupLimit: 12 }),
    };
  });

export const getNewManga = (p = 1, l = 10) =>
  withRuntimeCache(`manga:new:${p}:${l}`, CACHE_TTL.medium, async () => {
    if (p === 1) {
      const snapshotResults = (
        await Promise.all(
          COMIC_SUBTYPES.map(async (domain) => {
            const snapshot = await readSnapshotDomainFile<ReadingHomeSnapshot>(domain, 'home.json');
            return snapshot?.newest || [];
          }),
        )
      ).flat();
      if (snapshotResults.length > 0) {
        return { comics: snapshotResults.slice(0, l) };
      }
    }

    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/terbaru?page=${p}&limit=${l}`);
    const normalized = normalizeComicList(payload);
    return {
      comics: (await applyComicTypeHints(normalized, { detailLookupLimit: normalized.length })).slice(0, l),
    };
  });

export const getMangaRecommendations = (slug: string) =>
  withRuntimeCache(`manga:recommendations:${slug}`, CACHE_TTL.medium, async () => {
    const detail = await getMangaDetail(slug);
    return {
      recommendations: detail.similar_manga.map((item) => ({
        title: item.title,
        altTitle: null,
        slug: item.slug,
        href: item.link,
        thumbnail: item.image,
        type: item.type || 'Manga',
        genre: '',
        description: item.description || '',
        link: item.link,
        image: item.image,
      })),
    };
  });

export const getMangaByGenre = (g: string, p = 1) =>
  withRuntimeCache(`manga:genre:${g.trim().toLowerCase()}:${p}`, CACHE_TTL.medium, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/genre/${encodeURIComponent(g)}?page=${p}`);
    const normalized = normalizeComicList(payload);
    return {
      comics: await applyComicTypeHints(normalized, { detailLookupLimit: p === 1 ? 10 : 0 }),
    };
  });

export const getMangaSubtype = (item: Pick<MangaSearchResult, 'type'>): MangaSubtype => {
  const type = item.type?.toLowerCase() ?? '';
  if (type.includes('manhwa')) return 'manhwa';
  if (type.includes('manhua')) return 'manhua';
  return 'manga';
};

export const filterMangaBySubtype = (items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] =>
  items.filter((item) => getMangaSubtype(item) === subtype);

export const getHDThumbnail = (url: string) => {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `https://layarkaca21.org${url}`;
  return url.split('?')[0];
};

export type NewManga = MangaSearchResult;
export type RecommendationManga = MangaSearchResult;
export { getJikanEnrichment };
export type { ChapterDetail, JikanEnrichment, MangaDetail, MangaSearchResult, MangaSubtype };
