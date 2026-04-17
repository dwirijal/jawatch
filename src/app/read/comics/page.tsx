import type { Metadata } from 'next';
import ComicPageClient from '@/app/_comics/ComicPageClient';
import { loadComicPageData } from '@/app/_comics/loadComicPageData';
import { buildMetadata } from '@/lib/seo';
import type { MangaSubtype } from '@/lib/types';

export const metadata: Metadata = buildMetadata({
  title: 'Read Comics Subtitle Indonesia',
  description: 'Browse manga, manhwa, and manhua from the reading hub.',
  path: '/read/comics',
  keywords: ['read comics subtitle indonesia', 'manga subtitle indonesia', 'manhwa subtitle indonesia', 'manhua subtitle indonesia'],
});

export const dynamic = 'force-dynamic';

type ReadComicsPageProps = {
  searchParams?: Promise<{ type?: string }>;
};

function normalizeComicVariant(value?: string): MangaSubtype | 'all' {
  switch ((value || '').trim().toLowerCase()) {
    case 'manga':
      return 'manga';
    case 'manhwa':
      return 'manhwa';
    case 'manhua':
      return 'manhua';
    default:
      return 'all';
  }
}

export default async function ReadComicsPage({ searchParams }: ReadComicsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const variant = normalizeComicVariant(params?.type);
  const { popular, newest, subtypePosters } = await loadComicPageData(variant);

  return (
    <ComicPageClient
      variant={variant}
      routeBase="/comics"
      initialPopular={popular}
      initialNewest={newest}
      subtypePosters={subtypePosters}
    />
  );
}
