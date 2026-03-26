'use client';

import { useEffect, useMemo, useRef, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getMangaChapter, ChapterDetail } from "@/lib/api";
import { saveHistory } from "@/lib/store";
import { ChevronLeft, ChevronRight, LayoutGrid, ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Link } from "@/components/atoms/Link";
import { Ads } from "@/components/atoms/Ads";
import { Paper } from "@/components/atoms/Paper";
import { ReadingSettings } from "@/components/molecules/ReadingSettings";
import { StateInfo } from "@/components/molecules/StateInfo";
import { useUIStore } from "@/store/useUIStore";
import { CircularLoader } from "@/components/atoms/CircularLoader";

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

function extractChapterSegment(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.includes('/')) return trimmed;
  const segments = trimmed.split('/').filter(Boolean);
  return segments.at(-1) ?? null;
}

function buildChapterHref(slug: string, navigation: ChapterDetail['navigation'], direction: 'next' | 'prev'): string | null {
  const segment =
    direction === 'next'
      ? extractChapterSegment(navigation.nextChapter ?? navigation.next)
      : extractChapterSegment(navigation.previousChapter ?? navigation.prev);

  return segment ? `/manga/${slug}/${segment}` : null;
}

export default function ChapterPage({ params }: PageProps) {
  const { slug, chapter: chapterSlug } = use(params);
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { readerWidth } = useUIStore();
  const router = useRouter();
  const endSentinelRef = useRef<HTMLDivElement | null>(null);

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

  const previousChapterHref = useMemo(
    () => (chapter ? buildChapterHref(slug, chapter.navigation, 'prev') : null),
    [chapter, slug]
  );

  const nextChapterHref = useMemo(
    () => (chapter ? buildChapterHref(slug, chapter.navigation, 'next') : null),
    [chapter, slug]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!chapter) return;
      if (e.key === 'ArrowRight' && nextChapterHref) {
        router.push(nextChapterHref);
      } else if (e.key === 'ArrowLeft' && previousChapterHref) {
        router.push(previousChapterHref);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapter, nextChapterHref, previousChapterHref, router]);

  useEffect(() => {
    if (!autoNext || !nextChapterHref || !endSentinelRef.current) {
      setIsAdvancing(false);
      return;
    }

    let timeoutId: number | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsAdvancing(true);
          timeoutId = window.setTimeout(() => {
            router.push(nextChapterHref);
          }, 1800);
        } else {
          setIsAdvancing(false);
          if (timeoutId) {
            window.clearTimeout(timeoutId);
            timeoutId = null;
          }
        }
      },
      { threshold: 0.9 }
    );

    observer.observe(endSentinelRef.current);

    return () => {
      observer.disconnect();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [autoNext, nextChapterHref, router]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background px-6 text-white">
        <Paper as="div" tone="muted" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300">
          <CircularLoader theme="manga" text="Loading pages" />
        </Paper>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background px-8 text-white">
        <StateInfo
          type="error"
          title="Chapter not found"
          description="This chapter could not be loaded."
          actionLabel="Back to Info"
          onAction={() => router.push(`/manga/${slug}`)}
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="app-shell bg-background text-white">
      <header className="sticky top-0 z-[160] border-b border-border-subtle bg-surface-1/95 backdrop-blur-xl transition-all">
        <div className="app-container flex items-center justify-between gap-3 py-2.5 sm:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1">
              <Link href={`/manga/${slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="line-clamp-1 text-sm font-semibold tracking-tight text-white md:text-base">
                {chapter.manga_title || chapter.title}
              </h1>
              <p className="text-xs text-zinc-500">
                {chapter.chapter_title || chapterSlug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={!previousChapterHref}
              asChild={!!previousChapterHref}
              className="h-9 w-9 rounded-[var(--radius-sm)] border-border-subtle"
            >
              {previousChapterHref ? (
                <Link href={previousChapterHref}><ChevronLeft className="h-4 w-4" /></Link>
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            <ReadingSettings autoNext={autoNext} setAutoNext={setAutoNext} />

            <Button 
              variant="manga" 
              size="icon" 
              disabled={!nextChapterHref}
              asChild={!!nextChapterHref}
              className="h-9 w-9 rounded-[var(--radius-sm)]"
            >
              {nextChapterHref ? (
                <Link href={nextChapterHref}><ChevronRight className="h-4 w-4" /></Link>
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="app-container-wide min-h-screen py-5 md:py-7">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(150px,190px)_minmax(0,1fr)_minmax(150px,190px)] xl:gap-6">
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <Ads type="vertical" className="h-[560px] max-w-none" />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col items-center">
            <div
              className="w-full transition-all duration-500 ease-in-out"
              style={{
                width: `${readerWidth}%`,
                maxWidth: readerWidth === 100 ? 'min(100%, var(--layout-max-wide))' : 'min(100%, var(--layout-max))',
              }}
            >
              <Paper tone="muted" shadow="md" padded={false} className="overflow-hidden">
                <div className="flex flex-col gap-0">
                  {chapter.images.map((url: string, index: number) => (
                    <Image
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Page ${index + 1}`}
                      width={1200}
                      height={1700}
                      sizes="(max-width: 1200px) 100vw, 1200px"
                      className="w-full h-auto select-none"
                      unoptimized
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                  ))}
                </div>

                <div className="flex flex-col items-center gap-4 border-t border-border-subtle bg-surface-2 px-5 py-8 text-center md:gap-5 md:px-8 md:py-10">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold tracking-tight text-zinc-300">End of chapter</h3>
                    <p className="text-sm text-zinc-500">
                      {nextChapterHref && autoNext ? 'Preparing the next chapter.' : 'You have reached the latest page.'}
                    </p>
                  </div>

                  <div ref={endSentinelRef} className="h-px w-full" />

                  {nextChapterHref ? (
                    <>
                      {autoNext ? (
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                          {isAdvancing ? 'Auto next in progress' : 'Auto next armed'}
                        </p>
                      ) : null}
                      <Button
                        variant="manga"
                        size="lg"
                        className="group h-12 rounded-[var(--radius-sm)] px-6 text-base"
                        asChild
                      >
                        <Link href={nextChapterHref}>
                          Next chapter <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="lg" className="h-12 rounded-[var(--radius-sm)] border-border-subtle px-6 text-zinc-400" asChild>
                      <Link href={`/manga/${slug}`}>
                        <LayoutGrid className="mr-2 h-4 w-4" /> Back to library
                      </Link>
                    </Button>
                  )}
                </div>
              </Paper>
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <Ads type="vertical" className="h-[560px] max-w-none" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
