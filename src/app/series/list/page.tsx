import type { Metadata } from 'next';
import { Grid3X3 } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Daftar Series Subtitle Indonesia',
  description: 'Lihat semua judul series subtitle Indonesia dalam satu daftar browse yang ringkas.',
  path: '/series/list',
});

export default async function SeriesListPage() {
  const results = await loadSeriesBrowsePageData('list', null);

  return buildSeriesBrowsePage({
    title: 'Series List',
    description: 'Daftar semua series subtitle Indonesia dalam satu browse surface.',
    path: '/series/list',
    icon: Grid3X3,
    theme: 'drama',
    results,
  });
}
