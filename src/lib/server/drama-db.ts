import 'server-only';

import { getComicDb } from '@/lib/server/comic-db';

type JsonRecord = Record<string, unknown>;

type DramaItemRow = {
  item_key: string;
  slug: string;
  source: string;
  title: string;
  cover_url: string | null;
  status: string | null;
  detail: JsonRecord | null;
  updated_at: string | null;
};

type DramaUnitRow = {
  slug: string;
  title: string | null;
  label: string | null;
  number: number | null;
  detail: JsonRecord | null;
};

function readRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => readString(entry)).filter(Boolean) : [];
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

function qualityRank(label: string): number {
  const parsed = Number.parseInt(label.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getItemSynopsis(detail: JsonRecord): string {
  return readString(detail.synopsis);
}

function getItemTags(detail: JsonRecord): string[] {
  const tags = readStringArray(detail.tags);
  if (tags.length > 0) {
    return tags;
  }
  return [...readStringArray(detail.genre_names), ...readStringArray(detail.category_names)].filter(Boolean);
}

function getEpisodeCount(detail: JsonRecord, fallback: number): number {
  const raw = detail.episode_count;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeCard(row: DramaItemRow) {
  const detail = readRecord(row.detail);
  return {
    slug: row.slug,
    title: stripEpisodeSuffix(row.title || titleFromSlug(row.slug)),
    image: row.cover_url || '',
    subtitle:
      readString(detail.platform_code) ||
      row.status ||
      (getEpisodeCount(detail, 0) > 0 ? `${getEpisodeCount(detail, 0)} Episodes` : '') ||
      undefined,
    badgeText:
      readString(detail.presentation_format) ||
      readString(detail.platform_code) ||
      row.source,
    bookId: undefined as string | undefined,
  };
}

function extractMirrors(detail: JsonRecord): Array<{ label: string; embed_url: string }> {
  const streamLinks = readRecord(detail.stream_links_json);
  const mirrors = Object.entries(streamLinks)
    .map(([label, value]) => {
      const record = readRecord(value);
      const directUrl = readString(value);
      const embedUrl = readString(record.video_url) || readString(record.embed_url) || directUrl;
      return {
        label: label === 'default' ? 'Server 1' : label.toUpperCase(),
        embed_url: embedUrl,
      };
    })
    .filter((entry) => entry.embed_url);

  if (mirrors.length > 0) {
    return mirrors.sort((left, right) => qualityRank(right.label) - qualityRank(left.label));
  }

  const fallback = readString(detail.video_url) || readString(detail.embed_url) || readString(detail.stream_url);
  return fallback ? [{ label: 'Server 1', embed_url: fallback }] : [];
}

async function listDramaItems(limit: number, preferredSource?: string): Promise<DramaItemRow[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  const rows = await sql<DramaItemRow[]>`
    select
      i.item_key,
      i.slug,
      i.source,
      i.title,
      i.cover_url,
      i.status,
      i.detail,
      i.updated_at::text as updated_at
    from public.media_items i
    where i.source in ('dracinly', 'drakorid')
      and i.media_type in ('series', 'drama')
    order by
      case
        when ${preferredSource ?? ''} <> '' and i.source = ${preferredSource ?? ''} then 0
        when i.source = 'dracinly' then 1
        else 2
      end,
      i.updated_at desc nulls last
    limit ${limit}
  `;
  return rows;
}

async function resolveDramaItem(slug: string): Promise<DramaItemRow | null> {
  const sql = getComicDb();
  if (!sql) {
    return null;
  }

  const rows = await sql<DramaItemRow[]>`
    select
      i.item_key,
      i.slug,
      i.source,
      i.title,
      i.cover_url,
      i.status,
      i.detail,
      i.updated_at::text as updated_at
    from public.media_items i
    where i.source in ('dracinly', 'drakorid')
      and i.media_type in ('series', 'drama')
      and (
        i.slug = ${slug}
        or exists (
          select 1
          from public.media_units u
          where u.item_key = i.item_key
            and u.unit_type = 'episode'
            and u.slug = ${slug}
        )
      )
    order by i.updated_at desc nulls last
    limit 1
  `;

  return rows[0] ?? null;
}

async function listDramaEpisodes(itemKey: string): Promise<DramaUnitRow[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  return sql<DramaUnitRow[]>`
    select
      u.slug,
      u.title,
      u.label,
      u.number,
      u.detail
    from public.media_units u
    where u.item_key = ${itemKey}
      and u.unit_type = 'episode'
    order by u.number asc nulls last, u.updated_at asc nulls last, u.slug asc
  `;
}

async function resolveDramaEpisode(itemKey: string, slug: string, index: number): Promise<DramaUnitRow | null> {
  const sql = getComicDb();
  if (!sql) {
    return null;
  }

  const rows = await sql<DramaUnitRow[]>`
    select
      u.slug,
      u.title,
      u.label,
      u.number,
      u.detail
    from public.media_units u
    where u.item_key = ${itemKey}
      and u.unit_type = 'episode'
      and (u.slug = ${slug} or (u.number is not null and u.number = ${index}))
    order by
      case when u.slug = ${slug} then 0 else 1 end,
      u.number asc nulls last
    limit 1
  `;

  return rows[0] ?? null;
}

export async function getVerticalDramaHomeFromDb(entry: 'drachin' | 'dramabox') {
  const rows = await listDramaItems(24, entry === 'dramabox' ? 'dracinly' : 'dracinly');
  const cards = rows.map(normalizeCard);
  return {
    featured: cards.slice(0, 6),
    latest: cards.slice(0, 12),
    popular: cards.slice(0, 12),
    trending: cards.slice(0, 12),
  };
}

export async function searchVerticalDramaFromDb(query: string) {
  const sql = getComicDb();
  if (!sql || !query.trim()) {
    return [];
  }

  const rows = await sql<DramaItemRow[]>`
    select
      i.item_key,
      i.slug,
      i.source,
      i.title,
      i.cover_url,
      i.status,
      i.detail,
      i.updated_at::text as updated_at
    from public.media_items i
    where i.source in ('dracinly', 'drakorid')
      and i.media_type in ('series', 'drama')
      and (
        i.search_vec @@ plainto_tsquery('simple', ${query})
        or i.title ilike ${`%${query}%`}
        or i.slug ilike ${`%${query}%`}
      )
    order by i.updated_at desc nulls last
    limit 24
  `;

  return rows.map(normalizeCard);
}

export async function getVerticalDramaDetailFromDb(slug: string) {
  const item = await resolveDramaItem(slug);
  if (!item) {
    return null;
  }

  const detail = readRecord(item.detail);
  const episodes = await listDramaEpisodes(item.item_key);

  return {
    slug: item.slug,
    title: stripEpisodeSuffix(item.title || titleFromSlug(item.slug)),
    poster: item.cover_url || '',
    synopsis: getItemSynopsis(detail),
    tags: getItemTags(detail),
    totalEpisodes: getEpisodeCount(detail, episodes.length),
    episodes: episodes.map((episode) => ({
      episode: String(episode.number ?? (readString(episode.label) || '')),
      index: String(episode.number ?? 1),
      slug: episode.slug,
    })),
  };
}

export async function getVerticalDramaEpisodeFromDb(slug: string, index: number) {
  const item = await resolveDramaItem(slug);
  if (!item) {
    return null;
  }

  const episode = await resolveDramaEpisode(item.item_key, slug, index);
  if (!episode) {
    return null;
  }

  const detail = readRecord(episode.detail);
  const mirrors = extractMirrors(detail);

  return {
    slug: item.slug,
    title: readString(episode.title) || `${stripEpisodeSuffix(item.title || titleFromSlug(item.slug))} Episode ${episode.number ?? index}`,
    episode: String(episode.number ?? index),
    poster: item.cover_url || '',
    mirrors,
    defaultUrl: mirrors[0]?.embed_url || '',
  };
}
