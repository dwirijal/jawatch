import HomePageClient from './HomePageClient';
import { getHomePageData } from './loadHomePageData';

export default async function HomePage() {
  const { sections, heroItems } = await getHomePageData({ includeNsfw: false });
  return <HomePageClient heroItems={heroItems} sections={sections} />;
}
