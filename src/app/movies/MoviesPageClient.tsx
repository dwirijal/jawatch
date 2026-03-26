'use client';

import * as React from 'react';
import { incrementInterest } from '@/lib/store';
import { MovieCardItem, GenericMediaItem } from '@/lib/api';
import { Film } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';

const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "War", "Western"
];

interface MoviesPageClientProps {
  initialPopular: MovieCardItem[];
  initialLatest: MovieCardItem[];
}

export default function MoviesPageClient({ initialPopular, initialLatest }: MoviesPageClientProps) {
  const popular = initialPopular;
  const latest = initialLatest;
  const [results, setResults] = React.useState<MovieCardItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null);

  React.useEffect(() => {
    incrementInterest('movie');
  }, []);

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setActiveGenre(genre);
    try {
      const response = await fetch(`/api/movies/genre?genre=${encodeURIComponent(genre)}&limit=24`);
      if (!response.ok) {
        throw new Error(`Movie genre request failed with status ${response.status}`);
      }
      const data = (await response.json()) as MovieCardItem[];
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MediaHubTemplate
      title="MovieTube"
      description="Stream blockbuster movies and trending TV series in high definition."
      icon={Film}
      theme="movie"
      genres={MOVIE_GENRES}
      results={results as GenericMediaItem[] | null}
      loading={loading}
      error={null}
      activeGenre={activeGenre}
      onGenreClick={handleGenreClick}
      onClearResults={() => {
        setResults(null);
        setActiveGenre(null);
      }}
      extraHeaderActions={<SurpriseButton type="movie" theme="movie" />}
    >
      <div className="app-section-stack">
        <SectionCard title="Most popular" subtitle="Top trending this month" mode="grid" viewAllHref="/movies">
          {popular.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`popular-skeleton-${index}`} />)
            : popular.slice(0, 12).map((item, index) => (
              <Card
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

        <SectionCard title="Latest releases" mode="grid">
          {latest.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-skeleton-${index}`} />)
            : latest.map((item, index) => (
              <Card
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
      </div>
    </MediaHubTemplate>
  );
}
