import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/watch', priority: 0.95, changeFrequency: 'hourly' },
  { path: '/watch/movies', priority: 0.9, changeFrequency: 'daily' },
  { path: '/watch/series', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/watch/shorts', priority: 0.85, changeFrequency: 'daily' },
  { path: '/read', priority: 0.9, changeFrequency: 'daily' },
  { path: '/read/comics', priority: 0.85, changeFrequency: 'daily' },
] as const satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}>;

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

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map(({ path, priority, changeFrequency }) =>
    toEntry(path, new Date('2026-03-31T00:00:00Z'), priority, changeFrequency),
  );
}
