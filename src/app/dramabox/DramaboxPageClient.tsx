'use client';

import * as React from 'react';
import { Clapperboard, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { AdSection } from '@/components/organisms/AdSection';
import { getDramaboxHome, type DramaboxHomeData } from '@/lib/drama-source';

const EMPTY_HOME: DramaboxHomeData = {
  latest: [],
  trending: [],
};

export default function DramaboxPageClient() {
  const [data, setData] = React.useState<DramaboxHomeData>(EMPTY_HOME);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    getDramaboxHome()
      .then((nextData) => {
        if (!cancelled) {
          setData(nextData);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load DramaBox catalog.');
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
        title="DramaBox"
        description="Short drama catalog from Sanka. Catalog endpoints are stable, while detail and playback are still inconsistent upstream."
        icon={Clapperboard}
        theme="drama"
        containerClassName="app-container-wide"
      >
        <Badge variant="drama">Catalog Live</Badge>
      </MediaHubHeader>

      <main className="app-container-wide mt-8 space-y-10 sm:mt-10 md:space-y-12">
        <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
          <p className="text-sm leading-6 text-zinc-400">
            DramaBox sekarang sudah masuk sebagai feed langsung dari Sanka. Namun detail dan stream untuk title individual
            belum konsisten karena provider masih sering mengembalikan <span className="font-semibold text-zinc-200">bookId null</span>
            atau <span className="font-semibold text-zinc-200">500</span> di endpoint detail. Hub ini sengaja dibuka dulu untuk discovery.
          </p>
        </Paper>

        <AdSection />

        {error && !loading ? (
          <StateInfo
            type="error"
            title="DramaBox is unavailable"
            description="Sanka did not return a valid DramaBox payload right now. Try again in a moment."
          />
        ) : null}

        <div className="app-section-stack">
          <SectionCard title="Latest Releases" subtitle="Newest short drama drops in the feed" icon={Clapperboard}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-${index}`} />)
              : data.latest.map((item) => (
                <Card
                  key={`latest-${item.slug}`}
                  href={`/dramabox/${item.slug}`}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  badgeText={item.badgeText}
                  theme="drama"
                />
              ))}
          </SectionCard>

          <SectionCard title="Trending Now" subtitle="Highest momentum inside the current DramaBox catalog" icon={TrendingUp}>
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`trending-${index}`} />)
              : data.trending.map((item) => (
                <Card
                  key={`trending-${item.slug}`}
                  href={`/dramabox/${item.slug}`}
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
