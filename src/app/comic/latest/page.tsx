import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { buildComicBrowsePage } from '@/app/comic/buildComicBrowsePage';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getNewManga } from '@/lib/adapters/comic-server';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Komik Update Terbaru',
  description: 'Judul comic yang paling baru diperbarui dari manga, manhwa, dan manhua.',
  path: '/comic/latest',
  keywords: ['komik update terbaru', 'manga update terbaru', 'manhwa update terbaru', 'manhua update terbaru'],
});

export default async function ComicLatestPage() {
  const includeNsfw = await resolveViewerNsfwAccess();
  const latest = await getNewManga(1, 40, { includeNsfw }).catch(() => ({ comics: [] }));

  return buildComicBrowsePage({
    title: 'Comic: Recently Updated',
    description: 'Pantau judul comic yang paling baru diperbarui tanpa harus masuk ke tiap subtype satu per satu.',
    path: '/comic/latest',
    icon: Sparkles,
    eyebrow: 'Updated Shelf',
    results: latest.comics || [],
  });
}
