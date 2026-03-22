'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { getMovieHome, getMoviesByGenre, MovieCardItem } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Film } from 'lucide-react';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { ContentRow } from '@/components/molecules/ContentRow';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';

const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", 
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", 
  "Romance", "Sci-Fi", "Thriller", "War", "Western"
];

export default function MoviesPage() {
  const [popular, setPopular] = useState<MovieCardItem[]>([]);
  const [latest, setLatest] = useState<MovieCardItem[]>([]);
  const [results, setResults] = useState<MovieCardItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [popData, latestData] = await Promise.all([
          getMovieHome('popular'),
          getMovieHome('latest')
        ]);
        setPopular(popData);
        setLatest(latestData);
        incrementInterest('movie');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setActiveGenre(genre);
    try {
      const res = await getMoviesByGenre(genre.toLowerCase());
      setResults(res);
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
      results={results as any}
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
      <div className="space-y-32">
        <ContentRow title="Most Popular" subtitle="Top trending this month" viewAllHref="/movies">
          {popular.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-48">
              <MediaCard
                href={`/movies/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={`${item.year} • ${item.type.toUpperCase()}`}
                badgeText={item.rating ? `★ ${item.rating}` : undefined}
                theme="movie"
              />
            </div>
          ))}
        </ContentRow>

        <section className="space-y-12">
           <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Latest Releases</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {latest.map((item, index) => (
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
           </div>
        </section>
      </div>
    </MediaHubTemplate>
  );
}
