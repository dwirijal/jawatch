import { getWrittenMetadata } from '@/lib/enrichment';
import { fetchSankaJson } from '@/lib/media';
import type { NovelDetail, NovelGenre, NovelListItem, NovelRead } from '@/lib/types';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const runtimeCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();
const CACHE_TTL = {
  short: 1000 * 60 * 5,
  medium: 1000 * 60 * 15,
} as const;

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

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

function normalizeNovelCard(entry: unknown): NovelListItem | null {
  const record = readObject(entry);
  const title = readString(record.title);
  const slug = readString(record.slug);
  const poster = readObject(record.cover).url || record.poster;
  const posterUrl = readString(poster);

  if (!title || !slug) {
    return null;
  }

  return {
    title,
    slug,
    poster: posterUrl,
    latestChapter: readString(record.latest_chapter),
    summary: readString(record.summary),
    type: readString(record.type || record.novelStatusDesc) || 'Novel',
    rating: readString(record.rating || record.score),
    status: readString(record.status),
  };
}

function normalizeNovelList(payload: unknown): NovelListItem[] {
  const record = readObject(payload);
  const data = readObject(record.data || record.result);
  const items = Array.isArray(data.results) ? data.results : Array.isArray(data.items) ? data.items : [];

  return items
    .map((item) => normalizeNovelCard(item))
    .filter((item): item is NovelListItem => item !== null);
}

function needsNovelCoverFallback(url: string): boolean {
  return url.includes('sakuranovel.id/') || !url;
}

async function backfillNovelPoster<T extends NovelListItem>(item: T): Promise<T> {
  if (!needsNovelCoverFallback(item.poster)) {
    return item;
  }

  const metadata = await getWrittenMetadata(item.title);
  if (!metadata?.cover) {
    return item;
  }

  return {
    ...item,
    poster: metadata.cover,
  };
}

export async function getNovelHome() {
  return withRuntimeCache('novel:home', CACHE_TTL.medium, async () => {
    const payload = await fetchSankaJson('/novel/sakuranovel/home');
    const items = await Promise.all(normalizeNovelList(payload).map((item) => backfillNovelPoster(item)));
    return {
      featured: items.slice(0, 10),
      latest: items.slice(0, 24),
    };
  });
}

export async function getNovelGenres(): Promise<NovelGenre[]> {
  return withRuntimeCache('novel:genres', CACHE_TTL.medium, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>('/novel/sakuranovel/genres');
    const data = Array.isArray(payload.data) ? payload.data : [];

    return data
      .map((entry) => {
        const record = readObject(entry);
        const name = readString(record.name);
        const slug = readString(record.slug);
        if (!name || !slug) {
          return null;
        }
        const genre: NovelGenre = {
          name,
          slug,
          count: readString(record.count),
        };
        return genre;
      })
      .filter((genre): genre is NovelGenre => genre !== null);
  });
}

export async function getNovelsByGenre(slug: string): Promise<NovelListItem[]> {
  return withRuntimeCache(`novel:genre:${slug}`, CACHE_TTL.short, async () => {
    const payload = await fetchSankaJson(`/novel/sakuranovel/genre/${encodeURIComponent(slug)}`);
    return Promise.all(normalizeNovelList(payload).map((item) => backfillNovelPoster(item)));
  });
}

export async function getNovelDetail(slug: string): Promise<NovelDetail> {
  return withRuntimeCache(`novel:detail:${slug}`, CACHE_TTL.medium, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/novel/sakuranovel/detail/${encodeURIComponent(slug)}`);
    const data = readObject(payload.data);
    const info = readObject(data.info);
    const sourcePoster = readString(data.poster);
    const writtenMetadata = needsNovelCoverFallback(sourcePoster)
      ? await getWrittenMetadata(readString(data.title) || slug)
      : null;

    return {
      title: readString(data.title) || slug,
      altTitle: readString(data.alt_title),
      slug: readString(data.slug) || slug,
      poster: writtenMetadata?.cover || sourcePoster,
      rating: readString(data.rating),
      status: readString(data.status),
      type: readString(data.type) || 'Novel',
      synopsis: readString(data.synopsis) || writtenMetadata?.description || '',
      info: {
        country: readString(info.country),
        published: readString(info.published),
        author: readString(info.author) || writtenMetadata?.authors?.join(', ') || '',
        totalChapters: readString(info.total_chapter),
        tags: readString(info.tags),
      },
      genres: (Array.isArray(data.genres) ? data.genres : [])
        .map((entry) => {
          const record = readObject(entry);
          const name = readString(record.name);
          const genreSlug = readString(record.slug);
          if (!name || !genreSlug) {
            return null;
          }
          const genre: NovelGenre = {
            name,
            slug: genreSlug,
          };
          return genre;
        })
        .filter((genre): genre is NovelGenre => genre !== null),
      chapters: (Array.isArray(data.chapters) ? data.chapters : [])
        .map((entry) => {
          const record = readObject(entry);
          const title = readString(record.title);
          const chapterSlug = readString(record.slug);
          if (!title || !chapterSlug) {
            return null;
          }
          return {
            title,
            date: readString(record.date),
            slug: chapterSlug,
          };
        })
        .filter((chapter): chapter is NovelDetail['chapters'][number] => chapter !== null),
    };
  });
}

export async function getNovelRead(slug: string): Promise<NovelRead> {
  return withRuntimeCache(`novel:read:${slug}`, CACHE_TTL.short, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/novel/sakuranovel/read/${encodeURIComponent(slug)}`);
    const data = readObject(payload.data);

    return {
      title: readString(data.title) || slug,
      content: readString(data.content),
    };
  });
}
