import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { buildComicBrowsePage } from '@/app/comic/buildComicBrowsePage';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getOngoingManga } from '@/lib/adapters/comic-server';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Komik Ongoing',
  description: 'Baca manga, manhwa, dan manhua ongoing subtitle Indonesia yang masih terus berlanjut.',
  path: '/comic/ongoing',
  keywords: ['komik ongoing', 'manga ongoing', 'manhwa ongoing', 'manhua ongoing'],
});

export default async function ComicOngoingPage() {
  const includeNsfw = await resolveViewerNsfwAccess();
  const results = await getOngoingManga(40, { includeNsfw }).catch(() => ({ comics: [] }));

  return buildComicBrowsePage({
    title: 'Comic: Ongoing',
    description: 'Rak comic ongoing untuk judul manga, manhwa, dan manhua yang masih terus update chapter.',
    path: '/comic/ongoing',
    icon: Activity,
    eyebrow: 'Ongoing Shelf',
    results: results.comics || [],
  });
}
