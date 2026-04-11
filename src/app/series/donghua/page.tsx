import type { Metadata } from 'next';
import { Zap } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Donghua Subtitle Indonesia',
  description: 'Browse donghua subtitle Indonesia di dalam katalog series utama jawatch.',
  path: '/series/donghua',
});

export default async function SeriesDonghuaPage() {
  const results = await loadSeriesBrowsePageData('type', 'donghua');

  return buildSeriesBrowsePage({
    title: 'Series: Donghua',
    description: 'Katalog donghua subtitle Indonesia di dalam surface series utama.',
    path: '/series/donghua',
    icon: Zap,
    theme: 'donghua',
    results,
  });
}
