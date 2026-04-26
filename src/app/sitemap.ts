import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { SITE_URL } from '@/lib/site';
import { SHORTS_HUB_ENABLED } from '@/lib/shorts-paths';
import { absoluteImageUrl } from '@/lib/seo';
import { resolveDynamicSitemapEntries } from './_shared/metadata/sitemap-utils';

type SitemapEntry = MetadataRoute.Sitemap[number];
type SitemapChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;

export const revalidate = 1800;

const ENABLE_DYNAMIC_SITEMAP = process.env.ENABLE_DYNAMIC_SITEMAP === 'true';
const DYNAMIC_SITEMAP_LIMIT = 40;
const DYNAMIC_SITEMAP_TIMEOUT_MS = 2_500;

type SitemapMediaItem = {
  slug?: string | null;
  image?: string | null;
  poster?: string | null;
  thumb?: string | null;
  thumbnail?: string | null;
};

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/watch', priority: 0.95, changeFrequency: 'hourly' },
  { path: '/watch/movies', priority: 0.9, changeFrequency: 'daily' },
  { path: '/watch/series', priority: 0.9, changeFrequency: 'hourly' },
  ...(SHORTS_HUB_ENABLED ? [{ path: '/watch/shorts', priority: 0.85, changeFrequency: 'daily' as const }] : []),
  { path: '/read', priority: 0.9, changeFrequency: 'daily' },
  { path: '/read/comics', priority: 0.85, changeFrequency: 'daily' },
  { path: '/support', priority: 0.55, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.45, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/dmca', priority: 0.35, changeFrequency: 'yearly' },
] as const satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}>;

function toEntry(
  path: string,
  lastModified: string | Date,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency'],
  images?: string[],
): SitemapEntry {
  return {
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    priority,
    changeFrequency,
    images,
  };
}

function pickSitemapImage(item: SitemapMediaItem): string[] | undefined {
  const image = item.poster || item.image || item.thumb || item.thumbnail;
  const resolved = absoluteImageUrl(image);
  return resolved ? [resolved] : undefined;
}

function toMediaEntries(
  items: SitemapMediaItem[],
  prefix: '/movies' | '/series' | '/comics',
  priority: number,
  changeFrequency: SitemapChangeFrequency,
): SitemapEntry[] {
  const now = new Date();

  return items
    .filter((item): item is SitemapMediaItem & { slug: string } => Boolean(item.slug))
    .map((item) => toEntry(`${prefix}/${item.slug}`, now, priority, changeFrequency, pickSitemapImage(item)));
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false;
    }

    seen.add(entry.url);
    return true;
  });
}

async function loadDynamicEntries(): Promise<SitemapEntry[]> {
  if (!ENABLE_DYNAMIC_SITEMAP) {
    return [];
  }

  const [
    { getMovieHubData },
    { getPopularManga, getNewManga },
    { getSeriesHubData },
  ] = await Promise.all([
    import('@/lib/adapters/movie'),
    import('@/lib/adapters/comic-server'),
    import('@/lib/adapters/series'),
  ]);

  const [movieEntries, seriesEntries, comicEntries] = await Promise.all([
    resolveDynamicSitemapEntries(async () => {
      const { popular, latest } = await getMovieHubData(DYNAMIC_SITEMAP_LIMIT, { includeNsfw: false });
      return toMediaEntries([...popular, ...latest], '/movies', 0.82, 'daily');
    }, console.warn, { timeoutMs: DYNAMIC_SITEMAP_TIMEOUT_MS }),
    resolveDynamicSitemapEntries(async () => {
      const { popular, latest, dramaSpotlight } = await getSeriesHubData(DYNAMIC_SITEMAP_LIMIT, {
        includeNsfw: false,
        includeFilters: false,
      });
      return toMediaEntries([...popular, ...latest, ...dramaSpotlight], '/series', 0.82, 'daily');
    }, console.warn, { timeoutMs: DYNAMIC_SITEMAP_TIMEOUT_MS }),
    resolveDynamicSitemapEntries(async () => {
      const [popular, latest] = await Promise.all([
        getPopularManga(DYNAMIC_SITEMAP_LIMIT, { includeNsfw: false }),
        getNewManga(1, DYNAMIC_SITEMAP_LIMIT, { includeNsfw: false }),
      ]);
      return toMediaEntries([...(popular.comics || []), ...(latest.comics || [])], '/comics', 0.78, 'daily');
    }, console.warn, { timeoutMs: DYNAMIC_SITEMAP_TIMEOUT_MS }),
  ]);

  return dedupeEntries([...movieEntries, ...seriesEntries, ...comicEntries]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (ENABLE_DYNAMIC_SITEMAP) {
    await connection();
  }

  const generatedAt = new Date();
  const staticEntries = staticRoutes.map(({ path, priority, changeFrequency }) =>
    toEntry(path, generatedAt, priority, changeFrequency),
  );

  return dedupeEntries([...staticEntries, ...(await loadDynamicEntries())]);
}
