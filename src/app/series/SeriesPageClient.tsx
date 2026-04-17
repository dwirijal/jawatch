'use client';

import * as React from 'react';
import { Activity, Calendar, Clapperboard, Flame, Sparkles, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Paper } from '@/components/atoms/Paper';
import { MediaCard } from '@/components/atoms/Card';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SectionCard } from '@/components/organisms/SectionCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { cn } from '@/lib/utils';
import type { GenericMediaItem } from '@/lib/types';
import {
  formatSeriesCardSubtitle,
  formatSeriesNextRelease,
  getCurrentReleaseDay,
  getSeriesBadgeText,
  getSeriesReleaseDayLabel,
  getSeriesTheme,
  type SeriesCardItem,
  type SeriesScheduleLane,
} from '@/lib/series-presentation';

interface SeriesPageClientProps {
  initialPopular: SeriesCardItem[];
  initialLatest: SeriesCardItem[];
  initialDramaSpotlight: SeriesCardItem[];
  initialWeeklySchedule: SeriesScheduleLane[];
  filters: string[];
  activeFilter?: 'anime' | 'donghua' | 'drama' | null;
}

function getCardTheme(item: SeriesCardItem): 'anime' | 'donghua' | 'drama' {
  return getSeriesTheme(item.type);
}

function buildSeriesFilterHref(filter: string): string {
  switch (filter.toLowerCase()) {
    case 'anime':
      return '/watch/series?type=anime';
    case 'donghua':
      return '/watch/series?type=donghua';
    case 'drama':
      return '/watch/series?type=drama';
    default:
      return '/watch/series';
  }
}

function filterSeriesItemsByType(items: SeriesCardItem[], activeFilter: 'anime' | 'donghua' | 'drama' | null): SeriesCardItem[] {
  if (!activeFilter) {
    return items;
  }

  return items.filter((item) => item.type === activeFilter);
}

