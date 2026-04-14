'use client';

import * as React from 'react';
import { Clapperboard, Flame, Sparkles, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { MediaCard } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { Button } from '@/components/atoms/Button';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { VerticalShortsPager, type ShortDrama } from '@/components/organisms/VerticalShortsPager';
import {
  getDrachinEpisodeBySlug,
  getDrachinHome,
  getDramaboxHome,
  type DrachinHomeData,
  type DramaboxHomeData,
} from '@/lib/adapters/drama';
import {
  buildVerticalDramaDramaboxHref,
  getDrachinPlaybackHref,
} from '@/lib/vertical-drama-store';
import { useUIStore } from '@/store/useUIStore';

const EMPTY_HOME: DrachinHomeData = {
  featured: [],
  latest: [],
  popular: [],
};

const EMPTY_DRAMABOX_HOME: DramaboxHomeData = {
  latest: [],
  trending: [],
};

interface DrachinPageClientProps {
  entry?: 'drachin' | 'dramabox';
  basePath?: string;
}

export default function DrachinPageClient({
  entry = 'drachin',
  basePath = '/series/short',
}: DrachinPageClientProps) {
  const [drachinData, setDrachinData] = React.useState<DrachinHomeData>(EMPTY_HOME);
  const [dramaboxData, setDramaboxData] = React.useState<DramaboxHomeData>(EMPTY_DRAMABOX_HOME);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [resumeReady, setResumeReady] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'hub' | 'shorts'>('hub');
  const [shortsData, setShortsData] = React.useState<ShortDrama[]>([]);
  const [loadingShorts, setLoadingShorts] = React.useState(false);
  const setNavbarHidden = useUIStore((state) => state.setNavbarHidden);
  const setFooterHidden = useUIStore((state) => state.setFooterHidden);

  React.useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getDrachinHome(), getDramaboxHome()])
      .then(([drachinResult, dramaboxResult]) => {
        if (cancelled) {
          return;
        }

        if (drachinResult.status === 'fulfilled') {
          setDrachinData(drachinResult.value);
        }

        if (dramaboxResult.status === 'fulfilled') {
          setDramaboxData(dramaboxResult.value);
        }

        if (drachinResult.status === 'rejected' && dramaboxResult.status === 'rejected') {
          setError('The short-drama catalog is unavailable right now. Try again in a moment.');
          return;
        }

        if (drachinResult.status === 'rejected' || dramaboxResult.status === 'rejected') {
          setError('Some short-drama lanes are temporarily unavailable, but the rest of the catalog is still online.');
          return;
        }

        setError(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setResumeReady(true);
  }, []);

  React.useEffect(() => {
    return () => {
      setNavbarHidden(false);
      setFooterHidden(false);
    };
  }, [setFooterHidden, setNavbarHidden]);

  const enterShortsMode = async () => {
    setLoadingShorts(true);
    setViewMode('shorts');
    setNavbarHidden(true);
    setFooterHidden(true);

    const featured = drachinData.featured.slice(0, 12);
    const shorts = await Promise.all(
      featured.map(async (item): Promise<ShortDrama | null> => {
        try {
          const episode = await getDrachinEpisodeBySlug(item.slug, 1);
          if (!episode) {
            return null;
          }

          return {
            slug: item.slug,
            title: item.title,
            image: item.image,
            subtitle: item.subtitle,
            mirrors: episode.mirrors,
            defaultUrl: episode.defaultUrl,
          };
        } catch (cause) {
          console.error(`Failed to fetch mirrors for ${item.slug}`, cause);
          return null;
        }
      }),
    );

    setShortsData(shorts.filter((item): item is ShortDrama => item !== null));
    setLoadingShorts(false);
  };

  const exitShortsMode = () => {
    setViewMode('hub');
    setNavbarHidden(false);
    setFooterHidden(false);
  };

  if (viewMode === 'shorts') {
    return (
      <div className="fixed inset-0 z-[500] bg-black">
        <button
          type="button"
          onClick={exitShortsMode}
          className="absolute left-6 top-6 z-[600] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95"
          aria-label="Exit immersive feed"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {loadingShorts ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
            <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Initializing Immersive Feed...
            </p>
          </div>
        ) : (
          <VerticalShortsPager shorts={shortsData} />
        )}
      </div>
    );
  }

  const description =
    entry === 'dramabox'
      ? 'Alias route for the unified short-series catalog.'
      : 'Vertical short-series catalog inside the broader series domain, built for fast scrolling, direct playback, and quick continuation.';

  const introCopy =
    'Hub ini hanya menampilkan lane yang benar-benar tersedia dari provider: featured, latest, popular, dan trending. Semua judul tetap berada di domain series, tetapi playback dan browsing-nya memakai contract vertical short-video.';

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="Short Series"
        description={description}
        icon={Clapperboard}
        theme="drama"
        containerClassName="app-container-wide"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="drama">Vertical Short</Badge>
          <Button
            variant="drama"
            size="sm"
            className="h-8 rounded-full px-4 text-[10px] font-black uppercase tracking-widest"
            onClick={enterShortsMode}
            disabled={loading || drachinData.featured.length === 0}
          >
            <Play className="mr-2 h-3 w-3 fill-current" />
            Immersive Feed
          </Button>
        </div>
      </MediaHubHeader>

      <main className="app-container-wide mt-8 space-y-10 sm:mt-10 md:space-y-12">
        <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
          <p className="text-sm leading-6 text-zinc-400">{introCopy}</p>
        </Paper>

        <AdSection />

        {error && !loading ? (
          <StateInfo
            type="empty"
            title="Short-drama catalog is partially unavailable"
            description={error}
          />
        ) : null}

        <div className="app-section-stack">
          <SectionCard title="Featured Stories" subtitle="Featured lane from the external short-drama feed" icon={Sparkles} mode="rail" railVariant="compact">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`featured-${index}`} />)
              : drachinData.featured.map((item) => (
                  <MediaCard
                    key={`featured-${item.slug}`}
                    href={resumeReady ? getDrachinPlaybackHref(item.slug, 1, basePath) : `${basePath}/watch/${item.slug}?index=1`}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
          </SectionCard>

          <SectionCard title="Latest Episodes" subtitle="Latest lane from the external Drachin feed" icon={Clapperboard} gridDensity="default">
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-${index}`} />)
              : drachinData.latest.map((item) => (
                  <MediaCard
                    key={`latest-${item.slug}`}
                    href={resumeReady ? getDrachinPlaybackHref(item.slug, 1, basePath) : `${basePath}/watch/${item.slug}?index=1`}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
          </SectionCard>

          <SectionCard title="DramaBox Latest" subtitle="Latest lane from the external DramaBox feed" icon={Clapperboard} gridDensity="default">
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`dramabox-latest-${index}`} />)
              : dramaboxData.latest.map((item) => (
                  <MediaCard
                    key={`dramabox-latest-${item.slug}`}
                    href={buildVerticalDramaDramaboxHref(item, basePath)}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
          </SectionCard>

          <SectionCard title="Popular Stories" subtitle="Popular lane from the external Drachin feed" icon={Flame} gridDensity="default">
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`popular-${index}`} />)
              : drachinData.popular.map((item) => (
                  <MediaCard
                    key={`popular-${item.slug}`}
                    href={resumeReady ? getDrachinPlaybackHref(item.slug, 1, basePath) : `${basePath}/watch/${item.slug}?index=1`}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
          </SectionCard>

          <SectionCard title="DramaBox Trending" subtitle="Trending lane from the external DramaBox feed" icon={Flame} gridDensity="default">
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`dramabox-trending-${index}`} />)
              : dramaboxData.trending.map((item) => (
                  <MediaCard
                    key={`dramabox-trending-${item.slug}`}
                    href={buildVerticalDramaDramaboxHref(item, basePath)}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
