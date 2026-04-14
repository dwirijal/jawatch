'use client';

import * as React from 'react';
import { Clapperboard, Flame, Sparkles, Zap } from 'lucide-react';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { MediaCard } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { Button } from '@/components/atoms/Button';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { VerticalShortsPager } from '@/components/organisms/VerticalShortsPager';
import { getDrachinHome, getDramaboxHome, type DrachinHomeData, type DramaboxHomeData } from '@/lib/adapters/drama';
import { getDrachinPlaybackHref } from '@/lib/vertical-drama-store';
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
}

export default function DrachinPageClient({ entry = 'drachin' }: DrachinPageClientProps) {
  const [drachinData, setDrachinData] = React.useState<DrachinHomeData>(EMPTY_HOME);
  const [dramaboxData, setDramaboxData] = React.useState<DramaboxHomeData>(EMPTY_DRAMABOX_HOME);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [resumeReady, setResumeReady] = React.useState(false);
  const [isImmersive, setIsImmersive] = React.useState(false);
  
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

  const handleEnterImmersive = () => {
    setIsImmersive(true);
    setNavbarHidden(true);
    setFooterHidden(true);
  };

  const handleExitImmersive = () => {
    setIsImmersive(false);
    setNavbarHidden(false);
    setFooterHidden(false);
  };

  if (isImmersive) {
    const shorts = [...drachinData.featured, ...drachinData.popular].map(item => ({
      id: item.slug,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      videoUrl: '', // Will be resolved by VideoPlayer internally or via mirrors
      mirrors: [], // Handled by VideoPlayer logic
    }));

    return <VerticalShortsPager episodes={shorts as any} onExit={handleExitImmersive} />;
  }

  const description =
    entry === 'dramabox'
      ? 'Alias route for the unified vertical-drama catalog.'
      : 'Vertical short-drama catalog built for fast scrolling, direct playback, and quick continuation.';

  const introCopy =
    'Hub ini hanya menampilkan lane yang benar-benar tersedia dari provider: featured, latest, popular, dan trending.';

  const buildDramaboxDetailHref = (item: DramaboxHomeData['latest'][number]) => {
    const params = new URLSearchParams();
    params.set('title', item.title);
    if (item.image) {
      params.set('image', item.image);
    }
    if (item.subtitle) {
      params.set('subtitle', item.subtitle);
    }
    if (item.bookId) {
      params.set('bookId', item.bookId);
    }
    return `/dramabox/${item.bookId || item.slug}?${params.toString()}`;
  };

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="Drama China"
        description={description}
        icon={Clapperboard}
        theme="drama"
        containerClassName="app-container-wide"
      >
        <div className="flex items-center gap-3">
          <Badge variant="drama">Vertical Drama</Badge>
          <Button 
            size="sm" 
            variant="drama" 
            className="rounded-full shadow-lg shadow-accent/20"
            onClick={handleEnterImmersive}
          >
            <Zap className="mr-2 h-4 w-4 fill-current" />
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
                  href={resumeReady ? getDrachinPlaybackHref(item.slug) : `/drachin/episode/${item.slug}?index=1`}
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
                  href={resumeReady ? getDrachinPlaybackHref(item.slug) : `/drachin/episode/${item.slug}?index=1`}
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
                  href={buildDramaboxDetailHref(item)}
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
                    href={resumeReady ? getDrachinPlaybackHref(item.slug) : `/drachin/episode/${item.slug}?index=1`}
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
                    href={buildDramaboxDetailHref(item)}
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
