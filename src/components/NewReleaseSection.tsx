'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { manga, MangaSearchResult, extractSlugFromUrl, getHDThumbnail } from '@/lib/api';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';

export function NewReleaseSection() {
  const [comics, setComics] = React.useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await manga.getNew(1, 12);
        setComics(response.comics || []);
      } catch (err) {
        console.error('Failed to fetch new releases:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (!loading && comics.length === 0) return null;

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
        <Sparkles className="w-6 h-6 text-orange-500" />
        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Manga Updates</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          comics.map((mangaItem, index) => (
            <MediaCard
              key={index}
              href={`/manga/${extractSlugFromUrl(mangaItem.link)}`}
              image={getHDThumbnail(mangaItem.image)}
              title={mangaItem.title}
              subtitle={mangaItem.time_ago}
              badgeText={mangaItem.chapter}
              theme="manga"
            />
          ))
        )}
      </div>
    </section>
  );
}
