'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAnimeEpisode, getAnimeDetail, KanataEpisodeDetail, KanataAnimeDetail } from '@/lib/api';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { VideoPlayer } from '@/components/molecules/VideoPlayer';
import { saveHistory } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EpisodePage({ params }: PageProps) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const provider = (searchParams.get('p') as 'animasu' | 'otakudesu') || 'animasu';
  
  const router = useRouter();
  const [episode, setEpisode] = useState<KanataEpisodeDetail | null>(null);
  const [anime, setAnime] = useState<KanataAnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const epData = await getAnimeEpisode(slug, provider);
        if (!epData) throw new Error("Episode data not found");
        
        setEpisode(epData);
        
        // Fetch anime info for sidebar if available
        if (epData.navigation?.anime_info) {
          const animeData = await getAnimeDetail(epData.navigation.anime_info);
          setAnime(animeData);
          
          saveHistory({
            id: epData.navigation.anime_info,
            type: 'anime',
            title: animeData?.title || epData.title,
            image: animeData?.thumb || '',
            lastChapterOrEpisode: epData.title,
            lastLink: `/anime/episode/${slug}?p=${provider}`,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    window.scrollTo(0, 0);
  }, [slug, provider]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Preparing Stream...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 space-y-6">
        <h1 className="text-2xl font-black text-red-500 uppercase italic">Episode not found</h1>
        <Button variant="anime" asChild>
          <Link href="/anime">Return to Anime Hub</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-zinc-900/50 border-b border-zinc-800 p-4 sticky top-0 z-[160] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
              <Link href={`/anime/${episode.navigation?.anime_info || ''}`}>
                <ChevronLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-black line-clamp-1 uppercase italic text-white">{episode.title}</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">High Quality Stream</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={!episode.navigation?.prev}
              asChild={!!episode.navigation?.prev}
              className="rounded-xl border-zinc-800"
            >
              {episode.navigation?.prev ? (
                <Link href={`/anime/episode/${episode.navigation.prev}?p=${provider}`}><ChevronLeft className="w-5 h-5" /></Link>
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
            <Button 
              variant="anime" 
              size="icon" 
              disabled={!episode.navigation?.next}
              asChild={!!episode.navigation?.next}
              className="rounded-xl"
            >
              {episode.navigation?.next ? (
                <Link href={`/anime/episode/${episode.navigation.next}?p=${provider}`}><ChevronRight className="w-5 h-5" /></Link>
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <VideoPlayer 
            mirrors={episode.mirrors} 
            defaultUrl={episode.default_embed} 
            title={episode.title}
            theme="anime"
            hasNext={!!episode.navigation?.next}
            onNext={() => episode.navigation?.next && router.push(`/anime/episode/${episode.navigation.next}?p=${provider}`)}
          />
        </div>

        <div className="space-y-8">
          {anime && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 space-y-8">
              <div className="flex gap-5">
                <div className="w-20 aspect-[2/3] rounded-2xl overflow-hidden flex-shrink-0 border border-zinc-800 shadow-xl bg-zinc-900">
                  <Image
                    src={anime.thumb}
                    alt={anime.title}
                    width={160}
                    height={240}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-sm font-black leading-tight uppercase italic text-zinc-200">{anime.title}</h3>
                  <Button variant="outline" size="sm" asChild className="rounded-full w-full justify-start text-[9px] h-8 border-zinc-800">
                    <Link href={`/anime/${episode.navigation?.anime_info || ''}`}>
                      <Info className="w-3 h-3 mr-2 text-blue-500" /> Anime Info
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Playlist</h4>
                  <span className="text-[9px] font-bold text-zinc-600">{anime.episodes.length} EPISODES</span>
                </div>
                
                <ScrollArea className="w-full h-[400px]">
                  <div className="flex flex-col gap-2 pr-4">
                    {anime.episodes.map((ep) => (
                      <Link
                        key={ep.slug}
                        href={`/anime/episode/${ep.slug}?p=${provider}`}
                        className={cn(
                          "group p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between",
                          slug === ep.slug 
                            ? "bg-blue-600/10 border-blue-600/50 text-blue-400 shadow-lg shadow-blue-600/5" 
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                        )}
                      >
                        <span className="line-clamp-1">{ep.title}</span>
                        {slug === ep.slug && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                      </Link>
                    ))}
                  </div>
                  <ScrollBar />
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
