'use client';

import * as React from 'react';
import { CalendarDays, Clapperboard, Flame, Info, Play, SlidersHorizontal, Star } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { MediaHubTemplate, type MediaHubHero } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { formatMovieCardMetaLine, formatMovieCardSubtitle, getMovieCardBadgeText } from '@/lib/card-presentation';
import { WATCH_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
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
  { label: 'Paling ramai', value: 'popular' },
  { label: 'Baru update', value: 'updated' },
  { label: 'Rating', value: 'rating' },
  { label: 'A-Z', value: 'az' },
];
const MOVIE_HUB_ASSETS = {
  hero: '/Movie.png',
  latest: '/New%20Release.png',
  popular: '/Popular.png',
} as const;

interface MoviesPageClientProps {
  initialPopular: MovieCardItem[];
  initialLatest: MovieCardItem[];
  initialResults?: MovieCardItem[] | null;
  activeGenre?: string | null;
  activeSort?: string | null;
}

function normalizeMovieGenreParam(value?: string | null): string | null {
  const normalized = (value || '').trim().slice(0, 64);
  return normalized || null;
}

function normalizeMovieSortParam(value?: string | null): string | null {
  const normalized = (value || '').trim().slice(0, 24);
  return normalized || null;
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
  const activeSortMode = normalizeMovieSortMode(activeSort);
  const initialResultsGenreRef = React.useRef(activeGenre);
  const [genreResults, setGenreResults] = React.useState<MovieCardItem[] | null>(initialResults);
  const [genreResultsFor, setGenreResultsFor] = React.useState<string | null>(activeGenre);
  const featuredMovie = React.useMemo(() => getFeaturedMovie(initialPopular, initialLatest), [initialPopular, initialLatest]);
  const combinedMovies = React.useMemo(() => uniqueMovieCards([...initialPopular, ...initialLatest]), [initialPopular, initialLatest]);
  const filteredResults = React.useMemo(
    () => activeGenre ? sortMovieCards(genreResultsFor === activeGenre ? (genreResults ?? []) : [], activeSortMode) : null,
    [activeGenre, activeSortMode, genreResults, genreResultsFor],
  );
  const topRated = React.useMemo(
    () => sortMovieCards(combinedMovies.filter((item) => parseMovieRating(item.rating) > 0), 'rating').slice(0, 12),
    [combinedMovies],
  );
  const genreRows = React.useMemo(() => buildMovieGenreRows(combinedMovies, PRIMARY_GENRE_ROWS, 12), [combinedMovies]);
  const watchPrimarySegments = React.useMemo(
    () => WATCH_PRIMARY_SEGMENTS.map((segment) => ({
      href: segment.href,
      label: segment.label,
      title: segment.description,
      active: segment.href === '/watch/movies',
    })),
    [],
  );
  const shelfBrowseCards = React.useMemo(() => [
    {
      label: 'Baru update',
      route: '/watch/movies#latest',
      badge: 'NEW',
      image: MOVIE_HUB_ASSETS.latest,
      subtitle: 'Film yang baru masuk atau baru dirapikan.',
    },
    {
      label: 'Lagi ramai',
      route: '/watch/movies#popular',
      badge: 'HOT',
      image: MOVIE_HUB_ASSETS.popular,
      subtitle: 'Film yang paling sering dibuka penonton.',
    },
  ], []);

  React.useEffect(() => {
    incrementInterest('movie');
  }, []);

  React.useEffect(() => {
    if (!activeGenre) {
      setGenreResults(null);
      setGenreResultsFor(null);
      return;
    }

    if (initialResults && initialResultsGenreRef.current === activeGenre) {
      setGenreResults(initialResults);
      setGenreResultsFor(activeGenre);
      return;
    }

    const controller = new AbortController();
    setGenreResults(null);
    setGenreResultsFor(activeGenre);

    fetch(`/api/movies/genre?genre=${encodeURIComponent(activeGenre)}&limit=24`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((results: MovieCardItem[]) => {
        if (!controller.signal.aborted) {
          setGenreResults(Array.isArray(results) ? results : []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setGenreResults([]);
        }
      });

    return () => controller.abort();
  }, [activeGenre, initialResults]);

  const buildMoviesHref = React.useCallback((nextGenre: string | null, nextSort: MovieSortMode) => {
    const params = new URLSearchParams();

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
  }, [pathname]);

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
    title: featuredMovie?.title || 'Film pilihan',
    description: activeGenre
      ? `Film genre ${activeGenre} yang bisa kamu cek dulu sebelum pilih tontonan.`
      : 'Temukan film populer, update terbaru, dan pilihan yang gampang dipindai.',
    label: activeGenre ? `Sorotan ${activeGenre}` : 'Pilihan film',
    meta: heroMeta || 'Film buat ditonton',
    image: featuredMovie?.backdrop || featuredMovie?.background || featuredMovie?.poster || initialLatest[0]?.backdrop || initialLatest[0]?.background || initialLatest[0]?.poster || initialPopular[0]?.backdrop || initialPopular[0]?.background || initialPopular[0]?.poster || MOVIE_HUB_ASSETS.hero,
    imageAlt: featuredMovie?.title || 'Poster film pilihan',
    logo: featuredMovie?.logo,
    logoAlt: featuredMovie?.title || 'Logo film pilihan',
    useLogo: false,
    badges: featuredGenres,
    actions: featuredMovie ? (
      <>
        <Button
          variant="movie"
          className="h-11 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_26px_68px_-30px_rgba(209,168,111,0.72)] md:h-12 md:px-5 md:text-sm"
          asChild
        >
          <Link href={`/movies/${featuredMovie.slug}`}>
            <Play className="h-4 w-4 fill-current" /> Nonton sekarang
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-11 whitespace-nowrap rounded-full border-white/16 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-white/18 hover:text-white md:h-12 md:px-5 md:text-sm"
          asChild
        >
          <Link href={`/movies/${featuredMovie.slug}`}>
            <Info className="h-4 w-4" /> Lihat detail
          </Link>
        </Button>
      </>
    ) : (
      <Button
        variant="movie"
        className="h-11 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_26px_68px_-30px_rgba(209,168,111,0.72)] md:h-12 md:px-5 md:text-sm"
        asChild
      >
        <Link href="/watch/movies#popular">
          <Play className="h-4 w-4 fill-current" /> Cari film
        </Link>
      </Button>
    ),
  }), [activeGenre, featuredGenres, featuredMovie, heroMeta, initialLatest, initialPopular]);

  return (
    <MediaHubTemplate
      title="Film"
      description="Cari film populer, terbaru, dan pilihan genre tanpa muter-muter."
      icon={Clapperboard}
      theme="movie"
      eyebrow="Rak film"
      results={null}
      loading={false}
      error={null}
      hero={movieHero}
      personalSection={(
        <>
          <ContinueWatching type="movie" title="Lanjut nonton film" hideWhenUnavailable />
          <SavedContentSection type="movie" title="Film tersimpan" hideWhenUnavailable />
        </>
      )}
    >
      <StaggerEntry className="contents" delay={100}>
        {filteredResults ? (
          <SectionCard
            title={activeGenre ? `Genre: ${activeGenre}` : 'Hasil film'}
            subtitle={`Diurutkan dari ${SORT_OPTIONS.find((option) => option.value === activeSortMode)?.label ?? 'paling ramai'}`}
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
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Pilih film</p>
                <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-foreground md:text-[1.85rem]">
                  Pindah kategori dan atur urutan film dari sini.
                </h2>
              </div>
              <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground md:flex">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Kategori nonton</p>
              <SegmentedNav ariaLabel="Watch segments" items={watchPrimarySegments} />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                variant={activeGenre ? 'outline' : 'movie'}
                size="sm"
                onClick={() => handleGenreClick(null)}
                className="shrink-0"
              >
                Semua
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

        <SectionCard title="Pilih rak film" subtitle="Masuk ke film baru update atau yang lagi ramai." mode="rail" railVariant="shelf">
          {shelfBrowseCards.map((item) => (
            <MediaCard
              key={item.route}
              href={item.route}
              image={item.image}
              title={item.label}
              subtitle={item.subtitle}
              badgeText={item.badge}
              contentLabel="Film"
              theme="movie"
              displayVariant="shelf"
            />
          ))}
        </SectionCard>

        <SectionCard id="popular" title="Lagi ramai" subtitle="Paling sering dibuka bulan ini" icon={Flame} mode="grid" gridDensity="default" viewAllHref="/watch/movies#popular">
          <MovieCardList items={initialPopular} skeletonKey="popular" />
        </SectionCard>

        <SectionCard id="latest" title="Baru update" subtitle="Film baru masuk atau baru dirapikan" icon={CalendarDays} mode="grid" gridDensity="default" viewAllHref="/watch/movies#latest">
          <MovieCardList items={initialLatest} skeletonKey="latest" />
        </SectionCard>

        {topRated.length > 0 ? (
          <SectionCard title="Rating tinggi" subtitle="Film dengan skor tertinggi di rak ini" icon={Star} mode="grid" gridDensity="default">
            <MovieCardList items={topRated} skeletonKey="top-rated" />
          </SectionCard>
        ) : null}

        {genreRows.map((row) => (
          <SectionCard
            key={row.genre}
            title={row.genre}
            subtitle="Pilihan cepat dari genre ini"
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

        <section className="border-t border-border-subtle pt-6">
          <div className="flex flex-wrap gap-2 text-sm">
            {['Action', 'Comedy', 'Horror', 'Sci-Fi', 'Thriller', 'Drama', 'Romance', 'Animation'].map((genre) => (
              <Link
                key={genre}
                href={buildMoviesHref(genre, 'popular')}
                className={cn(
                  'rounded-[var(--radius-sm)] border border-border-subtle px-3 py-2 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground',
                  activeGenre === genre && 'border-border-strong text-foreground',
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

export function MoviesPageClientFromSearchParams(props: Omit<MoviesPageClientProps, 'activeGenre' | 'activeSort'>) {
  const searchParams = useSearchParams();
  const activeGenre = normalizeMovieGenreParam(searchParams.get('genre'));
  const activeSort = normalizeMovieSortParam(searchParams.get('sort'));

  return <MoviesPageClient {...props} activeGenre={activeGenre} activeSort={activeSort} />;
}
