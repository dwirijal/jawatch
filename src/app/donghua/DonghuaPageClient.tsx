'use client';

import * as React from 'react';
import { AnichinHomeResult, AnichinDonghua, GenericMediaItem, getDonghuaHome } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Zap } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';

interface DonghuaPageClientProps {
  initialData: AnichinHomeResult;
}

export default function DonghuaPageClient({ initialData }: DonghuaPageClientProps) {
  const [data, setData] = React.useState(initialData);
  const [results, setResults] = React.useState<AnichinDonghua[] | null>(null);
  const [bootstrapping, setBootstrapping] = React.useState(
    initialData.latest_updates.length === 0 || initialData.ongoing_series.length === 0
  );
  const [loading] = React.useState(false);

  React.useEffect(() => {
    incrementInterest('donghua');
  }, []);

  React.useEffect(() => {
    const needsBootstrap = initialData.latest_updates.length === 0 || initialData.ongoing_series.length === 0;

    if (!needsBootstrap) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;

    getDonghuaHome()
      .then((nextData) => {
        if (!cancelled) {
          setData(nextData);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBootstrapping(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialData.latest_updates.length, initialData.ongoing_series.length]);

  return (
    <MediaHubTemplate
      title="Donghua Realm"
      description="Explore breathtaking Chinese 3D animation and epic cultivation series."
      icon={Zap}
      theme="donghua"
      genres={["Action", "Adventure", "Cultivation", "Fantasy", "Historical", "Martial Arts", "Romance"]}
      results={results as GenericMediaItem[] | null}
      loading={loading}
      error={null}
      activeGenre={null}
      onGenreClick={() => { }}
      onClearResults={() => setResults(null)}
      extraHeaderActions={<SurpriseButton type="donghua" theme="donghua" />}
    >
      <div className="app-section-stack">
        <SectionCard title="Latest Updates" subtitle="Freshly cultivated episodes" mode="rail">
          {data.latest_updates.length === 0 && bootstrapping
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`latest-skeleton-${index}`} />)
            : data.latest_updates.map((item: AnichinDonghua, index: number) => (
              <Card
                key={index}
                href={`/donghua/${item.slug}`}
                image={item.thumb}
                title={item.title}
                badgeText={item.status || ''}
                theme="donghua"
              />
            ))}
        </SectionCard>

        <SavedContentSection type="donghua" title="Saved Donghua" />

        <SectionCard title="Ongoing cultivators">
          {data.ongoing_series.length === 0 && bootstrapping
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`ongoing-skeleton-${index}`} />)
            : data.ongoing_series.slice(0, 18).map((item: AnichinDonghua, index: number) => (
              <Card
                key={index}
                href={`/donghua/${item.slug}`}
                image={item.thumb || ''}
                title={item.title}
                subtitle={item.episode}
                theme="donghua"
              />
            ))}
        </SectionCard>
      </div>
    </MediaHubTemplate>
  );
}
