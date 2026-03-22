'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { getDonghuaHome, AnichinHomeResult, AnichinDonghua, GenericMediaItem, donghua } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Zap } from 'lucide-react';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { ContentRow } from '@/components/molecules/ContentRow';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';

export default function DonghuaPage() {
  const [data, setData] = useState<AnichinHomeResult | null>(null);
  const [results, setResults] = useState<AnichinDonghua[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const homeData = await getDonghuaHome();
        setData(homeData);
        incrementInterest('donghua');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <MediaHubTemplate
      title="Donghua Realm"
      description="Explore breathtaking Chinese 3D animation and epic cultivation series."
      icon={Zap}
      theme="donghua"
      genres={["Action", "Adventure", "Cultivation", "Fantasy", "Historical", "Martial Arts", "Romance"]}
      results={results as unknown as GenericMediaItem[] | null}
      loading={loading}
      error={null}
      activeGenre={null}
      onGenreClick={() => {}} 
      onClearResults={() => setResults(null)}
      extraHeaderActions={<SurpriseButton type="donghua" theme="donghua" />}
    >
      <div className="space-y-32">
        <ContentRow title="Latest Updates" subtitle="Freshly cultivated episodes">
          {data?.latest_updates.map((item: AnichinDonghua, index: number) => (
            <div key={index} className="flex-shrink-0 w-48">
              <MediaCard
                href={`/donghua/${item.slug}`}
                image={item.thumb}
                title={item.title}
                badgeText={item.status || ''}
                theme="donghua"
              />
            </div>
          ))}
        </ContentRow>

        <section className="space-y-12">
           <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Ongoing Cultivators</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {data?.ongoing_series.slice(0, 18).map((item: AnichinDonghua, index: number) => (
                <MediaCard
                  key={index}
                  href={`/donghua/${item.slug}`}
                  image={item.thumb || ''}
                  title={item.title}
                  subtitle={item.episode}
                  theme="donghua"
                />
              ))}
           </div>
        </section>
      </div>
    </MediaHubTemplate>
  );
}
