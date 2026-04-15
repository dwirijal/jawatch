import type { Metadata } from 'next';
import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import { buildMetadata } from '@/lib/seo';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype | 'all' = 'all';

export const metadata: Metadata = buildMetadata({
  title: 'Read Comics Subtitle Indonesia',
  description: 'Browse manga, manhwa, and manhua from the reading hub.',
  path: '/read/comics',
  keywords: ['read comics subtitle indonesia', 'manga subtitle indonesia', 'manhwa subtitle indonesia', 'manhua subtitle indonesia'],
});

export const dynamic = 'force-dynamic';

export default async function ReadComicsPage() {
  const { popular, newest, subtypePosters } = await loadComicPageData(VARIANT);

  return (
    <ComicPageClient
      variant={VARIANT}
      routeBase="/comic"
      initialPopular={popular}
      initialNewest={newest}
      subtypePosters={subtypePosters}
    />
  );
}
