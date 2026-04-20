import type { Metadata } from 'next';
import { connection } from 'next/server';
import { JsonLd } from '@/components/atoms/JsonLd';
import { HomePageView } from '@/components/organisms/HomePageView';
import { getHomePageData } from '@/features/home/server/loadHomePageData';
import { buildCollectionPageJsonLd, buildMetadata, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton dan Baca Subtitle Indonesia',
  description: 'Temukan anime, donghua, drama Asia, film subtitle Indonesia, dan komik bahasa Indonesia dalam satu katalog jawatch yang cepat.',
  path: '/',
  keywords: [
    'watch subtitle indonesia',
    'read subtitle indonesia',
    'vault jawatch',
    'nonton anime subtitle indonesia',
    'donghua subtitle indonesia',
    'drama asia subtitle indonesia',
    'film subtitle indonesia',
    'komik manga manhwa manhua',
    'komik subtitle indonesia',
  ],
});

export const revalidate = 300;

function toHomeJsonLdUrl(item: { id: string; type: string }) {
  if (item.type === 'movie') return `/movies/${item.id}`;
  if (item.type === 'series') return `/series/${item.id}`;
  return `/comics/${item.id}`;
}

export default async function HomePage() {
  await connection();
  const { sections, heroItems } = await getHomePageData({ includeNsfw: false });
  return (
    <>
      <JsonLd data={buildWebsiteJsonLd()} />
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Nonton dan Baca Subtitle Indonesia',
          description: 'Katalog jawatch untuk anime, donghua, drama, film, dan komik bahasa Indonesia.',
          path: '/',
          items: heroItems.map((item) => ({
            name: item.title,
            url: toHomeJsonLdUrl(item),
            image: item.image || item.banner,
          })),
        })}
      />
      <HomePageView heroItems={heroItems} sections={sections} />
    </>
  );
}
