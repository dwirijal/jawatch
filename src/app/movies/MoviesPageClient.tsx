'use client';

import * as React from 'react';
import { incrementInterest } from '@/lib/store';
import { Film } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MediaCard } from '@/components/atoms/Card';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { formatMovieCardMetaLine, formatMovieCardSubtitle, getMovieCardBadgeText } from '@/lib/card-presentation';
import type { GenericMediaItem, MovieCardItem } from '@/lib/types';

const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "War", "Western"
];

interface MoviesPageClientProps {
  initialPopular: MovieCardItem[];
  initialLatest: MovieCardItem[];
  initialResults?: MovieCardItem[] | null;
  activeGenre?: string | null;
}

export default function MoviesPageClient({
  initialPopular,
  initialLatest,
  initialResults = null,
  activeGenre = null,
}: MoviesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const popular = initialPopular;
  const latest = initialLatest;
  const shelfBrowseCards = React.useMemo(
    () => [
      {
        label: 'Latest',
        route: '/movies/latest',
        badge: 'NEW',
        image: latest[0]?.poster || popular[0]?.poster || '',
        subtitle: 'Open the newest release shelf',
      },
      {
        label: 'Popular',
        route: '/movies/popular',
        badge: 'HOT',
        image: popular[0]?.poster || latest[0]?.poster || '',
        subtitle: 'See the strongest performers',
      },
    ],
    [latest, popular],
  );

  React.useEffect(() => {
    incrementInterest('movie');
  }, []);

  const handleGenreClick = (genre: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('genre', genre);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <MediaHubTemplate
      title="MovieTube"
      description="Stream blockbuster movies and trending TV series in high definition."
      icon={Film}
      theme="movie"
      eyebrow="Feature Films"
      genres={MOVIE_GENRES}
      results={initialResults as GenericMediaItem[] | null}
      loading={false}
      error={null}
      activeGenre={activeGenre}
      onGenreClick={handleGenreClick}
      onClearResults={() => {
        router.push(pathname);
      }}
    >
      <StaggerEntry className="app-section-stack" delay={100}>
        <SectionCard title="Browse By Shelf" subtitle="Open focused movie lanes for the newest releases and the most popular titles." mode="rail" railVariant="default">
          {shelfBrowseCards.map((item) => (
            <MediaCard
              key={item.route}
              href={item.route}
              image={item.image}
              title={item.label}
              subtitle={item.subtitle}
              badgeText={item.badge}
              theme="movie"
            />
          ))}
        </SectionCard>

        <SectionCard title="Most popular" subtitle="Top trending this month" mode="grid" gridDensity="default" viewAllHref="/movies">
          {popular.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`popular-skeleton-${index}`} />)
            : popular.slice(0, 12).map((item, index) => (
              <MediaCard
                key={index}
                href={`/movies/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatMovieCardSubtitle(item)}
                metaLine={formatMovieCardMetaLine(item)}
                badgeText={getMovieCardBadgeText()}
                theme="movie"
              />
            ))}
        </SectionCard>

        <SavedContentSection type="movie" title="Saved Movies" />

        <SectionCard title="Latest releases" mode="grid" gridDensity="default" viewAllHref="/movies/latest">
          {latest.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-skeleton-${index}`} />)
            : latest.map((item, index) => (
              <MediaCard
                key={index}
                href={`/movies/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatMovieCardSubtitle(item)}
                metaLine={formatMovieCardMetaLine(item)}
                badgeText={getMovieCardBadgeText()}
                theme="movie"
              />
            ))}
        </SectionCard>
      </StaggerEntry>
    </MediaHubTemplate>
  );
}
