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
import { getDrachinHome, type DrachinHomeData } from '@/lib/drama-source';

const EMPTY_HOME: DrachinHomeData = {
  featured: [],
  latest: [],
  popular: [],
};

export default function DrachinPageClient() {
  const [data, setData] = React.useState<DrachinHomeData>(EMPTY_HOME);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    getDrachinHome()
      .then((nextData) => {
        if (!cancelled) {
          setData(nextData);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load Drachin catalog.');
        }
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

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="Drachin"
        description="Short-form dubbed drama episodes from Sanka, with direct episode playback and rapid updates."
        icon={Clapperboard}
        theme="drama"
        containerClassName="app-container-wide"
      >
        <Badge variant="drama">Sanka Direct</Badge>
      </MediaHubHeader>

      <main className="app-container-wide mt-8 space-y-10 sm:mt-10 md:space-y-12">
        <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
          <p className="text-sm leading-6 text-zinc-400">
            Drachin sekarang langsung memakai family endpoint Sanka yang stabil untuk home, detail, dan episode.
            Flow detail dan playback hidup tanpa gateway tambahan.
          </p>
        </Paper>

        <AdSection />

        {error && !loading ? (
          <StateInfo
            type="error"
            title="Drachin is unavailable"
            description="Sanka did not return a valid Drachin payload right now. Try again in a moment."
          />
        ) : null}

        <div className="app-section-stack">
          <SectionCard title="Featured Dramas" subtitle="Pinned stories and freshly surfaced titles" icon={Sparkles} mode="rail">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`featured-${index}`} />)
              : data.featured.map((item) => (
                <Card
                  key={`featured-${item.slug}`}
                  href={`/drachin/${item.slug}`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  badgeText={item.badgeText}
                  theme="drama"
                />
              ))}
          </SectionCard>

          <SectionCard title="Latest Episodes" subtitle="Newest releases from the Drachin feed" icon={Clapperboard}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-${index}`} />)
              : data.latest.map((item) => (
                <Card
                  key={`latest-${item.slug}`}
                  href={`/drachin/${item.slug}`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  badgeText={item.badgeText}
                  theme="drama"
                />
              ))}
          </SectionCard>

          <SectionCard title="Popular Now" subtitle="What is currently moving fastest in the Drachin catalog" icon={Flame}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`popular-${index}`} />)
              : data.popular.map((item) => (
                <Card
                  key={`popular-${item.slug}`}
                  href={`/drachin/${item.slug}`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  badgeText={item.badgeText}
                  theme="drama"
                />
              ))}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
