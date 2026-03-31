import 'server-only';

import { getJikanEnrichment } from '@/lib/enrichment';
import {
  buildComicCacheKey,
  getComicSortedSetDescending,
  incrementComicSortedSet,
  rememberComicCacheValue,
} from '@/lib/server/comic-cache';
import { getComicDb } from '@/lib/server/comic-db';
import { trackComicAnalyticsEvent } from '@/lib/server/comic-analytics';
import type {
  ChapterDetail,
  JikanEnrichment,
  MangaDetail,
  MangaSearchResult,
  MangaSubtype,
} from '@/lib/types';

type JsonRecord = Record<string, unknown>;

type ComicItemRow = {
  item_key: string;
  source: string;
  media_type: string;
  slug: string;
  title: string;
  cover_url: string;
  status: string;
  release_year: number | null;
  score: number;
  detail: JsonRecord | null;
  updated_at: string;
  chapter_count?: number | null;
};

type ComicChapterRow = {
  slug: string;
  title: string;
  label: string;
  number: number | null;
  prev_slug: string | null;
  next_slug: string | null;
  published_at: string | null;
  detail: JsonRecord | null;
};

type ComicChapterDetailRow = ComicChapterRow & {
  item_key: string;
  item_slug: string;
  item_title: string;
  media_type: string;
  source: string;
  cover_url: string;
  item_detail: JsonRecord | null;
};

type PopularComicEntry = {
  slug: string;
  score: number;
};

const LIST_CACHE_TTL_SECONDS = 60 * 10;
const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
const CHAPTER_CACHE_TTL_SECONDS = 60 * 10;
const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
const NSFW_SQL_CONDITION = `
  exists (
    select 1
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(detail->'genres') = 'array' then detail->'genres'
        else '[]'::jsonb
      end
    ) as genre_name(value)
    where lower(genre_name.value) = 'nsfw'
  )
  or exists (
    select 1
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(detail->'tags') = 'array' then detail->'tags'
        else '[]'::jsonb
      end
    ) as tag_name(value)
    where lower(tag_name.value) = 'nsfw'
  )
`;

function readRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => readText(entry))
    .filter(Boolean);
}

function hasNsfwTag(detail: JsonRecord): boolean {
  const genres = readStringArray(detail.genres).map((entry) => entry.toLowerCase());
  if (genres.includes('nsfw')) {
    return true;
  }

  const tags = readStringArray(detail.tags).map((entry) => entry.toLowerCase());
  return tags.includes('nsfw');
}

function getVisibilityCacheSegment(includeNsfw: boolean): 'auth' | 'public' {
  return includeNsfw ? 'auth' : 'public';
}

function buildVisibilityCondition(includeNsfw: boolean, detailColumn = 'detail'): string {
  if (includeNsfw) {
    return '';
  }

  return `and not (${NSFW_SQL_CONDITION.replaceAll('detail', detailColumn)})`;
}

