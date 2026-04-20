import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import ShortsHubClient from '@/features/shorts/DrachinPageClient';
import { SHORTS_HUB_ENABLED, SHORTS_HUB_HREF } from '@/lib/shorts-paths';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Shorts Subtitle Indonesia',
  description: 'Jelajahi short series subtitle Indonesia dari rak nonton.',
  path: '/watch/shorts',
});

export default function WatchShortsPage() {
  if (!SHORTS_HUB_ENABLED) {
    redirect(SHORTS_HUB_HREF);
  }

  return <ShortsHubClient />;
}
