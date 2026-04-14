import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import { getComicDb } from '@/lib/server/comic-db';
import { resolveDynamicSitemapEntries } from './sitemap-utils';

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/series', priority: 0.95, changeFrequency: 'hourly' },
  { path: '/series/list', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/anime', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/donghua', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/drama', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/series/ongoing', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/movies', priority: 0.9, changeFrequency: 'daily' },
  { path: '/movies/latest', priority: 0.85, changeFrequency: 'daily' },
  { path: '/movies/popular', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic', priority: 0.9, changeFrequency: 'daily' },
  { path: '/comic/latest', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/popular', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/ongoing', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/manga', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/manhwa', priority: 0.85, changeFrequency: 'daily' },
  { path: '/comic/manhua', priority: 0.85, changeFrequency: 'daily' },
  { path: '/novel', priority: 0.8, changeFrequency: 'daily' },
  { path: '/series/short', priority: 0.85, changeFrequency: 'daily' },
] as const satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}>;

type SlugRow = {
  slug: string;
  updated_at: string;
};

type BrowseValueRow = {
  value: string;
  updated_at: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

  const [seriesDetails, seriesWatch, movieDetails, movieWatch, comicDetails, novelDetails, drachinDetails, drachinEpisodes, dramaboxDetails, seriesGenres, seriesCountries, seriesYears] = await Promise.all([
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
    sql.unsafe<BrowseValueRow[]>(`
      select
        genre_name.value as value,
        max(i.updated_at)::text as updated_at
      from public.media_items i
      cross join lateral jsonb_array_elements_text(
        case
          when jsonb_typeof(i.detail->'genres') = 'array' then i.detail->'genres'
          else '[]'::jsonb
        end
      ) as genre_name(value)
      where i.surface_type = 'series'
        and coalesce(i.is_nsfw, false) = false
        and nullif(trim(genre_name.value), '') is not null
      group by genre_name.value
      order by max(i.updated_at) desc
      limit 80
    `),
    sql.unsafe<BrowseValueRow[]>(`
      with country_values as (
        select
          case
            when lower(trim(coalesce(
              i.detail->>'country',
              i.detail->>'region',
              i.detail->'country_names'->>0,
              case upper(coalesce(i.release_country, ''))
                when 'JP' then 'Japan'
                when 'CN' then 'China'
                when 'KR' then 'South Korea'
                when 'US' then 'United States'
                else ''
              end
            ))) = 'korea' then 'South Korea'
            else trim(coalesce(
              i.detail->>'country',
              i.detail->>'region',
              i.detail->'country_names'->>0,
              case upper(coalesce(i.release_country, ''))
                when 'JP' then 'Japan'
                when 'CN' then 'China'
                when 'KR' then 'South Korea'
                when 'US' then 'United States'
                else ''
              end
            ))
          end as value,
          i.updated_at
        from public.media_items i
        where i.surface_type = 'series'
          and coalesce(i.is_nsfw, false) = false
      )
      select value, max(updated_at)::text as updated_at
      from country_values
      where nullif(value, '') is not null
      group by value
      order by max(updated_at) desc
      limit 24
    `),
    sql.unsafe<BrowseValueRow[]>(`
      with year_values as (
        select
          coalesce(
            nullif(i.release_year::text, ''),
            nullif(i.detail->>'release_year', ''),
            nullif(i.detail->>'year', '')
          ) as value,
          i.updated_at
        from public.media_items i
        where i.surface_type = 'series'
          and coalesce(i.is_nsfw, false) = false
      )
      select value, max(updated_at)::text as updated_at
      from year_values
      where value ~ '^[0-9]{4}$'
      group by value
      order by value desc
      limit 40
    `),
  ]);

  return [
    ...seriesDetails.map((row) => toEntry(`/series/${row.slug}`, row.updated_at, 0.8, 'daily')),
    ...seriesWatch.map((row) => toEntry(`/series/watch/${row.slug}`, row.updated_at, 0.85, 'daily')),
    ...movieDetails.map((row) => toEntry(`/movies/${row.slug}`, row.updated_at, 0.75, 'weekly')),
    ...movieWatch.map((row) => toEntry(`/movies/watch/${row.slug}`, row.updated_at, 0.8, 'weekly')),
    ...comicDetails.map((row) => toEntry(`/comic/${row.slug}`, row.updated_at, 0.75, 'daily')),
    ...novelDetails.map((row) => toEntry(`/novel/${row.slug}`, row.updated_at, 0.7, 'daily')),
    ...drachinDetails.map((row) => toEntry(`/series/short/${row.slug}`, row.updated_at, 0.75, 'daily')),
    ...drachinEpisodes.map((row) => toEntry(`/series/short/watch/${row.slug}`, row.updated_at, 0.8, 'daily')),
    ...dramaboxDetails.map((row) => toEntry(`/series/short/dramabox/${row.slug}`, row.updated_at, 0.7, 'weekly')),
    ...seriesGenres.map((row) => toEntry(`/series/genre/${slugify(row.value)}`, row.updated_at, 0.65, 'weekly')),
    ...seriesCountries.map((row) => toEntry(`/series/country/${slugify(row.value)}`, row.updated_at, 0.65, 'weekly')),
    ...seriesYears.map((row) => toEntry(`/series/year/${row.value}`, row.updated_at, 0.65, 'weekly')),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.map(({ path, priority, changeFrequency }) =>
    toEntry(path, new Date('2026-03-31T00:00:00Z'), priority, changeFrequency),
  );

  const dynamicEntries = await resolveDynamicSitemapEntries(() =>
    rememberComicCacheValue(
      buildComicCacheKey('seo', 'sitemap', 'v2'),
      60 * 30,
      loadDynamicSitemapEntries,
    ),
  );

  return [...staticEntries, ...dynamicEntries];
}