export default function SeriesPageClient({
  initialPopular,
  initialLatest,
  initialDramaSpotlight,
  initialWeeklySchedule,
  filters,
  activeFilter = null,
}: SeriesPageClientProps) {
  const router = useRouter();
  const today = React.useMemo(() => getCurrentReleaseDay(), []);
  const [activeRadarDay, setActiveRadarDay] = React.useState<string | null>(today);
  const filteredPopular = React.useMemo(() => filterSeriesItemsByType(initialPopular, activeFilter), [activeFilter, initialPopular]);
  const filteredLatest = React.useMemo(() => filterSeriesItemsByType(initialLatest, activeFilter), [activeFilter, initialLatest]);
  const filteredDramaSpotlight = React.useMemo(() => filterSeriesItemsByType(initialDramaSpotlight, activeFilter), [activeFilter, initialDramaSpotlight]);
  const initialDonghuaSpotlight = React.useMemo(
    () => filterSeriesItemsByType(initialLatest.filter((item) => item.type === 'donghua').slice(0, 8), activeFilter),
    [activeFilter, initialLatest],
  );
  const activeRadarLane = initialWeeklySchedule.find((lane) => lane.day === activeRadarDay) ?? initialWeeklySchedule[0] ?? null;
  const shelfBrowseCards = React.useMemo(
    () => [
      {
        label: 'Latest',
        route: '/watch/series#latest',
        badge: 'NEW',
        image: initialLatest[0]?.poster || initialPopular[0]?.poster || '',
        subtitle: 'Jump to the latest updated series lane',
        theme: 'drama' as const,
      },
      {
        label: 'Popular',
        route: '/watch/series#popular',
        badge: 'HOT',
        image: initialPopular[0]?.poster || initialLatest[0]?.poster || '',
        subtitle: 'Open the most active series shelf',
        theme: 'anime' as const,
      },
    ],
    [initialLatest, initialPopular],
  );

  const handleFilterClick = (filter: string) => {
    router.push(buildSeriesFilterHref(filter));
  };

  return (
    <MediaHubTemplate
      title="Series Hub"
      description="Anime, donghua, dan drama episodik sekarang hidup di satu katalog canonical. Filter-nya membaca origin type dan negara rilis langsung dari database."
      icon={Clapperboard}
      theme="drama"
      eyebrow="Episodic Desk"
      genres={filters}
      results={null as GenericMediaItem[] | null}
      loading={false}
      error={null}
      activeGenre={null}
      onGenreClick={handleFilterClick}
      onClearResults={undefined}
      resultHrefBuilder={(item) => `/series/${item.slug}`}
    >
      <div className="app-section-stack">
        <SectionCard title="Browse By Shelf" subtitle="Open focused series lanes for ongoing titles or the full canonical list." icon={Activity} mode="rail" railVariant="compact">
          {shelfBrowseCards.map((item) => (
            <MediaCard
              key={item.route}
              href={item.route}
              image={item.image}
              title={item.label}
              subtitle={item.subtitle}
              badgeText={item.badge}
              theme={item.theme}
            />
          ))}
        </SectionCard>

        <SectionCard id="popular" title="Popular Across Series" subtitle="Judul episodik paling ramai di katalog canonical" icon={Flame} mode="grid" gridDensity="default" viewAllHref="/watch/series#popular">
          {filteredPopular.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`series-popular-${index}`} />)
            : filteredPopular.slice(0, 12).map((item) => (
              <MediaCard
                key={item.slug}
                href={`/series/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatSeriesCardSubtitle(item)}
                badgeText={getSeriesBadgeText(item.type)}
                theme={getCardTheme(item)}
              />
            ))}
        </SectionCard>

        <SectionCard id="latest" title="Recently Updated Series" subtitle="Judul anime, donghua, dan drama episodik yang baru diperbarui" icon={Sparkles} mode="grid" gridDensity="default" viewAllHref="/watch/series#latest">
          {filteredLatest.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`series-latest-${index}`} />)
            : filteredLatest.slice(0, 12).map((item) => (
              <MediaCard
                key={item.slug}
                href={`/series/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatSeriesCardSubtitle(item)}
                badgeText={getSeriesBadgeText(item.type)}
                theme={getCardTheme(item)}
              />
            ))}
        </SectionCard>

        <div id="release-radar" className="scroll-mt-28 space-y-6">
          <SectionHeader
            title="Release Radar"
            subtitle="Lane jadwal mingguan yang dibaca langsung dari release_day dan cadence di database canonical"
            icon={Timer}
          />
          {initialWeeklySchedule.length === 0
            ? (
              <div className="media-grid" data-grid-density="default">
                {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={`series-radar-${index}`} />)}
              </div>
            ) : (
              <div className="w-full">
                <Paper shadow="md" glassy className="space-y-8 overflow-hidden border-none p-4 md:p-8 lg:p-10">
                  <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/[0.04] p-2 md:gap-3">
                      {initialWeeklySchedule.map((lane) => {
                        const isToday = lane.day === today;
                        const isActive = activeRadarLane?.day === lane.day;
                        return (
                          <button
                            key={lane.day}
                            type="button"
                            onClick={() => setActiveRadarDay(lane.day)}
                            className={cn(
                              'relative px-4 py-2.5 text-xs font-bold transition-all md:px-6 md:py-3 md:text-sm',
                              'rounded-xl focus-ring outline-none',
                              isActive
                                ? 'bg-surface-2 text-white shadow-2xl'
                                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                            )}
                          >
                            {isActive && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />}
                            <span className="relative z-10 flex items-center gap-2">
                              {getSeriesReleaseDayLabel(lane.day, true)}
                              {isToday && <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {activeRadarLane && (
                      <div className="flex items-center gap-6 border-l border-white/10 pl-8 text-right md:block">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Active Lane</p>
                        <h3 className="flex items-center gap-3 text-2xl font-black tracking-[-0.03em] text-white">
                          <Calendar className="h-6 w-6 text-rose-500/80" />
                          <span>{activeRadarLane.label}</span>
                        </h3>
                      </div>
                    )}
                  </div>

                  {activeRadarLane ? (
                    <div className="space-y-8">
                      <StaggerEntry key={activeRadarDay} className="media-grid border-t border-white/6 pt-8">
                        {activeRadarLane.items.map((item) => (
                          <MediaCard
                            key={item.slug}
                            href={`/series/${item.slug}`}
                            image={item.poster}
                            title={item.title}
                            subtitle={[item.releaseWindow, item.country, item.latestEpisode].filter(Boolean).join(' • ')}
                            metaLine={formatSeriesNextRelease(item, activeRadarLane.timezone)}
                            badgeText={getSeriesBadgeText(item.type)}
                            theme={getCardTheme(item)}
                            aspectRatio="feature"
                          />
                        ))}
                      </StaggerEntry>
                    </div>
                  ) : null}
                </Paper>
              </div>
            )}
        </div>

        <SectionCard title="Donghua Spotlight" subtitle="Donghua canonical dari series catalog dengan update paling aktif" icon={Sparkles} mode="grid" gridDensity="default">
          {initialDonghuaSpotlight.length === 0
            ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={`series-donghua-${index}`} />)
            : initialDonghuaSpotlight.map((item) => (
              <MediaCard
                key={item.slug}
                href={`/series/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatSeriesCardSubtitle(item)}
                badgeText="DONGHUA"
                theme="donghua"
              />
            ))}
        </SectionCard>

        <SectionCard title="Drama Spotlight" subtitle="Drama episodik paling aktif dari lane live-action canonical" icon={Clapperboard} mode="grid" gridDensity="default">
          {filteredDramaSpotlight.length === 0
            ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={`series-drama-${index}`} />)
            : filteredDramaSpotlight.slice(0, 8).map((item) => (
              <MediaCard
                key={item.slug}
                href={`/series/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatSeriesCardSubtitle(item)}
                badgeText="DRAMA"
                theme="drama"
              />
            ))}
        </SectionCard>
      </div>
    </MediaHubTemplate>
  );
}
