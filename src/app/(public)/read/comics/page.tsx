import type { Metadata } from 'next';
import { Suspense } from 'react';
import ComicPageClient, { ComicPageClientFromSearchParams } from '@/features/comics/ComicPageClient';
import { loadComicPageData } from '@/features/comics/loadComicPageData';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Baca Komik Bahasa Indonesia',
  description: 'Jelajahi manga, manhwa, dan manhua dari rak baca.',
  path: '/read/comics',
  keywords: ['read comics subtitle indonesia', 'manga subtitle indonesia', 'manhwa subtitle indonesia', 'manhua subtitle indonesia'],
});

export const dynamic = 'force-dynamic';

export default async function ReadComicsPage() {
  const { popular, newest, subtypePosters } = await loadComicPageData('all', { includeNsfw: false });

  return (
    <Suspense
      fallback={(
        <ComicPageClient
          variant="all"
          routeBase="/comics"
          initialPopular={popular}
          initialNewest={newest}
          subtypePosters={subtypePosters}
        />
      )}
    >
      <ComicPageClientFromSearchParams
        routeBase="/comics"
        initialPopular={popular}
        initialNewest={newest}
        subtypePosters={subtypePosters}
      />
    </Suspense>
  );
}
