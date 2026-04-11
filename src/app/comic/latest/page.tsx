import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { buildComicBrowsePage } from '@/app/comic/buildComicBrowsePage';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getNewManga } from '@/lib/adapters/comic-server';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Komik Terbaru',
  description: 'Rilis chapter comic terbaru dari manga, manhwa, dan manhua di satu rak yang selalu diperbarui.',
  path: '/comic/latest',
  keywords: ['komik terbaru', 'chapter terbaru', 'manga terbaru', 'manhwa terbaru', 'manhua terbaru'],
});

export default async function ComicLatestPage() {
  const includeNsfw = await resolveViewerNsfwAccess();
  const latest = await getNewManga(1, 40, { includeNsfw }).catch(() => ({ comics: [] }));

  return buildComicBrowsePage({
    title: 'Comic: Latest Releases',
    description: 'Pantau chapter paling baru dari seluruh lane comic tanpa harus masuk ke tiap subtype satu per satu.',
    path: '/comic/latest',
    icon: Sparkles,
    eyebrow: 'Latest Shelf',
    results: latest.comics || [],
  });
}