function toTitleCase(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'Manga';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const extractSlugFromUrl = (url: string) => (url ? url.split('/').filter(Boolean).pop() || '' : '');

export const getHDThumbnail = (url: string) => {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  return url.split('?')[0];
};

function normalizeSubtype(rawSubtype: string, detailType?: unknown): MangaSubtype {
  const fromSubtype = rawSubtype.trim().toLowerCase();
  if (fromSubtype === 'manhwa' || fromSubtype === 'manhua' || fromSubtype === 'manga') {
    return fromSubtype;
  }

  const fromDetail = readText(detailType).toLowerCase();
  if (fromDetail.includes('manhwa')) return 'manhwa';
  if (fromDetail.includes('manhua')) return 'manhua';
  return 'manga';
}

function buildGenreText(detail: JsonRecord): string {
  return readStringArray(detail.genres).join(', ');
}

function mapComicCard(row: ComicItemRow): MangaSearchResult {
  const detail = readRecord(row.detail);
  const subtype = normalizeSubtype(row.media_type, detail.type);
  const title = readText(row.title);
  const slug = readText(row.slug);
  const cover = getHDThumbnail(readText(row.cover_url));
  const href = `/comic/${slug}`;

  return {
    title,
    altTitle: readText(detail.alt_title) || null,
    slug,
    href,
    thumbnail: cover,
    type: toTitleCase(subtype),
    subtype,
    genre: buildGenreText(detail),
    description: readText(detail.synopsis),
    chapter: readText(detail.latest_chapter_label),
    time_ago: '',
    link: href,
    image: cover,
  };
}

function mapComicGenres(detail: JsonRecord): MangaDetail['genres'] {
  return readStringArray(detail.genres).map((genre) => ({
    name: genre,
    slug: slugify(genre),
    link: '',
  }));
}

function compareTimestampDesc(left: string | null | undefined, right: string | null | undefined): number {
  const leftValue = readText(left);
  const rightValue = readText(right);

  if (leftValue && rightValue) {
    return rightValue.localeCompare(leftValue);
  }
  if (leftValue) return -1;
  if (rightValue) return 1;
  return 0;
}

function sortComicChapterRows(rows: ComicChapterRow[]): ComicChapterRow[] {
  return [...rows].sort((left, right) => {
    const leftNumber = left.number ?? Number.NEGATIVE_INFINITY;
    const rightNumber = right.number ?? Number.NEGATIVE_INFINITY;

    if (leftNumber !== rightNumber) {
      return rightNumber - leftNumber;
    }

    const publishedAtDiff = compareTimestampDesc(left.published_at, right.published_at);
    if (publishedAtDiff !== 0) {
      return publishedAtDiff;
    }

    return readText(right.slug).localeCompare(readText(left.slug));
  });
}

function mapComicChapters(rows: ComicChapterRow[]): MangaDetail['chapters'] {
  return sortComicChapterRows(rows).map((row) => ({
    chapter: readText(row.label) || readText(row.title),
    slug: readText(row.slug),
    link: `/comic/${readText(row.slug)}`,
    date: readText(row.published_at),
  }));
}

function buildFallbackRecommendations(
  currentRow: ComicItemRow,
  similarRows: ComicItemRow[],
): MangaDetail['similar_manga'] {
  const currentSubtype = normalizeSubtype(currentRow.media_type, readRecord(currentRow.detail).type);

  return similarRows
    .map((row) => {
      const detail = readRecord(row.detail);
      const subtype = normalizeSubtype(row.media_type, detail.type);
      return {
        title: readText(row.title),
        slug: readText(row.slug),
        link: `/comic/${readText(row.slug)}`,
        image: getHDThumbnail(readText(row.cover_url)),
        type: toTitleCase(subtype),
        subtype,
        description: readText(detail.synopsis),
      };
    })
    .filter((item) => item.slug && item.title)
    .sort((left, right) => {
      const leftSubtypeBoost = left.subtype === currentSubtype ? 1 : 0;
      const rightSubtypeBoost = right.subtype === currentSubtype ? 1 : 0;
      return rightSubtypeBoost - leftSubtypeBoost;
    })
    .map((item) => ({
      title: item.title,
      slug: item.slug,
      link: item.link,
      image: item.image,
      type: item.type,
      description: item.description,
    }))
    .slice(0, 8);
}

function parseComicPageImages(detail: JsonRecord): string[] {
  const pages = Array.isArray(detail.pages) ? detail.pages : [];

  return pages
    .map((page, index) => {
      const record = readRecord(page);
      return {
        url: getHDThumbnail(readText(record.url)),
        position: readNumber(record.position) ?? index + 1,
      };
    })
    .filter((page) => page.url)
    .sort((left, right) => left.position - right.position)
    .map((page) => page.url);
}

async function getSql() {
  const sql = getComicDb();
  if (!sql) {
    throw new Error('Comic database is not configured');
  }
  return sql;
}

async function getComicRowsBySlugs(slugs: string[], includeNsfw: boolean): Promise<ComicItemRow[]> {
  if (slugs.length === 0) {
    return [];
  }

  const sql = await getSql();
  const placeholders = slugs.map((_, index) => `$${index + 1}`).join(', ');
  const rows = await sql.unsafe<ComicItemRow[]>(
    `
    select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
    from public.media_items
    where media_type in ('manga', 'manhwa', 'manhua') and slug in (${placeholders})
      ${buildVisibilityCondition(includeNsfw)}
  `,
    slugs,
  );

  const order = new Map(slugs.map((slug, index) => [slug, index]));
  return [...rows].sort((left, right) => {
    return (order.get(left.slug) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.slug) ?? Number.MAX_SAFE_INTEGER);
  });
}

async function getPopularLeaderboard(limit: number, subtype?: MangaSubtype): Promise<PopularComicEntry[]> {
  const key = subtype
    ? buildComicCacheKey('leaderboard', subtype)
    : buildComicCacheKey('leaderboard', 'all');
  const entries = await getComicSortedSetDescending(key, 0, Math.max(limit - 1, 0));

  return entries
    .map((entry) => ({ slug: entry.member, score: entry.score }))
    .filter((entry) => entry.slug);
}

