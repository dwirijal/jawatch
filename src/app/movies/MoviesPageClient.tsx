'use client';

import * as React from 'react';
import Image from 'next/image';
import { CalendarDays, Flame, Info, Play, SlidersHorizontal, Star } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { DeferredAdSection } from '@/components/organisms/DeferredAdSection';
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

  const featuredGenres = featuredMovie?.genres
    ? featuredMovie.genres.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <main className="app-shell" data-theme="movie" data-view-mode="compact">
      <section className="relative isolate min-h-[18rem] overflow-hidden border-b border-white/10 bg-black md:min-h-[32rem]">
        {featuredMovie ? (
          <Image
            src={featuredMovie.poster || '/placeholder-poster.jpg'}
            alt={featuredMovie.title}
            fill
            priority
            className="object-cover opacity-55"
            sizes="100vw"
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

        <div className="app-container-wide relative z-10 flex min-h-[18rem] items-end pb-7 pt-24 md:min-h-[32rem] md:pb-9">
          <div className="max-w-3xl space-y-4 rounded-[var(--radius-2xl)] border border-white/10 bg-black/25 p-4 backdrop-blur-md md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="movie" className="w-fit">Featured Movie</Badge>
              <Badge variant="outline">Movie Desk</Badge>
              {activeGenre ? <Badge variant="outline">{activeGenre}</Badge> : null}
            </div>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-[0.01em] text-white sm:text-4xl md:text-5xl">
                {featuredMovie?.title || 'Movies'}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-300 md:text-base">
                {[
                  featuredMovie?.year,
                  featuredMovie?.rating && featuredMovie.rating !== 'N/A' ? `Rating ${featuredMovie.rating}` : null,
                  featuredGenres.join(', '),
                ].filter(Boolean).join(' • ') || 'Movie picks ready for the next watch session.'}
              </p>
            </div>
            {featuredGenres.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {featuredGenres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-200"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
            {featuredMovie ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="movie" className="whitespace-nowrap" asChild>
                  <Link href={`/movies/${featuredMovie.slug}`}>
                    <Play className="h-4 w-4 fill-current" /> Watch Now
                  </Link>
                </Button>
                <Button variant="outline" className="whitespace-nowrap" asChild>
                  <Link href={`/movies/${featuredMovie.slug}`}>
                    <Info className="h-4 w-4" /> Details
                  </Link>
                </Button>
                <BookmarkButton
                  theme="movie"
                  className="whitespace-nowrap"
                  saveLabel="Add to List"
                  item={{
                    id: featuredMovie.slug,
                    type: 'movie',
                    title: featuredMovie.title,
                    image: featuredMovie.poster,
                    timestamp: 0,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="app-container-wide space-y-8 pb-12 pt-5 md:space-y-10 md:pt-7">
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

        <div className="hidden md:block">
          <DeferredAdSection />
        </div>

        <StaggerEntry className="app-section-stack" delay={100}>
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

          <ContinueWatching type="movie" title="Continue Watching Movies" />

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

        <SavedContentSection type="movie" title="Saved Movies" />

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
      </div>
    </main>
  );
}
