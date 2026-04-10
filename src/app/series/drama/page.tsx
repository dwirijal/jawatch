import type { Metadata } from 'next';
import { Clapperboard } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Drama Series Subtitle Indonesia',
  description: 'Browse drama episodik subtitle Indonesia di dalam katalog series utama dwizzyWEEB.',
  path: '/series/drama',
});

export default async function SeriesDramaPage() {
  const results = await loadSeriesBrowsePageData('type', 'drama');

  return buildSeriesBrowsePage({
    title: 'Series: Drama',
    description: 'Katalog drama episodik subtitle Indonesia di dalam surface series utama.',
    path: '/series/drama',
    icon: Clapperboard,
    theme: 'drama',
    eyebrow: 'Drama Lane',
    results,
  });
}
