import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { buildMovieBrowsePage } from '@/app/movies/buildMovieBrowsePage';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getMovieHomeSection } from '@/lib/adapters/movie';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Film Update Terbaru',
  description: 'Lihat film subtitle Indonesia yang paling baru diperbarui di katalog movie.',
  path: '/movies/latest',
  keywords: ['film update terbaru', 'movie update terbaru', 'katalog movie terbaru'],
});

export default async function MoviesLatestPage() {
  const includeNsfw = await resolveViewerNsfwAccess();
  const results = await getMovieHomeSection('latest', 40, { includeNsfw }).catch(() => []);

  return buildMovieBrowsePage({
    title: 'Movies: Recently Updated',
    description: 'Rak khusus untuk film yang paling baru diperbarui di katalog movie.',
    path: '/movies/latest',
    icon: Sparkles,
    eyebrow: 'Updated Shelf',
    results,
  });
}
