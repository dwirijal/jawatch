import NovelPageClient from './NovelPageClient';
import { getNovelGenres, getNovelHome } from '@/lib/adapters/novel';

export default async function NovelPage() {
  const [home, genres] = await Promise.all([
    getNovelHome().catch(() => ({ featured: [], latest: [] })),
    getNovelGenres().catch(() => []),
  ]);

  return <NovelPageClient initialFeatured={home.featured} initialLatest={home.latest} genres={genres} />;
}
