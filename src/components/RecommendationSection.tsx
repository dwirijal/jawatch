'use client';

import * as React from 'react';
import { Flame } from 'lucide-react';
import { manga, MangaSearchResult, extractSlugFromUrl, getHDThumbnail } from '@/lib/api';
import { getHistory } from '@/lib/store';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';

export function RecommendationSection() {
  const [recommendations, setRecommendations] = React.useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [basedOn, setBasedOn] = React.useState('');

  React.useEffect(() => {
    async function fetchData() {
      const history = getHistory();
      const recents = history.filter(item => item.type === 'manga');
      
      if (recents.length === 0) {
        setLoading(false);
        return;
      }

      const lastRead = recents[0];
      setBasedOn(lastRead.title);

      try {
        const response = await manga.getRecommendations(lastRead.id);
        setRecommendations(response.recommendations || []);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
        <Flame className="w-6 h-6 text-orange-500" />
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">Recommended for You</h2>
          {basedOn && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">Based on your interest in {basedOn}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          recommendations.map((mangaItem, index) => (
            <MediaCard
              key={index}
              href={`/manga/${extractSlugFromUrl(mangaItem.link)}`}
              image={getHDThumbnail(mangaItem.image)}
              title={mangaItem.title}
              subtitle={mangaItem.type}
              theme="manga"
            />
          ))
        )}
      </div>
    </section>
  );
}
