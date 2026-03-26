'use client';

import * as React from 'react';
import { AnimeSchedule, GenericMediaItem, KanataAnime, getKanataAnimeByGenre, getOngoingAnime, searchAnime } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Play, CheckCircle2, List, Sparkles, Flame } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Card } from '@/components/atoms/Card';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { ReleaseCalendar } from '@/components/organisms/ReleaseCalendar';
import { AnimeDashboard } from '@/components/organisms/AnimeDashboard';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { MediaHubFilters } from '@/components/molecules/MediaHubFilters';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';

const ANIME_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice-of-life", "Sports", "Supernatural", "Thriller"];
const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
const STUDIOS = ["MAPPA", "Ufotable", "A-1 Pictures", "Bones", "Madhouse", "Wit Studio", "CloverWorks", "Toei Animation"];

interface AnimePageClientProps {
  initialSchedule: AnimeSchedule[];
  initialOngoing: KanataAnime[];
  enableInfiniteScroll?: boolean;
}

export default function AnimePageClient({ initialSchedule, initialOngoing, enableInfiniteScroll = true }: AnimePageClientProps) {
  const [results, setResults] = React.useState<KanataAnime[] | null>(null);
  const [schedule] = React.useState(initialSchedule);
  const [loading, setLoading] = React.useState(false);
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null);
  const [activeYear, setActiveYear] = React.useState<string | null>(null);
  const [activeStudio, setActiveStudio] = React.useState<string | null>(null);

  const [ongoingList, setOngoingList] = React.useState(initialOngoing);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(enableInfiniteScroll && initialOngoing.length >= 12);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const observer = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    incrementInterest('anime');
  }, []);

  const loadMore = React.useCallback(async () => {
    if (!enableInfiniteScroll || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getOngoingAnime(nextPage);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setOngoingList((prev) => [...prev, ...data]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [enableInfiniteScroll, page, loadingMore, hasMore]);

  const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore) {
        void loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadMore]);

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setActiveGenre(genre);
    setActiveYear(null);
    setActiveStudio(null);
    try {
      const data = await getKanataAnimeByGenre(genre.toLowerCase());
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (year: string | null, studio: string | null) => {
    setActiveYear(year);
    setActiveStudio(studio);
    if (year || studio) {
      setLoading(true);
      try {
        const data = await searchAnime(`${year || ''} ${studio || ''}`.trim());
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <MediaHubTemplate
      title="Anime Hub"
      description="The definitive destination for premium anime streaming with instant updates."
      icon={Play}
      theme="anime"
      genres={ANIME_GENRES}
      results={results as unknown as GenericMediaItem[] | null}
      loading={loading}
      error={null}
      activeGenre={activeGenre}
      onGenreClick={handleGenreClick}
      onClearResults={() => {
        setResults(null);
        setActiveGenre(null);
        setActiveYear(null);
        setActiveStudio(null);
      }}
      extraHeaderActions={
        <>
          <SurpriseButton type="anime" theme="anime" />
          <Button variant="outline" size="lg" asChild>
            <Link href="/anime/list">
              <List className="w-4 h-4 text-blue-500" /> Index A-Z
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/anime/completed">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
            </Link>
          </Button>
        </>
      }
      extraFilters={
        <MediaHubFilters
          years={YEARS}
          studios={STUDIOS}
          activeYear={activeYear}
          activeStudio={activeStudio}
          onYearChange={(y) => {
            void handleFilterChange(y, activeStudio);
          }}
          onStudioChange={(s) => {
            void handleFilterChange(activeYear, s);
          }}
          onClear={() => {
            setResults(null);
            setActiveYear(null);
            setActiveStudio(null);
          }}
          theme="anime"
        />
      }
    >
      <div className="app-section-stack">
        <AnimeDashboard initialOngoing={initialOngoing.slice(0, 12)} />
        <SavedContentSection type="anime" title="Saved Anime" />
        {schedule.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="Release schedule" icon={Flame} />
            <ReleaseCalendar schedule={schedule} theme="anime" />
          </section>
        )}
        <SectionCard title="Ongoing series" icon={Sparkles} mode="grid">
          {ongoingList.map((item, index) => (
            <Card
              key={`${item.slug}-${index}`}
              href={`/anime/${item.slug}`}
              image={item.thumb}
              title={item.title}
              subtitle={item.episode}
              badgeText={item.type}
              theme="anime"
            />
          ))}
          {loadingMore && Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </SectionCard>
        <div ref={lastElementRef} className="flex h-20 w-full items-center justify-center">
          {hasMore ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent opacity-20" />
          ) : (
            <p className="text-xs font-medium tracking-[0.02em] text-zinc-700">You have reached the end</p>
          )}
        </div>
      </div>
    </MediaHubTemplate>
  );
}