async function getPopularFallbackRows(limit: number, includeNsfw: boolean): Promise<ComicItemRow[]> {
  const sql = await getSql();
  return sql.unsafe<ComicItemRow[]>(
    `
    with chapter_stats as (
      select item_key, count(*)::int as chapter_count, max(updated_at) as latest_chapter_update
      from public.media_units
      where unit_type = 'chapter'
      group by item_key
    )
    select
      m.item_key,
      m.source,
      m.media_type,
      m.slug,
      m.title,
      m.cover_url,
      m.status,
      m.release_year,
      m.score,
      m.detail,
      m.updated_at,
      coalesce(chapter_stats.chapter_count, 0) as chapter_count
    from public.media_items m
    left join chapter_stats on chapter_stats.item_key = m.item_key
    where m.media_type in ('manga', 'manhwa', 'manhua')
      ${buildVisibilityCondition(includeNsfw, 'm.detail')}
    order by coalesce(chapter_stats.chapter_count, 0) desc, m.updated_at desc
    limit $1
  `,
    [Math.max(limit, 1)],
  );
}

async function queryLatestComics(page = 1, limit = 24, includeNsfw = false): Promise<MangaSearchResult[]> {
  const offset = Math.max(page - 1, 0) * Math.max(limit, 1);
  const sql = await getSql();
  const rows = await sql.unsafe<ComicItemRow[]>(
    `
    select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
    from public.media_items
    where media_type in ('manga', 'manhwa', 'manhua')
      ${buildVisibilityCondition(includeNsfw)}
    order by updated_at desc
    limit $1 offset $2
  `,
    [Math.max(limit, 1), offset],
  );

  return rows.map(mapComicCard);
}

async function queryPopularComics(limit = 24, includeNsfw = false): Promise<MangaSearchResult[]> {
  const leaderboard = await getPopularLeaderboard(limit);
  if (leaderboard.length > 0) {
    const rows = await getComicRowsBySlugs(
      leaderboard.map((entry) => entry.slug),
      includeNsfw,
    );
    if (rows.length > 0) {
      return rows.map(mapComicCard);
    }
  }

  const fallbackRows = await getPopularFallbackRows(limit, includeNsfw);
  return fallbackRows.map(mapComicCard);
}

async function queryNsfwComics(limit = 24): Promise<MangaSearchResult[]> {
  const sql = await getSql();
  const rows = await sql.unsafe<ComicItemRow[]>(
    `
    select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
    from public.media_items
    where media_type in ('manga', 'manhwa', 'manhua')
      and (${NSFW_SQL_CONDITION})
    order by updated_at desc
    limit $1
  `,
    [Math.max(limit, 1)],
  );

  return rows.map(mapComicCard);
}

async function queryComicSearch(query: string, page = 1, limit = 24, includeNsfw = false): Promise<MangaSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const offset = Math.max(page - 1, 0) * Math.max(limit, 1);
  const ilikeQuery = `%${trimmed}%`;
  const sql = await getSql();
  const rows = await sql.unsafe<ComicItemRow[]>(
    `
    select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
    from public.media_items
    where media_type in ('manga', 'manhwa', 'manhua')
      and (
        search_vec @@ plainto_tsquery('simple', $1)
        or title ilike $2
      )
      ${buildVisibilityCondition(includeNsfw)}
    order by
      ts_rank_cd(search_vec, plainto_tsquery('simple', $1)) desc,
      updated_at desc
    limit $3 offset $4
  `,
    [trimmed, ilikeQuery, Math.max(limit, 1), offset],
  );

  return rows.map(mapComicCard);
}

async function queryGenreComics(genre: string, page = 1, limit = 24, includeNsfw = false): Promise<MangaSearchResult[]> {
  const trimmed = genre.trim();
  if (!trimmed) {
    return [];
  }

  const offset = Math.max(page - 1, 0) * Math.max(limit, 1);
  const sql = await getSql();
  const rows = await sql.unsafe<ComicItemRow[]>(
    `
    select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
    from public.media_items
    where media_type in ('manga', 'manhwa', 'manhua')
      and exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(detail->'genres') = 'array' then detail->'genres'
            else '[]'::jsonb
          end
        ) as genre_name(value)
        where lower(genre_name.value) = lower($1)
      )
      ${buildVisibilityCondition(includeNsfw)}
    order by updated_at desc
    limit $2 offset $3
  `,
    [trimmed, Math.max(limit, 1), offset],
  );

  return rows.map(mapComicCard);
}

