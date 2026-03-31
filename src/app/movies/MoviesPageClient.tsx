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
        <SectionCard title="Most popular" subtitle="Top trending this month" mode="grid" gridDensity="default" viewAllHref="/movies">
          {popular.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`popular-skeleton-${index}`} />)
            : popular.slice(0, 12).map((item, index) => (
              <MediaCard
                key={index}
                href={`/movies/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={`${item.year} • ${item.type.toUpperCase()}`}
                badgeText={item.rating ? `★ ${item.rating}` : undefined}
                theme="movie"
              />
            ))}
        </SectionCard>

        <SavedContentSection type="movie" title="Saved Movies" />

        <SectionCard title="Latest releases" mode="grid" gridDensity="default">
          {latest.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-skeleton-${index}`} />)
            : latest.map((item, index) => (
              <MediaCard
                key={index}
                href={`/movies/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={item.year}
                badgeText={item.type}
                theme="movie"
              />
            ))}
        </SectionCard>
      </StaggerEntry>
    </MediaHubTemplate>
  );
}
