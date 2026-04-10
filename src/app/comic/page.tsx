import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype | 'all' = 'all';

export const metadata: Metadata = buildMetadata({
  title: 'Komik Manga, Manhwa, dan Manhua',
  description: 'Baca manga, manhwa, dan manhua subtitle Indonesia dalam satu hub comic yang cepat dan mudah dijelajahi.',
  path: '/comic',
  keywords: ['baca manga', 'baca manhwa', 'baca manhua', 'komik indonesia'],
});

export default async function ComicPage() {
  const { popular, newest, subtypePosters } = await loadComicPageData(VARIANT);

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Komik Manga, Manhwa, dan Manhua',
          description: 'Hub comic untuk manga, manhwa, dan manhua subtitle Indonesia.',
          path: '/comic',
          items: popular.map((item) => ({
            name: item.title,
            url: `/comic/${item.slug}`,
            image: item.thumbnail || item.image,
          })),
        })}
      />
      <ComicPageClient
        variant={VARIANT}
        routeBase="/comic"
        initialPopular={popular}
        initialNewest={newest}
        subtypePosters={subtypePosters}
      />
    </>
  );
}