async function queryComicDetail(slug: string, includeNsfw = false): Promise<MangaDetail> {
  const sql = await getSql();
  const itemRows = await sql.unsafe<ComicItemRow[]>(
    `
    select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
    from public.media_items
    where media_type in ('manga', 'manhwa', 'manhua') and slug = $1
      ${buildVisibilityCondition(includeNsfw)}
    limit 1
  `,
    [slug],
  );
  const currentRow = itemRows[0];
  if (!currentRow) {
    throw new Error('Comic detail not found');
  }

  const detail = readRecord(currentRow.detail);
  const chapters = await sql<ComicChapterRow[]>`
    select slug, title, label, number, prev_slug, next_slug, published_at, detail
    from public.media_units
    where item_key = ${currentRow.item_key} and unit_type = 'chapter'
    order by number desc nulls last, published_at desc nulls last, slug desc
  `;

  const currentGenres = readStringArray(detail.genres);
  let similarRows: ComicItemRow[] = [];
  if (currentGenres.length > 0) {
    similarRows = await sql.unsafe<ComicItemRow[]>(
      `
      select item_key, source, media_type, slug, title, cover_url, status, release_year, score, detail, updated_at
      from public.media_items
      where media_type in ('manga', 'manhwa', 'manhua') and slug <> $1
        ${buildVisibilityCondition(includeNsfw)}
      order by updated_at desc
      limit 40
    `,
      [slug],
    );
  }

  const filteredSimilarRows = similarRows.filter((row) => {
    const rowGenres = readStringArray(readRecord(row.detail).genres);
    return rowGenres.some((genre) => currentGenres.includes(genre));
  });

  const subtype = normalizeSubtype(currentRow.media_type, detail.type);
  const synopsis = readText(detail.synopsis);
  return {
    creator: currentRow.source || 'dwizzyWEEB',
    slug: currentRow.slug,
    subtype,
    title: currentRow.title,
    title_indonesian: readText(detail.alt_title),
    image: getHDThumbnail(currentRow.cover_url),
    synopsis,
    synopsis_full: synopsis,
    summary: synopsis,
    background_story: '',
    metadata: {
      type: toTitleCase(subtype),
      author: readText(detail.author),
      status: currentRow.status || '',
      concept: '',
      age_rating: currentGenres.some((genre) => genre.toLowerCase() === 'nsfw') ? 'NSFW' : '',
      reading_direction: '',
    },
    genres: mapComicGenres(detail),
    chapters: mapComicChapters(chapters),
    similar_manga: buildFallbackRecommendations(currentRow, filteredSimilarRows),
  };
}

async function queryComicChapter(slug: string, includeNsfw = false): Promise<ChapterDetail> {
  const sql = await getSql();
  const rows = await sql.unsafe<ComicChapterDetailRow[]>(
    `
    select
      u.item_key,
      u.slug,
      u.title,
      u.label,
      u.number,
      u.prev_slug,
      u.next_slug,
      u.published_at,
      u.detail,
      i.slug as item_slug,
      i.title as item_title,
      i.media_type,
      i.source,
      i.cover_url,
      i.detail as item_detail
    from public.media_units u
    join public.media_items i on i.item_key = u.item_key
    where u.unit_type = 'chapter' and u.slug = $1
      ${buildVisibilityCondition(includeNsfw, 'i.detail')}
    limit 1
  `,
    [slug],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Comic chapter not found');
  }

  const detail = readRecord(row.detail);
  if (!includeNsfw && hasNsfwTag(readRecord(row.item_detail))) {
    throw new Error('Comic chapter not found');
  }
  return {
    title: row.title || row.label || row.slug,
    subtype: normalizeSubtype(row.media_type, readRecord(row.item_detail).type),
    manga_slug: row.item_slug,
    manga_title: row.item_title,
    chapter_title: row.label || row.title,
    images: parseComicPageImages(detail),
    navigation: {
      next: row.next_slug,
      prev: row.prev_slug,
      nextChapter: row.next_slug,
      previousChapter: row.prev_slug,
    },
  };
}

async function recordComicAccess(params: {
  slug: string;
  subtype: MangaSubtype;
  eventName: 'detail_view' | 'chapter_view';
  weight: number;
}): Promise<void> {
  const allKey = buildComicCacheKey('leaderboard', 'all');
  const subtypeKey = buildComicCacheKey('leaderboard', params.subtype);

  await Promise.allSettled([
    incrementComicSortedSet(allKey, params.slug, params.weight),
    incrementComicSortedSet(subtypeKey, params.slug, params.weight),
    trackComicAnalyticsEvent({
      eventName: params.eventName,
      comicSlug: params.slug,
      comicType: params.subtype,
      details: {
        weight: params.weight,
      },
    }),
  ]);
}

