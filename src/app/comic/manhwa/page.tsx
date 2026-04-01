import type { Metadata } from 'next';
import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import { buildMetadata } from '@/lib/seo';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype = 'manhwa';

export const metadata: Metadata = buildMetadata({
  title: 'Manhwa Subtitle Indonesia',
  description: 'Browse manhwa subtitle Indonesia di dalam hub comic dwizzyWEEB.',
  path: '/comic/manhwa',
});

export default async function ComicManhwaPage() {
  const { popular, newest } = await loadComicPageData(VARIANT);

  return (
    <ComicPageClient
      variant={VARIANT}
      routeBase="/comic"
      initialPopular={popular}
      initialNewest={newest}
    />
  );
}
