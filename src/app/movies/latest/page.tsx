import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { buildMovieBrowsePage } from '@/app/movies/buildMovieBrowsePage';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getMovieHomeSection } from '@/lib/adapters/movie';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Film Terbaru',
  description: 'Lihat film subtitle Indonesia yang paling baru masuk katalog dan paling cepat diperbarui.',
  path: '/movies/latest',
  keywords: ['film terbaru', 'movie terbaru', 'rilis film terbaru'],
});

export default async function MoviesLatestPage() {
  const includeNsfw = await resolveViewerNsfwAccess();
  const results = await getMovieHomeSection('latest', 40, { includeNsfw }).catch(() => []);

  return buildMovieBrowsePage({
    title: 'Movies: Latest Releases',
    description: 'Rak khusus untuk film-film terbaru yang baru masuk atau baru diperbarui di katalog movie.',
    path: '/movies/latest',
    icon: Sparkles,
    eyebrow: 'Latest Shelf',
    results,
  });
}
