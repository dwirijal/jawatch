import type { Metadata } from 'next';
import NovelPageClient from './NovelPageClient';
import { getNovelGenres, getNovelHome } from '@/lib/adapters/novel';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Novel Online Indonesia',
  description: 'Temukan novel online dan chapter terbaru dengan katalog novel yang ringan untuk pembaca Indonesia.',
  path: '/novel',
});

export default async function NovelPage() {
  const [home, genres] = await Promise.all([
    getNovelHome().catch(() => ({ featured: [], latest: [] })),
    getNovelGenres().catch(() => []),
  ]);

  return <NovelPageClient initialFeatured={home.featured} initialLatest={home.latest} genres={genres} />;
}
