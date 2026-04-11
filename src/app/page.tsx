import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import { HomePageView } from '@/components/organisms/HomePageView';
import { getHomePageData } from './loadHomePageData';
import { buildCollectionPageJsonLd, buildMetadata, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Anime, Donghua, Drama, Film, Komik, dan Novel',
  description: 'Temukan anime, donghua, drama Asia, film, komik, dan novel subtitle Indonesia dalam satu homepage yang cepat untuk discovery harian.',
  path: '/',
  keywords: [
    'nonton anime subtitle indonesia',
    'donghua subtitle indonesia',
    'drama asia subtitle indonesia',
    'film subtitle indonesia',
    'komik manga manhwa manhua',
    'novel online indonesia',
  ],
});

export default async function HomePage() {
  const { sections, heroItems } = await getHomePageData({ includeNsfw: false });
  return (
    <>
      <JsonLd data={buildWebsiteJsonLd()} />
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'jawatch Homepage',
          description: 'Homepage discovery anime, donghua, drama, film, komik, dan novel subtitle Indonesia.',
          path: '/',
          items: heroItems.map((item) => ({
            name: item.title,
            url: item.type === 'movie' ? `/movies/${item.id}` : item.type === 'series' ? `/series/${item.id}` : `/${item.type}/${item.id}`,
            image: item.image || item.banner,
          })),
        })}
      />
      <HomePageView heroItems={heroItems} sections={sections} />
    </>
  );
}
