import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import { getComicDb } from '@/lib/server/comic-db';

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/series', priority: 0.95, changeFrequency: 'hourly' },
  { path: '/series/list', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/anime', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/donghua', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/drama', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/movies', priority: 0.9, changeFrequency: 'daily' },
  { path: '/comic', priority: 0.9, changeFrequency: 'daily' },
  { path: '/comic/manga', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/manhwa', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/manhua', priority: 0.85, changeFrequency: 'daily' },
  { path: '/novel', priority: 0.8, changeFrequency: 'daily' },
  { path: '/drachin', priority: 0.8, changeFrequency: 'daily' },
  { path: '/dramabox', priority: 0.8, changeFrequency: 'daily' },
] as const satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}>;

type SlugRow = {
  slug: string;
  updated_at: string;
};

function toEntry(
  path: string,
  lastModified: string | Date,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
): SitemapEntry {
  return {
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    priority,
    changeFrequency,
  };
}

async function loadDynamicSitemapEntries(): Promise<SitemapEntry[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  const [seriesDetails, seriesWatch, movieDetails, movieWatch, comicDetails, novelDetails, drachinDetails, drachinEpisodes, dramaboxDetails] = await Promise.all([
    sql.unsafe<SlugRow[]>(`
      select slug, updated_at::text
      from public.media_items
      where surface_type = 'series'
        and coalesce(is_nsfw, false) = false
      order by updated_at desc
      limit 300
    `),
    sql.unsafe<SlugRow[]>(`
      select u.slug, coalesce(u.published_at, u.updated_at)::text as updated_at
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      where i.surface_type = 'series'
        and u.unit_type = 'episode'
        and coalesce(i.is_nsfw, false) = false
      order by coalesce(u.published_at, u.updated_at) desc
      limit 600
    `),
    sql.unsafe<SlugRow[]>(`
      select slug, updated_at::text
      from public.media_items
      where surface_type = 'movie'
        and coalesce(is_nsfw, false) = false
      order by updated_at desc
      limit 300
    `),
    sql.unsafe<SlugRow[]>(`
      select distinct on (i.slug) i.slug, coalesce(u.published_at, u.updated_at, i.updated_at)::text as updated_at
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      where i.surface_type = 'movie'
        and u.unit_type = 'episode'
        and coalesce(i.is_nsfw, false) = false
      order by i.slug, coalesce(u.published_at, u.updated_at, i.updated_at) desc
      limit 300
    `),
    sql.unsafe<SlugRow[]>(`
      select slug, updated_at::text
      from public.media_items
      where surface_type = 'comic'
        and coalesce(is_nsfw, false) = false
      order by updated_at desc
      limit 300
    `),
    sql.unsafe<SlugRow[]>(`
      select slug, updated_at::text
      from public.media_items
      where surface_type = 'novel'
        and coalesce(is_nsfw, false) = false
      order by updated_at desc
      limit 300
    `),
    sql.unsafe<SlugRow[]>(`
      select slug, updated_at::text
      from public.media_items
      where source = 'drakorid'
        and surface_type = 'series'
        and coalesce(is_nsfw, false) = false
      order by updated_at desc
      limit 300
    `),
    sql.unsafe<SlugRow[]>(`
      select u.slug, coalesce(u.published_at, u.updated_at)::text as updated_at
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      where i.source = 'drakorid'
        and i.surface_type = 'series'
        and u.unit_type = 'episode'
        and coalesce(i.is_nsfw, false) = false
      order by coalesce(u.published_at, u.updated_at) desc
      limit 600
    `),
    sql.unsafe<SlugRow[]>(`
      select slug, updated_at::text
      from public.media_items
      where source = 'dramabox'
        and surface_type = 'series'
        and coalesce(is_nsfw, false) = false
      order by updated_at desc
      limit 300
    `),
  ]);

  return [
    ...seriesDetails.map((row) => toEntry(`/series/${row.slug}`, row.updated_at, 0.8, 'daily')),
    ...seriesWatch.map((row) => toEntry(`/series/watch/${row.slug}`, row.updated_at, 0.85, 'daily')),
    ...movieDetails.map((row) => toEntry(`/movies/${row.slug}`, row.updated_at, 0.75, 'weekly')),
    ...movieWatch.map((row) => toEntry(`/movies/watch/${row.slug}`, row.updated_at, 0.8, 'weekly')),
    ...comicDetails.map((row) => toEntry(`/comic/${row.slug}`, row.updated_at, 0.75, 'daily')),
    ...novelDetails.map((row) => toEntry(`/novel/${row.slug}`, row.updated_at, 0.7, 'daily')),
    ...drachinDetails.map((row) => toEntry(`/drachin/${row.slug}`, row.updated_at, 0.7, 'daily')),
    ...drachinEpisodes.map((row) => toEntry(`/drachin/episode/${row.slug}`, row.updated_at, 0.75, 'daily')),
    ...dramaboxDetails.map((row) => toEntry(`/dramabox/${row.slug}`, row.updated_at, 0.7, 'weekly')),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.map(({ path, priority, changeFrequency }) =>
    toEntry(path, new Date('2026-03-31T00:00:00Z'), priority, changeFrequency),
  );

  const dynamicEntries = await rememberComicCacheValue(
    buildComicCacheKey('seo', 'sitemap', 'v2'),
    60 * 30,
    loadDynamicSitemapEntries,
  );

  return [...staticEntries, ...dynamicEntries];
}
