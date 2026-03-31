import { redirect } from 'next/navigation';
import { MediaCard } from '@/components/atoms/Card';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { getNsfwComics } from '@/lib/adapters/comic-server';
import { getNsfwMovieItems } from '@/lib/adapters/movie';
import { getNsfwSeriesItems } from '@/lib/adapters/series';
import { buildLoginUrl } from '@/lib/auth-gateway';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import { getSeriesBadgeText, getSeriesTheme, formatSeriesCardSubtitle } from '@/lib/series-presentation';

export const metadata = {
  title: 'NSFW',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NsfwPage() {
  const session = await getServerAuthStatus();
  if (!session.authenticated) {
    redirect(buildLoginUrl('/nsfw'));
  }

  const [seriesItems, movieItems, comicItems] = await Promise.all([
    getNsfwSeriesItems(24).catch(() => []),
    getNsfwMovieItems(24).catch(() => []),
    getNsfwComics(24).catch(() => []),
  ]);

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="NSFW"
        description="Adult-tagged titles from the unified catalog. Visible only when you are signed in."
        iconName="BadgeAlert"
        theme="drama"
        containerClassName="app-container-wide"
      />

      <main className="app-container-wide mt-8 space-y-10 pb-12">
        <SectionCard
          title="Series"
          subtitle="Adult-tagged episodic titles across anime, donghua, and drama."
          iconName="Clapperboard"
          mode="grid"
          gridDensity="default"
        >
          {seriesItems.length > 0 ? seriesItems.map((item) => (
            <MediaCard
              key={item.slug}
              href={`/series/${item.slug}`}
              image={item.poster}
              title={item.title}
              subtitle={formatSeriesCardSubtitle(item)}
              badgeText={getSeriesBadgeText(item.type)}
              theme={getSeriesTheme(item.type)}
            />
          )) : (
            <StateInfo title="No adult series yet" description="No NSFW-tagged series are currently available." />
          )}
        </SectionCard>

        <SectionCard
          title="Movies"
          subtitle="Adult-tagged movie titles from the canonical movie catalog."
          iconName="Film"
          mode="grid"
          gridDensity="default"
        >
          {movieItems.length > 0 ? movieItems.map((item) => (
            <MediaCard
              key={item.slug}
              href={`/movies/${item.slug}`}
              image={item.poster}
              title={item.title}
              subtitle={item.year}
              badgeText={item.rating ? `★ ${item.rating}` : 'MOVIE'}
              theme="movie"
            />
          )) : (
            <StateInfo title="No adult movies yet" description="No NSFW-tagged movies are currently available." />
          )}
        </SectionCard>

        <SectionCard
          title="Comics"
          subtitle="Adult-tagged manga, manhwa, and manhua from the comic library."
          iconName="BookOpen"
          mode="grid"
          gridDensity="default"
        >
          {comicItems.length > 0 ? comicItems.map((item) => (
            <MediaCard
              key={item.slug}
              href={`/comic/${item.slug}`}
              image={item.thumbnail || item.image}
              title={item.title}
              subtitle={item.chapter || item.time_ago || undefined}
              badgeText={item.type || 'Comic'}
              theme="manga"
            />
          )) : (
            <StateInfo title="No adult comics yet" description="No NSFW-tagged comics are currently available." />
          )}
        </SectionCard>
      </main>
    </div>
  );
}
