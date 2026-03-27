'use client';

import * as React from 'react';
import { Clapperboard, Flame, Sparkles } from 'lucide-react';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { getDrachinHome, getDramaboxHome, type DrachinHomeData, type DramaboxHomeData } from '@/lib/drama-source';
import { getDrachinPlaybackHref } from '@/lib/vertical-drama-store';

const EMPTY_HOME: DrachinHomeData = {
  featured: [],
  latest: [],
  popular: [],
};

const EMPTY_DRAMABOX_HOME: DramaboxHomeData = {
  latest: [],
  trending: [],
};

export default function DrachinPageClient() {
  const [drachinData, setDrachinData] = React.useState<DrachinHomeData>(EMPTY_HOME);
  const [dramaboxData, setDramaboxData] = React.useState<DramaboxHomeData>(EMPTY_DRAMABOX_HOME);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [resumeReady, setResumeReady] = React.useState(false);

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

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="Drama China"
        description="Vertical short-drama catalog built for fast scrolling, direct playback, and quick continuation."
        icon={Clapperboard}
        theme="drama"
        containerClassName="app-container-wide"
      >
        <Badge variant="drama">Vertical Drama</Badge>
      </MediaHubHeader>

      <main className="app-container-wide mt-8 space-y-10 sm:mt-10 md:space-y-12">
        <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
          <p className="text-sm leading-6 text-zinc-400">
            Semua short drama sekarang dikumpulkan di satu hub. Judul Drachin langsung membuka episode 1 atau episode terakhir
            yang tersimpan di browser, sementara lane DramaBox tetap ikut masuk ke alur discovery yang sama.
          </p>
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
          <SectionCard title="Featured Stories" subtitle="Pinned vertical dramas ready to open immediately" icon={Sparkles} mode="rail">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`featured-${index}`} />)
              : drachinData.featured.map((item) => (
                <Card
                  key={`featured-${item.slug}`}
                  href={resumeReady ? getDrachinPlaybackHref(item.slug) : `/drachin/episode/${item.slug}?index=1`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  theme="drama"
                />
              ))}
          </SectionCard>

          <SectionCard title="Drachin Episodes" subtitle="Fast-entry episodes that resume from where you left off" icon={Clapperboard}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-${index}`} />)
              : drachinData.latest.map((item) => (
                <Card
                  key={`latest-${item.slug}`}
                  href={resumeReady ? getDrachinPlaybackHref(item.slug) : `/drachin/episode/${item.slug}?index=1`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  theme="drama"
                />
              ))}
          </SectionCard>

          <SectionCard title="DramaBox Latest" subtitle="Fresh vertical-drama titles inside the shared catalog" icon={Clapperboard}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`dramabox-latest-${index}`} />)
              : dramaboxData.latest.map((item) => (
                <Card
                  key={`dramabox-latest-${item.slug}`}
                  href={`/dramabox/${item.slug}`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  theme="drama"
                />
              ))}
          </SectionCard>

          <SectionCard title="Moving Fast" subtitle="Short-drama titles with the strongest momentum right now" icon={Flame}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`moving-fast-${index}`} />)
              : [
                  ...drachinData.popular.map((item) => ({
                    ...item,
                    href: resumeReady ? getDrachinPlaybackHref(item.slug) : `/drachin/episode/${item.slug}?index=1`,
                  })),
                  ...dramaboxData.trending.map((item) => ({
                    ...item,
                    href: `/dramabox/${item.slug}`,
                  })),
                ]
                  .slice(0, 18)
                  .map((item) => (
                    <Card
                      key={`moving-fast-${item.slug}`}
                      href={item.href}
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
