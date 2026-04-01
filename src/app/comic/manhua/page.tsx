import type { Metadata } from 'next';
import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import { buildMetadata } from '@/lib/seo';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype = 'manhua';

export const metadata: Metadata = buildMetadata({
  title: 'Manhua Subtitle Indonesia',
  description: 'Browse manhua subtitle Indonesia di dalam hub comic dwizzyWEEB.',
  path: '/comic/manhua',
});

export default async function ComicManhuaPage() {
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
