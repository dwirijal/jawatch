'use client';

import * as React from 'react';
import { incrementInterest } from '@/lib/store';
import { Zap } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';
import { ReleaseCalendar } from '@/components/organisms/ReleaseCalendar';
import { getDonghuaHome, getDonghuaSchedule } from '@/lib/adapters/donghua';
import type { AnichinDonghua, AnichinHomeResult, AnimeSchedule, GenericMediaItem } from '@/lib/types';

interface DonghuaPageClientProps {
  initialData: AnichinHomeResult;
  initialSchedule: AnimeSchedule[];
}

export default function DonghuaPageClient({ initialData, initialSchedule }: DonghuaPageClientProps) {
  const [data, setData] = React.useState(initialData);
  const [schedule, setSchedule] = React.useState(initialSchedule);
  const [results, setResults] = React.useState<AnichinDonghua[] | null>(null);
  const [bootstrapping, setBootstrapping] = React.useState(
    initialData.latest_updates.length === 0 ||
      initialData.ongoing_series.length === 0 ||
      initialData.completed_series.length === 0
  );
  const [loading] = React.useState(false);

  React.useEffect(() => {
    incrementInterest('donghua');
  }, []);

  React.useEffect(() => {
    const needsBootstrap =
      initialData.latest_updates.length === 0 ||
      initialData.ongoing_series.length === 0 ||
      initialData.completed_series.length === 0;

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
  }, [initialData.completed_series.length, initialData.latest_updates.length, initialData.ongoing_series.length]);

  React.useEffect(() => {
    if (initialSchedule.length > 0) {
      return;
    }

    let cancelled = false;
    getDonghuaSchedule()
      .then((nextSchedule) => {
        if (!cancelled) {
          setSchedule(nextSchedule);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialSchedule.length]);

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
        <SectionCard title="Latest Updates" subtitle="Freshly cultivated episodes" mode="rail" railVariant="default">
          {data.latest_updates.length === 0 && bootstrapping
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`latest-skeleton-${index}`} />)
            : data.latest_updates.map((item: AnichinDonghua, index: number) => (
              <Card
                key={index}
                href={item.link || `/donghua/${item.slug}`}
                image={item.thumb}
                title={item.title}
                subtitle={item.episode || undefined}
                badgeText={item.status || item.type || ''}
                theme="donghua"
              />
            ))}
        </SectionCard>

        <SavedContentSection type="donghua" title="Saved Donghua" />

        {schedule.length > 0 ? <ReleaseCalendar schedule={schedule} theme="donghua" /> : null}

        <SectionCard title="Ongoing cultivators" gridDensity="default">
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

        <SectionCard title="Completed Realm" subtitle="Finished series ready for a full binge" mode="rail" railVariant="default">
          {data.completed_series.length === 0 && bootstrapping
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`completed-skeleton-${index}`} />)
            : data.completed_series.slice(0, 18).map((item: AnichinDonghua, index: number) => (
              <Card
                key={`completed-${index}-${item.slug}`}
                href={`/donghua/${item.slug}`}
                image={item.thumb || ''}
                title={item.title}
                subtitle={item.episode || undefined}
                badgeText={item.status || 'Completed'}
                theme="donghua"
              />
            ))}
        </SectionCard>
      </div>
    </MediaHubTemplate>
  );
}