export async function getPopularManga(
  limit = 40,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const comics = await rememberComicCacheValue(
    buildComicCacheKey('list', 'popular', getVisibilityCacheSegment(includeNsfw), limit),
    LIST_CACHE_TTL_SECONDS,
    () => queryPopularComics(limit, includeNsfw),
  );

  return { comics };
}

export async function getNsfwComics(limit = 24): Promise<MangaSearchResult[]> {
  return rememberComicCacheValue(
    buildComicCacheKey('list', 'nsfw', limit),
    LIST_CACHE_TTL_SECONDS,
    () => queryNsfwComics(limit),
  );
}

export async function getNewManga(
  page = 1,
  limit = 10,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const comics = await rememberComicCacheValue(
    buildComicCacheKey('list', 'latest', getVisibilityCacheSegment(includeNsfw), page, limit),
    LIST_CACHE_TTL_SECONDS,
    () => queryLatestComics(page, limit, includeNsfw),
  );

  return { comics };
}

export async function searchManga(
  query: string,
  page = 1,
  limit = 24,
  options: { includeNsfw?: boolean } = {},
): Promise<{ data: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const data = await rememberComicCacheValue(
    buildComicCacheKey('search', getVisibilityCacheSegment(includeNsfw), query.toLowerCase(), page, limit),
    SEARCH_CACHE_TTL_SECONDS,
    () => queryComicSearch(query, page, limit, includeNsfw),
  );

  return { data };
}

export async function getMangaByGenre(
  genre: string,
  page = 1,
  limit = 24,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const comics = await rememberComicCacheValue(
    buildComicCacheKey('genre', getVisibilityCacheSegment(includeNsfw), genre.toLowerCase(), page, limit),
    LIST_CACHE_TTL_SECONDS,
    () => queryGenreComics(genre, page, limit, includeNsfw),
  );

  return { comics };
}

export async function getMangaDetail(
  slug: string,
  options: { includeNsfw?: boolean; recordAccess?: boolean } = {},
): Promise<MangaDetail> {
  const includeNsfw = options.includeNsfw === true;
  const detail = await rememberComicCacheValue(
    buildComicCacheKey('detail', getVisibilityCacheSegment(includeNsfw), slug),
    DETAIL_CACHE_TTL_SECONDS,
    () => queryComicDetail(slug, includeNsfw),
  );

  if (options.recordAccess) {
    void recordComicAccess({
      slug: detail.slug,
      subtype: detail.subtype ?? getMangaSubtype(detail),
      eventName: 'detail_view',
      weight: 1,
    });
  }

  return detail;
}

export async function getMangaChapter(
  slug: string,
  options: { includeNsfw?: boolean; recordAccess?: boolean } = {},
): Promise<ChapterDetail> {
  const includeNsfw = 'includeNsfw' in options && options.includeNsfw === true;
  const chapter = await rememberComicCacheValue(
    buildComicCacheKey('chapter', getVisibilityCacheSegment(includeNsfw), slug),
    CHAPTER_CACHE_TTL_SECONDS,
    () => queryComicChapter(slug, includeNsfw),
  );

  if (options.recordAccess) {
    void recordComicAccess({
      slug: chapter.manga_slug || slug,
      subtype: chapter.subtype ?? 'manga',
      eventName: 'chapter_view',
      weight: 3,
    });
  }

  return chapter;
}

export async function getMangaRecommendations(slug: string): Promise<{ recommendations: MangaSearchResult[] }> {
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
}

export const getMangaSubtype = (
  item: Pick<MangaSearchResult, 'type' | 'subtype'> | Pick<MangaDetail, 'subtype' | 'metadata'>,
): MangaSubtype => {
  const subtype = 'subtype' in item ? item.subtype : undefined;
  if (subtype === 'manhwa' || subtype === 'manhua' || subtype === 'manga') {
    return subtype;
  }

  const type = 'metadata' in item ? item.metadata.type : item.type;
  const normalizedType = type?.toLowerCase() ?? '';
  if (normalizedType.includes('manhwa')) return 'manhwa';
  if (normalizedType.includes('manhua')) return 'manhua';
  return 'manga';
};

export const filterMangaBySubtype = (items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] =>
  items.filter((item) => getMangaSubtype(item) === subtype);

export type NewManga = MangaSearchResult;
export type RecommendationManga = MangaSearchResult;
export { getJikanEnrichment };
export type { ChapterDetail, JikanEnrichment, MangaDetail, MangaSearchResult, MangaSubtype };
