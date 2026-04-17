import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import { HomePageView } from '@/components/organisms/HomePageView';
import { getHomePageData } from './loadHomePageData';
import { buildCollectionPageJsonLd, buildMetadata, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'jawatch Home',
  description: 'Temukan watch, read, dan vault surfaces untuk anime, donghua, drama Asia, film, dan komik subtitle Indonesia dalam satu homepage yang cepat untuk discovery harian.',
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

export const dynamic = 'force-dynamic';

function toHomeJsonLdUrl(item: { id: string; type: string }) {
  if (item.type === 'movie') return `/movies/${item.id}`;
  if (item.type === 'series') return `/series/${item.id}`;
  return `/comics/${item.id}`;
}

export default async function HomePage() {
  const { sections, heroItems } = await getHomePageData({ includeNsfw: false });
  return (
    <>
      <JsonLd data={buildWebsiteJsonLd()} />
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'jawatch Home',
          description: 'Homepage discovery for watch, read, and vault surfaces across anime, donghua, drama, film, dan komik subtitle Indonesia.',
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
