'use client';

import * as React from 'react';
import { CalendarDays, Clapperboard, Flame, Info, Play, SlidersHorizontal, Star } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { MediaHubTemplate, type MediaHubHero } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { formatMovieCardMetaLine, formatMovieCardSubtitle, getMovieCardBadgeText } from '@/lib/card-presentation';
import { incrementInterest } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { MovieCardItem } from '@/lib/types';
import {
  buildMovieGenreRows,
  getFeaturedMovie,
  normalizeMovieSortMode,
  parseMovieRating,
  sortMovieCards,
  uniqueMovieCards,
  type MovieSortMode,
} from './movie-browse-utils';

const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "War", "Western"
];
const PRIMARY_GENRE_ROWS = ['Action', 'Horror', 'Comedy', 'Sci-Fi', 'Thriller'];
const SORT_OPTIONS: Array<{ label: string; value: MovieSortMode }> = [
  { label: 'Popular', value: 'popular' },
  { label: 'Updated', value: 'updated' },
  { label: 'Rating', value: 'rating' },
  { label: 'A-Z', value: 'az' },
];

interface MoviesPageClientProps {
  initialPopular: MovieCardItem[];
  initialLatest: MovieCardItem[];
  initialResults?: MovieCardItem[] | null;
  activeGenre?: string | null;
  activeSort?: string | null;
}

function MovieCardList({ items, skeletonKey, limit = 12 }: { items: MovieCardItem[]; skeletonKey: string; limit?: number }) {
  if (items.length === 0) {
    return Array.from({ length: limit }).map((_, index) => <SkeletonCard key={`${skeletonKey}-skeleton-${index}`} />);
  }

  return items.slice(0, limit).map((item) => (
    <MediaCard
      key={item.slug}
      href={`/movies/${item.slug}`}
      image={item.poster}
      title={item.title}
      subtitle={formatMovieCardSubtitle(item)}
      metaLine={formatMovieCardMetaLine(item)}
      badgeText={getMovieCardBadgeText()}
      theme="movie"
    />
  ));
}

