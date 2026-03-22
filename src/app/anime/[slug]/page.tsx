'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { getAnimeDetail, KanataAnimeDetail, getJikanEnrichment, JikanEnrichment } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Play, Star, Calendar, Monitor, BookOpen, ChevronLeft, Download } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/molecules/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CircularLoader } from '@/components/atoms/CircularLoader';
import { JikanEnrichmentPanel } from '@/components/molecules/JikanEnrichmentPanel';
import { UserReviewSection } from '@/components/molecules/UserReviewSection';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AnimeDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [anime, setAnime] = useState<KanataAnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Jikan Data
  const [enrichment, setEnrichment] = useState<JikanEnrichment | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAnimeDetail(slug);
        setAnime(data);
        incrementInterest('anime');
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Fetch Jikan data separately to not block main content
  useEffect(() => {
    const animeTitle = anime?.title ?? '';
    if (!animeTitle) return;
    
    let cancelled = false;
    async function fetchEnrichment() {
      setEnrichmentLoading(true);
      try {
        const data = await getJikanEnrichment('anime', animeTitle);
        if (!cancelled) setEnrichment(data);
      } catch (err) {
        console.error('Jikan fetch failed:', err);
      } finally {
        if (!cancelled) setEnrichmentLoading(false);
      }
    }
    fetchEnrichment();
    return () => { cancelled = true; };
  }, [anime?.title]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <CircularLoader theme="anime" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4 uppercase italic font-black text-red-500">Anime tidak ditemukan</h1>
        <p className="text-zinc-500 mb-8 max-w-xs text-center">Slug ini mungkin tidak terdaftar di database.</p>
        <Button variant="anime" asChild>
          <Link href="/anime">Kembali ke Pencarian</Link>
        </Button>
      </div>
    );
  }

  const isCompleted = anime.status.toLowerCase().includes('selesai');

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative h-[500px] w-full overflow-hidden">
        <div className="relative h-full w-full">
          <Image
            src={anime.thumb}
            alt={anime.title}
            fill
            className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <nav className="mb-8">
            <Link href="/anime" className="text-zinc-400 hover:text-blue-500 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back to Browse
            </Link>
          </nav>
          
          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-56 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
              <div className="relative h-full w-full">
                <Image
                  src={anime.thumb}
                  alt={anime.title}
                  fill
                  className="w-full h-full object-cover"
                  sizes="224px"
                  unoptimized
                />
              </div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-4">
                {anime.genres.map(genre => (
                  <Badge key={genre} variant="anime">{genre}</Badge>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-white">{anime.title}</h1>
                <div className="flex items-center gap-2">
                  <ShareButton title={anime.title} theme="anime" />
                  <BookmarkButton 
                    item={{
                      id: slug,
                      type: 'anime',
                      title: anime.title,
                      image: anime.thumb,
                      timestamp: Date.now()
                    }}
                    theme="anime"
                  />
                </div>
              </div>
              <p className="text-xl text-zinc-400 font-medium mb-6">{anime.alternative_title}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Rating" value={anime.rating} icon={Star} />
                <StatCard label="Studio" value={anime.studio} icon={Monitor} />
                <StatCard label="Status" value={anime.status} icon={Calendar} />
                <StatCard label="Episodes" value={anime.total_episodes} icon={BookOpen} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          
          {/* Jikan Enrichment Section */}
          <section className="space-y-8">
             <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Global Insights</h2>
             </div>
             <JikanEnrichmentPanel data={enrichment} loading={enrichmentLoading} />
          </section>

          <section>
            <h2 className="text-2xl font-black mb-6 italic border-l-4 border-blue-600 pl-4 uppercase tracking-tighter">Synopsis</h2>
            <p className="text-zinc-400 leading-relaxed text-lg font-light">
              {enrichment?.synopsis || anime.synopsis || "No synopsis available for this anime."}
            </p>
          </section>

          {anime.download && anime.download.length > 0 && (
            <section className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-8">
                <Download className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Direct Download</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {anime.download.map((dl, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col gap-4">
                    <Badge variant="solid" className="w-fit">{dl.quality}</Badge>
                    <div className="flex flex-wrap gap-2">
                    {dl.url.slice(0, 3).map((link: string, lIdx: number) => (
                        <Button key={lIdx} variant="outline" size="sm" className="text-[10px] rounded-xl h-8" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">Server {lIdx + 1}</a>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic border-l-4 border-blue-600 pl-4 uppercase tracking-tighter">Episodes</h2>
              <Badge variant="outline">{anime.episodes.length} AVAILABLE</Badge>
            </div>
            
            <ScrollArea.Root className="w-full h-[600px] overflow-hidden rounded-3xl bg-zinc-900/30 border border-zinc-800">
              <ScrollArea.Viewport className="w-full h-full p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {anime.episodes.map((ep) => (
                    <Link 
                      key={ep.slug}
                      href={`/anime/episode/${ep.slug}?p=${anime.provider}`}
                      className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-blue-500/30 transition-all group shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <Play className="w-4 h-4 text-blue-400 group-hover:text-white fill-blue-400 group-hover:fill-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-sm block group-hover:text-blue-400 transition-colors tracking-tight">{ep.title}</span>
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{ep.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="flex select-none touch-none p-1 bg-zinc-900/10 w-2" orientation="vertical">
                <ScrollArea.Thumb className="flex-1 bg-zinc-800 rounded-full" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </section>

          <UserReviewSection mediaId={slug} theme="anime" />
        </div>

        <aside className="space-y-12">
           <div className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] shadow-xl shadow-blue-900/20 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-2 italic uppercase tracking-tighter text-white">Ready to watch?</h3>
                <p className="text-blue-100 text-sm font-medium mb-6 opacity-80 leading-relaxed">Jump straight into the latest episode or start from the beginning.</p>
                <div className="flex flex-col gap-3">
                  {anime.episodes.length > 0 && (
                    <Button variant="default" className="rounded-xl px-8 w-full" asChild>
                      <Link href={`/anime/episode/${anime.episodes[0].slug}?p=${anime.provider}`}>
                        Start Now <Play className="w-3 h-3 ml-2 fill-current" />
                      </Link>
                    </Button>
                  )}
                  {isCompleted && anime.provider === 'otakudesu' && (
                    <Button variant="outline" className="rounded-xl px-8 w-full bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                      <Link href={`/anime/batch/${slug}`}>
                        Batch Download <Download className="w-3 h-3 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <Play className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
           </div>
           
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Quick Stats</h3>
              <div className="grid grid-cols-1 gap-3">
                 <StatCard label="Type" value={anime.type} />
                 <StatCard label="Studio" value={anime.studio} />
                 <StatCard label="Quality" value="HD High" />
              </div>
           </div>
        </aside>
      </main>
    </div>
  );
}
