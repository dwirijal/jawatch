import type { Metadata } from 'next';
import { Flame } from 'lucide-react';
import { buildComicBrowsePage } from '@/app/comic/buildComicBrowsePage';
import { getPopularManga } from '@/lib/adapters/comic-server';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Komik Populer',
  description: 'Lihat judul comic paling ramai dibaca dari manga, manhwa, dan manhua di hub dwizzyWEEB.',
  path: '/comic/popular',
  keywords: ['komik populer', 'manga populer', 'manhwa populer', 'manhua populer'],
});

export default async function ComicPopularPage() {
  const popular = await getPopularManga(40, { includeNsfw: false }).catch(() => ({ comics: [] }));

  return buildComicBrowsePage({
    title: 'Comic: Popular Right Now',
    description: 'Rak comic terpopuler yang menggabungkan manga, manhwa, dan manhua berdasarkan minat baca terbaru.',
    path: '/comic/popular',
    icon: Flame,
    eyebrow: 'Popular Shelf',
    results: popular.comics || [],
  });
}
