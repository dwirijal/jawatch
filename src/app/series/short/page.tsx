import type { Metadata } from 'next';
import DrachinPageClient from '../../drachin/DrachinPageClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Short Series Subtitle Indonesia',
  description: 'Jelajahi short series subtitle Indonesia di dalam domain series dengan playback vertical yang cepat dan ringan.',
  path: '/series/short',
});

export default function ShortSeriesPage() {
  return <DrachinPageClient basePath="/series/short" />;
}
