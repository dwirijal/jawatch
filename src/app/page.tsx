import HomePageClient from './HomePageClient';
import { getHomePageData } from './loadHomePageData';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export default async function HomePage() {
  const session = await getServerAuthStatus();
  const { sections, heroItems } = await getHomePageData({ includeNsfw: session.authenticated });
  return <HomePageClient heroItems={heroItems} sections={sections} />;
}
