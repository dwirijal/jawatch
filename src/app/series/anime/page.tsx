import type { Metadata } from 'next';
import { Tv } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Anime Subtitle Indonesia',
  description: 'Browse anime subtitle Indonesia di dalam katalog series utama dwizzyWEEB.',
  path: '/series/anime',
});

export default async function SeriesAnimePage() {
  const results = await loadSeriesBrowsePageData('type', 'anime');

  return buildSeriesBrowsePage({
    title: 'Series: Anime',
    description: 'Katalog anime subtitle Indonesia di dalam surface series utama.',
    path: '/series/anime',
    icon: Tv,
    theme: 'anime',
    eyebrow: 'Anime Lane',
    results,
  });
}
