import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Series Ongoing Subtitle Indonesia',
  description: 'Browse series ongoing subtitle Indonesia untuk anime, donghua, dan drama yang masih aktif berjalan.',
  path: '/series/ongoing',
  keywords: ['series ongoing', 'anime ongoing', 'drama ongoing', 'donghua ongoing'],
});

export default async function SeriesOngoingPage() {
  const results = await loadSeriesBrowsePageData('status', 'ongoing');

  return buildSeriesBrowsePage({
    title: 'Series: Ongoing',
    description: 'Katalog series yang masih ongoing, termasuk anime, donghua, dan drama yang masih aktif rilis.',
    path: '/series/ongoing',
    icon: Activity,
    theme: 'drama',
    eyebrow: 'Ongoing Lane',
    results,
  });
}