export default function MoviesPageClient({
  initialPopular,
  initialLatest,
  initialResults = null,
  activeGenre = null,
  activeSort = null,
}: MoviesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSortMode = normalizeMovieSortMode(activeSort);
  const featuredMovie = React.useMemo(() => getFeaturedMovie(initialPopular, initialLatest), [initialPopular, initialLatest]);
  const combinedMovies = React.useMemo(() => uniqueMovieCards([...initialPopular, ...initialLatest]), [initialPopular, initialLatest]);
  const filteredResults = React.useMemo(
    () => initialResults ? sortMovieCards(initialResults, activeSortMode) : null,
    [activeSortMode, initialResults],
  );
  const topRated = React.useMemo(
    () => sortMovieCards(combinedMovies.filter((item) => parseMovieRating(item.rating) > 0), 'rating').slice(0, 12),
    [combinedMovies],
  );
  const genreRows = React.useMemo(() => buildMovieGenreRows(combinedMovies, PRIMARY_GENRE_ROWS, 12), [combinedMovies]);
  const shelfBrowseCards = React.useMemo(() => [
    {
      label: 'Updated',
      route: '/watch/movies#latest',
      badge: 'NEW',
      image: initialLatest[0]?.poster || initialPopular[0]?.poster || '',
      subtitle: 'Fresh catalog movement',
    },
    {
      label: 'Popular',
      route: '/watch/movies#popular',
      badge: 'HOT',
      image: initialPopular[0]?.poster || initialLatest[0]?.poster || '',
      subtitle: 'Titles with the strongest pull',
    },
  ], [initialLatest, initialPopular]);

  React.useEffect(() => {
    incrementInterest('movie');
  }, []);

  const buildMoviesHref = React.useCallback((nextGenre: string | null, nextSort: MovieSortMode) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextGenre) {
      params.set('genre', nextGenre);
    } else {
      params.delete('genre');
    }

    if (nextSort === 'popular') {
      params.delete('sort');
    } else {
      params.set('sort', nextSort);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  const handleGenreClick = React.useCallback((genre: string | null) => {
    router.push(buildMoviesHref(genre, activeSortMode));
  }, [activeSortMode, buildMoviesHref, router]);

  const handleSortChange = React.useCallback((sortMode: MovieSortMode) => {
    router.push(buildMoviesHref(activeGenre, sortMode));
  }, [activeGenre, buildMoviesHref, router]);

  const featuredGenres = React.useMemo(
    () => (featuredMovie?.genres
      ? featuredMovie.genres.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 3)
      : []),
    [featuredMovie],
  );
  const heroMeta = [
    featuredMovie?.year,
    featuredMovie?.rating && featuredMovie.rating !== 'N/A' ? `Rating ${featuredMovie.rating}` : null,
    featuredMovie?.status,
  ].filter(Boolean).join(' • ');
  const movieHero = React.useMemo<MediaHubHero>(() => ({
    title: featuredMovie?.title || 'Movie Hub',
    description: activeGenre
      ? `Feature films from the ${activeGenre} shelf land here first, followed by your personal lane and the full movie catalog rhythm.`
      : 'Feature films with fresh catalog movement, clearer shelf scanning, and direct handoff into the movie library below.',
    label: activeGenre ? `${activeGenre} spotlight` : 'Featured movie',
    meta: heroMeta || 'Feature film spotlight',
    image: featuredMovie?.poster || initialLatest[0]?.poster || initialPopular[0]?.poster || '',
    imageAlt: featuredMovie?.title || 'Featured movie poster',
    badges: featuredGenres,
    actions: featuredMovie ? (
      <>
        <Button variant="movie" className="whitespace-nowrap" asChild>
          <Link href={`/movies/${featuredMovie.slug}`}>
            <Play className="h-4 w-4 fill-current" /> Watch Now
          </Link>
        </Button>
        <Button variant="outline" className="whitespace-nowrap border-white/14 bg-black/20 text-white hover:bg-white/10 hover:text-white" asChild>
          <Link href={`/movies/${featuredMovie.slug}`}>
            <Info className="h-4 w-4" /> Details
          </Link>
        </Button>
        <BookmarkButton
          theme="movie"
          className="whitespace-nowrap border-white/14 bg-black/24 text-white hover:bg-white/12"
          saveLabel="Add to List"
          item={{
            id: featuredMovie.slug,
            type: 'movie',
            title: featuredMovie.title,
            image: featuredMovie.poster,
            timestamp: 0,
          }}
        />
      </>
    ) : (
      <Button variant="movie" className="whitespace-nowrap" asChild>
        <Link href="/watch/movies#popular">
          <Play className="h-4 w-4 fill-current" /> Browse Movies
        </Link>
      </Button>
    ),
  }), [activeGenre, featuredGenres, featuredMovie, heroMeta, initialLatest, initialPopular]);

  return (
    <MediaHubTemplate
      title="Movie Hub"
      description="Feature films with direct access to recent catalog movement and calmer shelf scanning."
      icon={Clapperboard}
      theme="movie"
      eyebrow="Movie Desk"
      results={null}
      loading={false}
      error={null}
      hero={movieHero}
      personalSection={(
        <>
          <ContinueWatching type="movie" title="Continue Watching Movies" hideWhenUnavailable />
          <SavedContentSection type="movie" title="Saved Movies" hideWhenUnavailable />
        </>
      )}
    >
      <StaggerEntry className="contents" delay={100}>
        {filteredResults ? (
          <SectionCard
            title={activeGenre ? `Genre: ${activeGenre}` : 'Movie Results'}
            subtitle={`Sorted by ${SORT_OPTIONS.find((option) => option.value === activeSortMode)?.label ?? 'Popular'}`}
            mode="grid"
            gridDensity="default"
            viewAllHref={buildMoviesHref(null, 'popular')}
          >
            <MovieCardList items={filteredResults} skeletonKey="filtered" limit={24} />
          </SectionCard>
        ) : null}

        <section className="surface-panel relative overflow-hidden p-4 md:p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--theme-movie-surface),transparent_74%)]" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Movie browse</p>
                <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-white md:text-[1.85rem]">
                  Filter shelves here, then use navbar search for exact titles.
                </h2>
              </div>
              <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500 md:flex">
                <SlidersHorizontal className="h-4 w-4" />
                Browse
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                variant={activeGenre ? 'outline' : 'movie'}
                size="sm"
                onClick={() => handleGenreClick(null)}
                className="shrink-0"
              >
                All
              </Button>
              {MOVIE_GENRES.slice(0, 12).map((genre) => (
                <Button
                  key={genre}
                  type="button"
                  variant={activeGenre === genre ? 'movie' : 'outline'}
                  size="sm"
                  onClick={() => handleGenreClick(activeGenre === genre ? null : genre)}
                  className="shrink-0"
                >
                  {genre}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {SORT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={activeSortMode === option.value ? 'movie' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange(option.value)}
                  className="shrink-0"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <SectionCard title="Browse By Shelf" subtitle="Fast lanes for recent movement and high-demand titles." mode="rail" railVariant="compact">
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

        <SectionCard id="popular" title="Popular Now" subtitle="Top trending this month" icon={Flame} mode="grid" gridDensity="default" viewAllHref="/watch/movies#popular">
          <MovieCardList items={initialPopular} skeletonKey="popular" />
        </SectionCard>

        <SectionCard id="latest" title="Recently Updated" subtitle="Fresh catalog changes" icon={CalendarDays} mode="grid" gridDensity="default" viewAllHref="/watch/movies#latest">
          <MovieCardList items={initialLatest} skeletonKey="latest" />
        </SectionCard>

        {topRated.length > 0 ? (
          <SectionCard title="Top Rated" subtitle="Highest scored titles in the current movie shelf" icon={Star} mode="grid" gridDensity="default">
            <MovieCardList items={topRated} skeletonKey="top-rated" />
          </SectionCard>
        ) : null}

        {genreRows.map((row) => (
          <SectionCard
            key={row.genre}
            title={row.genre}
            subtitle="Quick picks by genre"
            mode="rail"
            railVariant="default"
            viewAllHref={buildMoviesHref(row.genre, 'popular')}
          >
            {row.items.map((item) => (
              <MediaCard
                key={item.slug}
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
        ))}

        <section className="border-t border-white/10 pt-6">
          <div className="flex flex-wrap gap-2 text-sm">
            {['Action', 'Comedy', 'Horror', 'Sci-Fi', 'Thriller', 'Drama', 'Romance', 'Animation'].map((genre) => (
              <Link
                key={genre}
                href={buildMoviesHref(genre, 'popular')}
                className={cn(
                  'rounded-[var(--radius-sm)] border border-white/10 px-3 py-2 text-zinc-400 transition-colors hover:border-white/25 hover:text-white',
                  activeGenre === genre && 'border-white/25 text-white',
                )}
              >
                {genre}
              </Link>
            ))}
          </div>
        </section>
      </StaggerEntry>
    </MediaHubTemplate>
  );
}
