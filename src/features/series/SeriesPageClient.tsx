'use client';

import * as React from 'react';
import { Activity, Calendar, Clapperboard, Flame, Info, Play, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { MediaCard } from '@/components/atoms/Card';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { MediaHubTemplate, type MediaHubHero } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SectionCard } from '@/components/organisms/SectionCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { buildSeriesFilterHref, SERIES_FILTER_SEGMENTS, WATCH_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
import { cn } from '@/lib/utils';
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

const SERIES_HUB_ASSETS = {
  hero: '/Series.png',
  animeHero: '/Anime.png',
  latest: '/New%20Release.png',
  popular: '/Popular.png',
  schedule: '/Schedule.png',
} as const;

interface SeriesPageClientProps {
  initialPopular: SeriesCardItem[];
  initialLatest: SeriesCardItem[];
  initialDramaSpotlight: SeriesCardItem[];
  initialWeeklySchedule: SeriesScheduleLane[];
  activeFilter?: 'anime' | 'donghua' | 'drama' | null;
}

function getCardTheme(item: SeriesCardItem): 'anime' | 'donghua' | 'drama' {
  return getSeriesTheme(item.type);
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
  activeFilter = null,
}: SeriesPageClientProps) {
  const today = React.useMemo(() => getCurrentReleaseDay(), []);
  const [activeRadarDay, setActiveRadarDay] = React.useState<string | null>(today);
  const seriesTheme = activeFilter === 'anime' ? 'anime' : activeFilter === 'donghua' ? 'donghua' : 'drama';
  const filteredPopular = React.useMemo(() => filterSeriesItemsByType(initialPopular, activeFilter), [activeFilter, initialPopular]);
  const filteredLatest = React.useMemo(() => filterSeriesItemsByType(initialLatest, activeFilter), [activeFilter, initialLatest]);
  const filteredDramaSpotlight = React.useMemo(() => filterSeriesItemsByType(initialDramaSpotlight, activeFilter), [activeFilter, initialDramaSpotlight]);
  const initialDonghuaSpotlight = React.useMemo(
    () => filterSeriesItemsByType(initialLatest.filter((item) => item.type === 'donghua').slice(0, 8), activeFilter),
    [activeFilter, initialLatest],
  );
  const activeRadarLane = initialWeeklySchedule.find((lane) => lane.day === activeRadarDay) ?? initialWeeklySchedule[0] ?? null;
  const spotlightSeries = filteredLatest[0] ?? filteredPopular[0] ?? initialLatest[0] ?? initialPopular[0] ?? null;
  const spotlightBadges = React.useMemo(
    () => (spotlightSeries?.genres
      ? spotlightSeries.genres.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 3)
      : []),
    [spotlightSeries],
  );
  const seriesHero = React.useMemo<MediaHubHero>(() => ({
    title: spotlightSeries?.title || 'Series pilihan',
    description: activeFilter
      ? `Update ${activeFilter} terbaru yang bisa kamu cek sebelum lanjut pilih episode.`
      : 'Anime, donghua, dan drama dalam satu rak yang lebih gampang dipilih.',
    label: activeFilter ? `Sorotan ${activeFilter}` : 'Pilihan series',
    meta: spotlightSeries
      ? [getSeriesBadgeText(spotlightSeries.type), formatSeriesCardSubtitle(spotlightSeries), spotlightSeries.rating ? `Rating ${spotlightSeries.rating}` : null]
          .filter(Boolean)
          .join(' • ')
      : 'Series buat ditonton',
    image: spotlightSeries?.background
      || spotlightSeries?.backdrop
      || spotlightSeries?.poster
      || initialLatest[0]?.background
      || initialLatest[0]?.backdrop
      || initialLatest[0]?.poster
      || initialPopular[0]?.background
      || initialPopular[0]?.backdrop
      || initialPopular[0]?.poster
      || (activeFilter === 'anime' ? SERIES_HUB_ASSETS.animeHero : SERIES_HUB_ASSETS.hero),
    imageAlt: spotlightSeries?.title || 'Poster series pilihan',
    logo: spotlightSeries?.logo,
    logoAlt: spotlightSeries?.title || 'Logo series pilihan',
    useLogo: false,
    badges: spotlightBadges,
    actions: spotlightSeries ? (
      <>
        <Button
          variant={seriesTheme}
          className="h-11 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_26px_68px_-30px_rgba(184,138,168,0.72)] md:h-12 md:px-5 md:text-sm"
          asChild
        >
          <Link href={`/series/${spotlightSeries.slug}`}>
            <Play className="h-4 w-4 fill-current" /> Lanjut nonton
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-11 whitespace-nowrap rounded-full border-white/16 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-white/18 hover:text-white md:h-12 md:px-5 md:text-sm"
          asChild
        >
          <Link href={`/series/${spotlightSeries.slug}`}>
            <Info className="h-4 w-4" /> Lihat detail
          </Link>
        </Button>
      </>
    ) : (
      <Button
        variant={seriesTheme}
        className="h-11 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_26px_68px_-30px_rgba(184,138,168,0.72)] md:h-12 md:px-5 md:text-sm"
        asChild
      >
        <Link href="/watch/series#popular">
          <Play className="h-4 w-4 fill-current" /> Cari series
        </Link>
      </Button>
    ),
  }), [activeFilter, initialLatest, initialPopular, seriesTheme, spotlightBadges, spotlightSeries]);
  const watchPrimarySegments = React.useMemo(
    () => WATCH_PRIMARY_SEGMENTS.map((segment) => ({
      href: segment.href,
      label: segment.label,
      title: segment.description,
      active: segment.href === '/watch/series',
    })),
    [],
  );
  const activeSeriesFilterHref = buildSeriesFilterHref(activeFilter ?? 'all');
  const seriesFilterSegments = React.useMemo(
    () => SERIES_FILTER_SEGMENTS.map((segment) => ({
        href: segment.href,
        label: segment.label,
        title: segment.description,
        active: segment.href === activeSeriesFilterHref,
      })),
    [activeSeriesFilterHref],
  );
  const shelfBrowseCards = React.useMemo<Array<{
    label: string;
    route: string;
    badge: string;
    image: string;
    subtitle: string;
    theme: 'anime' | 'donghua' | 'drama';
  }>>(
    () => [
      {
        label: 'Baru update',
        route: '/watch/series#latest',
        badge: 'NEW',
        image: SERIES_HUB_ASSETS.latest,
        subtitle: 'Episode baru dan series yang baru aktif.',
        theme: seriesTheme,
      },
      {
        label: 'Lagi ramai',
        route: '/watch/series#popular',
        badge: 'HOT',
        image: SERIES_HUB_ASSETS.popular,
        subtitle: 'Series yang paling sering dibuka sekarang.',
        theme: seriesTheme,
      },
      {
        label: 'Jadwal rilis',
        route: '/watch/series#release-radar',
        badge: 'LIVE',
        image: SERIES_HUB_ASSETS.schedule,
        subtitle: 'Cek jadwal episode yang akan datang.',
        theme: seriesTheme,
      },
    ],
    [seriesTheme],
  );

  return (
    <MediaHubTemplate
      title="Series"
      description="Anime, donghua, dan drama dalam satu rak yang gampang dipilih."
      icon={Clapperboard}
      theme={seriesTheme}
      eyebrow="Rak series"
      results={null}
      loading={false}
      error={null}
      hero={seriesHero}
      personalSection={(
        <>
          <ContinueWatching type={['anime', 'donghua', 'drama']} title="Lanjut nonton series" hideWhenUnavailable />
          <SavedContentSection
            type={['anime', 'donghua', 'drama']}
            title="Series tersimpan"
            hideWhenUnavailable
            themeOverride="drama"
          />
        </>
      )}
    >
      <StaggerEntry className="contents" delay={100}>
        <section className="surface-panel relative overflow-hidden p-4 md:p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--theme-drama-surface),transparent_74%)]" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Pilih series</p>
                <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-foreground md:text-[1.85rem]">
                  Pilih kategori nonton, lalu filter anime, donghua, atau drama.
                </h2>
              </div>
              <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground md:flex">
                <Activity className="h-4 w-4" />
                Filter
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Kategori nonton</p>
              <SegmentedNav ariaLabel="Watch segments" items={watchPrimarySegments} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Filter series</p>
              <SegmentedNav ariaLabel="Series filters" items={seriesFilterSegments} />
            </div>
          </div>
        </section>

        <SectionCard title="Pilih rak series" subtitle="Masuk ke series baru update, lagi ramai, atau jadwal rilis." icon={Activity} mode="rail" railVariant="shelf">
          {shelfBrowseCards.map((item) => (
            <MediaCard
              key={item.route}
              href={item.route}
              image={item.image}
              title={item.label}
              subtitle={item.subtitle}
              badgeText={item.badge}
              contentLabel="Series"
              theme={item.theme}
              displayVariant="shelf"
            />
          ))}
        </SectionCard>

        <SectionCard id="popular" title="Series lagi ramai" subtitle="Judul episodik yang paling sering dibuka" icon={Flame} mode="grid" gridDensity="default" viewAllHref="/watch/series#popular">
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

        <SectionCard id="latest" title="Series baru update" subtitle="Anime, donghua, dan drama yang baru diperbarui" icon={Sparkles} mode="grid" gridDensity="default" viewAllHref="/watch/series#latest">
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
            title="Jadwal rilis"
            subtitle="Cek jadwal update mingguan sebelum pilih episode berikutnya."
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
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Hari dipilih</p>
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

        {initialDonghuaSpotlight.length > 0 ? (
          <SectionCard title="Sorotan donghua" subtitle="Donghua yang lagi aktif update" icon={Sparkles} mode="grid" gridDensity="default">
            {initialDonghuaSpotlight.map((item) => (
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
        ) : null}

        {filteredDramaSpotlight.length > 0 ? (
          <SectionCard title="Sorotan drama" subtitle="Drama yang lagi ramai dibuka" icon={Clapperboard} mode="grid" gridDensity="default">
            {filteredDramaSpotlight.slice(0, 8).map((item) => (
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
        ) : null}
      </StaggerEntry>
    </MediaHubTemplate>
  );
}
