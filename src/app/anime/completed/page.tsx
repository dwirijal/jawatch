'use client';

import { useEffect, useState } from 'react';
import { getCompletedAnime, KanataCompletedAnime } from '@/lib/api';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { Pagination } from '@/components/molecules/Pagination';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { CheckCircle2 } from 'lucide-react';

export default function CompletedAnimePage() {
  const [data, setData] = useState<KanataCompletedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const list = await getCompletedAnime(page);
        setData(list);
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
    <div className="min-h-screen bg-zinc-950 pb-20">
      <header className="py-16 px-8 border-b border-zinc-900 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg shadow-lg shadow-green-600/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Completed Anime</h1>
          </div>
          <p className="text-zinc-500 font-medium max-w-md">Binge-watch your favorite series from start to finish with our collection of completed anime.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-12 space-y-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            <StaggerEntry className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {data.map((anime, index) => (
                <MediaCard
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

            <Pagination 
              currentPage={page} 
              hasMore={data.length > 0} 
              onPageChange={setPage} 
              theme="anime" 
            />
          </>
        )}
      </main>
    </div>
  );
}
