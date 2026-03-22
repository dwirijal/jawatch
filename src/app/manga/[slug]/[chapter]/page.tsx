'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMangaChapter, ChapterDetail } from "@/lib/api";
import { saveHistory } from "@/lib/store";
import { ChevronLeft, ChevronRight, LayoutGrid, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ReadingSettings } from "@/components/molecules/ReadingSettings";
import { useUIStore } from "@/store/useUIStore";
import { CircularLoader } from "@/components/atoms/CircularLoader";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

export default function ChapterPage({ params }: PageProps) {
  const { slug, chapter: chapterSlug } = use(params);
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const { readerWidth } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMangaChapter(chapterSlug);
        setChapter(data);
        
        saveHistory({
          id: slug,
          type: 'manga',
          title: data.manga_title || data.title,
          image: '', 
          lastChapterOrEpisode: data.chapter_title || chapterSlug,
          lastLink: `/manga/${slug}/${chapterSlug}`,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, chapterSlug]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!chapter) return;
      if (e.key === 'ArrowRight' && chapter.navigation.nextChapter) {
        router.push(`/manga/${slug}/${chapter.navigation.nextChapter}`);
      } else if (e.key === 'ArrowLeft' && chapter.navigation.previousChapter) {
        router.push(`/manga/${slug}/${chapter.navigation.previousChapter}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapter, router, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <CircularLoader theme="manga" text=" • READING • PREPARING PAGES • " />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-black text-orange-500 uppercase italic">Chapter not found</h1>
        <Button variant="manga" className="mt-6" asChild>
          <Link href={`/manga/${slug}`}>Back to Info</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Immersive Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 p-4 sticky top-0 z-[160] transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
              <Link href={`/manga/${slug}`}>
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-black line-clamp-1 uppercase italic text-white">
                {chapter.manga_title || chapter.title}
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{chapter.chapter_title || chapterSlug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={!chapter.navigation.previousChapter}
              asChild={!!chapter.navigation.previousChapter}
              className="rounded-xl border-zinc-800 h-10 w-10"
            >
              {chapter.navigation.previousChapter ? (
                <Link href={`/manga/${slug}/${chapter.navigation.previousChapter}`}><ChevronLeft className="w-5 h-5" /></Link>
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className={cn("rounded-xl h-10 w-10", showSettings && "bg-orange-600 text-white")}>
              <Settings className="w-5 h-5" />
            </Button>

            <Button 
              variant="manga" 
              size="icon" 
              disabled={!chapter.navigation.nextChapter}
              asChild={!!chapter.navigation.nextChapter}
              className="rounded-xl h-10 w-10"
            >
              {chapter.navigation.nextChapter ? (
                <Link href={`/manga/${slug}/${chapter.navigation.nextChapter}`}><ChevronRight className="w-5 h-5" /></Link>
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed top-24 right-8 z-[170] animate-in fade-in slide-in-from-top-4">
          <ReadingSettings autoNext={autoNext} setAutoNext={setAutoNext} />
        </div>
      )}

      {/* Reader Area */}
      <main className="flex flex-col items-center bg-black py-8 min-h-screen">
        <div 
          className="transition-all duration-500 ease-in-out px-4"
          style={{ width: `${readerWidth}%`, maxWidth: readerWidth === 100 ? '100%' : '1200px' }}
        >
          <div className="flex flex-col gap-0 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            {chapter.images.map((url: string, index: number) => (
              <img 
                key={index}
                src={url}
                alt={`Page ${index + 1}`}
                className="w-full h-auto select-none"
                loading={index < 3 ? "eager" : "lazy"}
              />
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="mt-20 py-20 border-t border-zinc-900 flex flex-col items-center gap-8 text-center">
            <div className="space-y-2">
               <h3 className="text-2xl font-black italic uppercase text-zinc-500">End of Chapter</h3>
               <p className="text-zinc-700 text-sm font-bold uppercase tracking-widest">You have reached the latest page.</p>
            </div>

            {chapter.navigation.nextChapter ? (
              <Button 
                variant="manga" 
                size="lg" 
                className="rounded-2xl px-12 h-16 text-lg group"
                asChild
              >
                <Link href={`/manga/${slug}/${chapter.navigation.nextChapter}`}>
                  Next Chapter <ChevronRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="rounded-2xl px-12 h-16 text-zinc-500 border-zinc-800" asChild>
                <Link href={`/manga/${slug}`}>
                  <LayoutGrid className="mr-2 w-5 h-5" /> Back to Library
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
