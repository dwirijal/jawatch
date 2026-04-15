import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import DrachinPageClient from '@/app/drachin/DrachinPageClient';

export const metadata: Metadata = buildMetadata({
  title: 'Watch Shorts Subtitle Indonesia',
  description: 'Jelajahi short series subtitle Indonesia dari hub watch.',
  path: '/watch/shorts',
});

export default function WatchShortsPage() {
  return <DrachinPageClient basePath="/series/short" />;
}
