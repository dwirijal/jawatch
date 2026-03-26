'use client';

import * as React from 'react';
import { Clock, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { getHistory, HistoryItem } from '@/lib/store';
import { getOngoingAnime, KanataAnime } from '@/lib/api';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { CardGrid, CardRail } from '@/components/molecules/card';

interface AnimeDashboardProps {
  initialOngoing?: KanataAnime[];
}

export function AnimeDashboard({ initialOngoing }: AnimeDashboardProps) {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [ongoing, setOngoing] = React.useState<KanataAnime[]>(initialOngoing ?? []);
  const [loading, setLoading] = React.useState(!initialOngoing);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    async function init() {
      setHistory(getHistory().filter(h => h.type === 'anime').slice(0, 8));
      if (initialOngoing) {
        setOngoing(initialOngoing.slice(0, 12));
        setLoading(false);
        return;
      }

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
  }, [initialOngoing]);

  if (!mounted) return null;

  return (
    <div className="space-y-10 md:space-y-12">
      {history.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Continue Watching" icon={Clock} />
          <ScrollArea className="w-full">
            <CardRail>
              {history.map((item) => (
                <Card
                  key={item.id}
                  href={item.lastLink}
                  image={item.image}
                  title={item.title}
                  subtitle={item.lastChapterOrEpisode}
                  badgeText="Resume"
                  theme="anime"
                />
              ))}
            </CardRail>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeader
          title="Trending Ongoing"
          icon={Flame}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/anime/list" className="flex items-center gap-2">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {loading ? (
          <CardGrid>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </CardGrid>
        ) : (
          <CardGrid>
            <StaggerEntry className="contents">
              {ongoing.map((item, idx) => (
                <Card
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
          </CardGrid>
        )}
      </section>

      <Paper tone="muted" shadow="sm" className="relative overflow-hidden p-5 md:p-6">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="relative z-10 space-y-4">
          <SectionHeader title="Picked For You" icon={Sparkles} className="pb-0" />

          <CardGrid>
            {ongoing.slice().reverse().slice(0, 6).map((item, idx) => (
              <Card
                key={`rec-${idx}`}
                href={`/anime/${item.slug}`}
                image={item.thumb}
                title={item.title}
                theme="anime"
                className="opacity-80 hover:opacity-100"
              />
            ))}
          </CardGrid>
        </div>
      </Paper>
    </div>
  );
}
