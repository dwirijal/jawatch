import type { Metadata } from 'next';
import { Flame } from 'lucide-react';
import { buildMovieBrowsePage } from '@/app/movies/buildMovieBrowsePage';
import { getMovieHomeSection } from '@/lib/adapters/movie';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Film Populer',
  description: 'Temukan film subtitle Indonesia yang sedang paling ramai dibuka dan paling kuat performanya di katalog.',
  path: '/movies/popular',
  keywords: ['film populer', 'movie populer', 'film trending'],
});

export default async function MoviesPopularPage() {
  const results = await getMovieHomeSection('popular', 40, { includeNsfw: false }).catch(() => []);

  return buildMovieBrowsePage({
    title: 'Movies: Popular Right Now',
    description: 'Rak film populer yang mengumpulkan judul paling ramai dan paling kuat performanya saat ini.',
    path: '/movies/popular',
    icon: Flame,
    eyebrow: 'Popular Shelf',
    results,
  });
}
