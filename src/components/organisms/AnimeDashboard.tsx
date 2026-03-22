'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { getHistory, HistoryItem } from '@/lib/store';
import { getOngoingAnime, KanataAnime } from '@/lib/api';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { Button } from '@/components/atoms/Button';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';

export function AnimeDashboard() {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [ongoing, setOngoing] = React.useState<KanataAnime[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    async function init() {
      setHistory(getHistory().filter(h => h.type === 'anime').slice(0, 8));
      try {
        const ongoingData = await getOngoingAnime(1);
        setOngoing(ongoingData.slice(0, 12));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-24">
      {/* 1. Last View (History) */}
      {history.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Continue Watching</h2>
            </div>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-6">
              {history.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-48 md:w-56">
                  <MediaCard
                    href={item.lastLink}
                    image={item.image}
                    title={item.title}
                    subtitle={item.lastChapterOrEpisode}
                    badgeText="Resume"
                    theme="anime"
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* 2. Trending / Ongoing */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Trending Ongoing</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
             <Link href="/anime/list" className="text-zinc-500 hover:text-blue-400 flex items-center gap-2">
               View All <ChevronRight className="w-4 h-4" />
             </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <StaggerEntry className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {ongoing.map((item, idx) => (
                <MediaCard
                  key={`${item.slug}-${idx}`}
                  href={`/anime/${item.slug}`}
                  image={item.thumb}
                  title={item.title}
                  subtitle={item.episode}
                  badgeText={item.type || "Hot"}
                  theme="anime"
                />
              ))}
            </StaggerEntry>
          )}
        </div>
      </section>

      {/* 3. Recommendation Stub (Based on sparkles/interest) */}
      <section className="p-12 rounded-[3rem] bg-gradient-to-br from-blue-600/10 via-transparent to-transparent border border-blue-600/10 relative overflow-hidden">
         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Picked For You</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {/* Mock or filtered recommendations */}
               {ongoing.slice().reverse().slice(0, 5).map((item, idx) => (
                 <MediaCard
                   key={`rec-${idx}`}
                   href={`/anime/${item.slug}`}
                   image={item.thumb}
                   title={item.title}
                   theme="anime"
                   className="opacity-80 hover:opacity-100"
                 />
               ))}
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full" />
      </section>
    </div>
  );
}
