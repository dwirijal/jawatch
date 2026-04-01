import type { Metadata } from 'next';
import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import { buildMetadata } from '@/lib/seo';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype = 'manga';

export const metadata: Metadata = buildMetadata({
  title: 'Manga Subtitle Indonesia',
  description: 'Browse manga subtitle Indonesia di dalam hub comic dwizzyWEEB.',
  path: '/comic/manga',
});

export default async function ComicMangaPage() {
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
