'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getAnimeSchedule, AnimeSchedule, searchAnime, KanataAnime, getKanataAnimeByGenre, getOngoingAnime, GenericMediaItem } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Play, CheckCircle2, List, Sparkles, Flame } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ReleaseCalendar } from '@/components/organisms/ReleaseCalendar';
import { AnimeDashboard } from '@/components/organisms/AnimeDashboard';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { MediaHubFilters } from '@/components/molecules/MediaHubFilters';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { Ads } from '@/components/atoms/Ads';

const ANIME_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice-of-life", "Sports", "Supernatural", "Thriller"];
const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
const STUDIOS = ["MAPPA", "Ufotable", "A-1 Pictures", "Bones", "Madhouse", "Wit Studio", "CloverWorks", "Toei Animation"];

export default function AnimePage() {
  const [results, setResults] = useState<KanataAnime[] | null>(null);
  const [schedule, setSchedule] = useState<AnimeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [activeStudio, setActiveStudio] = useState<string | null>(null);

  const [ongoingList, setOngoingList] = useState<KanataAnime[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [scheduleData, ongoingData] = await Promise.all([
          getAnimeSchedule(),
          getOngoingAnime(1)
        ]);
        setSchedule(scheduleData);
        setOngoingList(ongoingData);
        incrementInterest('anime');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getOngoingAnime(nextPage);
      if (data.length === 0) setHasMore(false);
      else {
        setOngoingList(prev => [...prev, ...data]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
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
          <Button variant="outline" asChild className="border-zinc-800 rounded-2xl h-12">
            <Link href="/anime/list" className="flex items-center gap-2">
              <List className="w-4 h-4 text-blue-500" /> Index A-Z
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-zinc-800 rounded-2xl h-12">
            <Link href="/anime/completed" className="flex items-center gap-2">
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
          onYearChange={(y) => handleFilterChange(y, activeStudio)}
          onStudioChange={(s) => handleFilterChange(activeYear, s)}
          onClear={() => {
            setResults(null);
            setActiveYear(null);
            setActiveStudio(null);
          }}
          theme="anime"
        />
      }
    >
      <div className="space-y-32">
        <AnimeDashboard />
        <Ads type="horizontal" className="my-16" />
        {schedule.length > 0 && (
          <section className="space-y-12">
             <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">Release Schedule</h2>
             </div>
             <ReleaseCalendar schedule={schedule} theme="anime" />
          </section>
        )}
        <section className="space-y-12">
           <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">Ongoing Series</h2>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {ongoingList.map((item, index) => {
                const isBreak = (index + 1) % 18 === 0;
                return (
                  <React.Fragment key={`${item.slug}-${index}`}>
                    <MediaCard
                      href={`/anime/${item.slug}`}
                      image={item.thumb}
                      title={item.title}
                      subtitle={item.episode}
                      badgeText={item.type}
                      theme="anime"
                    />
                    {isBreak && (
                      <div className="col-span-full py-8">
                        <Ads type="horizontal" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              {loadingMore && Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
           </div>
           <div ref={lastElementRef} className="h-20 w-full flex items-center justify-center">
              {hasMore ? (
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin opacity-20" />
              ) : (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800">You have reached the end</p>
              )}
           </div>
        </section>
      </div>
    </MediaHubTemplate>
  );
}
