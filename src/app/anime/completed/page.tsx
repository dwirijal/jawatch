'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { AdSection } from '@/components/organisms/AdSection';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { Pagination } from '@/components/molecules/Pagination';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { CheckCircle2 } from 'lucide-react';
import { getCompletedAnimePage } from '@/lib/adapters/anime';
import type { KanataCompletedAnime } from '@/lib/types';

export default function CompletedAnimePage() {
  const [data, setData] = useState<KanataCompletedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getCompletedAnimePage(page);
        setData(result.items);
        setHasMore(result.hasNextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page]);

  return (
    <main className="app-shell">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <section className="surface-panel-elevated p-6 sm:p-8">
          <SectionHeader
            title="Completed Anime"
            subtitle="Finished series pulled from Samehadaku, ready for full-season binge sessions."
            leading={
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-green-500/15">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            }
            contentClassName="max-w-3xl"
            className="border-0 pb-0"
          />
        </section>

        <AdSection theme="anime" />

        <div className="app-section-stack">
          {loading ? (
            <div className="media-grid" data-grid-density="default">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="media-grid" data-grid-density="default">
                <StaggerEntry className="contents">
                  {data.map((anime, index) => (
                    <Card
                      key={`${anime.slug}-${index}`}
                      href={`/anime/${anime.slug}`}
                      image={anime.thumb}
                      title={anime.title}
                      subtitle={anime.episode}
                      badgeText="End"
                      theme="anime"
                    />
                  ))}
                </StaggerEntry>
              </div>

              <Pagination
                currentPage={page}
                hasMore={hasMore}
                onPageChange={setPage}
                theme="anime"
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
