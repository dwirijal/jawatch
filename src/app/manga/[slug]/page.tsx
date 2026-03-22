'use client';

import { useEffect, useState, use } from 'react';
import Link from "next/link";
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { getMangaDetail, getHDThumbnail, MangaDetail, getJikanEnrichment, JikanEnrichment } from "@/lib/api";
import { saveRecentManga } from "@/lib/store";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { StatCard } from "@/components/molecules/StatCard";
import { BookmarkButton } from "@/components/molecules/BookmarkButton";
import { ShareButton } from "@/components/molecules/ShareButton";
import { CircularLoader } from "@/components/atoms/CircularLoader";
import { JikanEnrichmentPanel } from '@/components/molecules/JikanEnrichmentPanel';
import { UserReviewSection } from '@/components/molecules/UserReviewSection';
import { User, Activity, Layout, ShieldAlert, ChevronLeft, Play } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MangaDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Jikan Data
  const [enrichment, setEnrichment] = useState<JikanEnrichment | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMangaDetail(slug);
        setManga(data);
        
        saveRecentManga({
          slug: data.slug,
          title: data.title,
          image: getHDThumbnail(data.image),
          lastReadAt: Date.now()
        });
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Fetch Jikan enrichment for manga
  useEffect(() => {
    const mangaTitle = manga?.title ?? '';
    if (!mangaTitle) return;
    
    let cancelled = false;
    async function fetchEnrichment() {
      setEnrichmentLoading(true);
      try {
        const data = await getJikanEnrichment('manga', mangaTitle);
        if (!cancelled) setEnrichment(data);
      } catch (err) {
        console.error('Jikan fetch failed:', err);
      } finally {
        if (!cancelled) setEnrichmentLoading(false);
      }
    }
    fetchEnrichment();
    return () => { cancelled = true; };
  }, [manga?.title]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <CircularLoader theme="manga" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4 uppercase italic font-black text-red-500">Manga tidak ditemukan</h1>
        <Button variant="manga" asChild>
          <Link href="/manga">Kembali ke Pencarian</Link>
        </Button>
      </div>
    );
  }

  const hdImage = getHDThumbnail(manga.image);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative h-[500px] w-full overflow-hidden">
        <img 
          src={hdImage} 
          alt={manga.title} 
          className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <nav className="mb-8">
            <Link href="/manga" className="text-zinc-400 hover:text-orange-500 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back to Library
            </Link>
          </nav>
          
          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-56 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
              <img src={hdImage} alt={manga.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map(genre => (
                  <Badge key={genre.slug} variant="manga">{genre.name}</Badge>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-white">{manga.title}</h1>
                <div className="flex items-center gap-2">
                  <ShareButton title={manga.title} theme="manga" />
                  <BookmarkButton 
                    item={{
                      id: slug,
                      type: 'manga',
                      title: manga.title,
                      image: hdImage,
                      timestamp: Date.now()
                    }}
                    theme="manga"
                  />
                </div>
              </div>
              <p className="text-xl text-zinc-400 font-medium">{manga.title_indonesian}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <StatCard label="Author" value={manga.metadata.author} icon={User} />
                <StatCard label="Status" value={manga.metadata.status} icon={Activity} />
                <StatCard label="Type" value={manga.metadata.type} icon={Layout} />
                <StatCard label="Rating" value={manga.metadata.age_rating} icon={ShieldAlert} />
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
                <div className="w-2 h-8 bg-orange-600 rounded-full" />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Global Stats</h2>
             </div>
             <JikanEnrichmentPanel data={enrichment} loading={enrichmentLoading} />
          </section>

          <section>
            <h2 className="text-2xl font-black mb-6 italic border-l-4 border-orange-600 pl-4 uppercase tracking-tighter text-white">Synopsis</h2>
            <p className="text-zinc-400 leading-relaxed text-lg font-light whitespace-pre-wrap">
              {enrichment?.synopsis || manga.synopsis_full || manga.synopsis}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-8 italic border-l-4 border-orange-600 pl-4 uppercase tracking-tighter text-white">Chapters</h2>
            <ScrollArea.Root className="w-full h-[600px] overflow-hidden rounded-3xl bg-zinc-900/30 border border-zinc-800">
              <ScrollArea.Viewport className="w-full h-full p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {manga.chapters.map((chapter) => (
                    <Link 
                      key={chapter.slug}
                      href={`/manga/${slug}/${chapter.slug}`}
                      className="flex justify-between items-center p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-orange-500/30 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-600/10 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                          <Play className="w-3 h-3 text-orange-500 group-hover:text-white fill-orange-500 group-hover:fill-white" />
                        </div>
                        <span className="font-bold text-sm group-hover:text-orange-400 transition-colors tracking-tight text-zinc-200">{chapter.chapter}</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-600 uppercase">{chapter.date}</span>
                    </Link>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="flex select-none touch-none p-1 bg-zinc-900/10 w-2" orientation="vertical">
                <ScrollArea.Thumb className="flex-1 bg-zinc-800 rounded-full" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </section>

          <UserReviewSection mediaId={slug} theme="manga" />
        </div>

        <aside className="space-y-12">
          <section>
            <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-zinc-500">Similar Manga</h2>
            <div className="space-y-6">
              {manga.similar_manga.map((similar) => (
                <Link 
                  key={similar.slug}
                  href={`/manga/${similar.slug}`}
                  className="flex gap-4 group"
                >
                  <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-800 group-hover:border-orange-500/50 transition-all shadow-lg">
                    <img src={getHDThumbnail(similar.image)} alt={similar.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-bold text-sm leading-snug group-hover:text-orange-400 transition-colors line-clamp-2 uppercase italic text-zinc-200">{similar.title}</h3>
                    <p className="text-[10px] text-zinc-500 mt-2 line-clamp-3 leading-relaxed">{similar.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
