'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { DeferredAds } from '@/components/atoms/DeferredAds';
import { ReaderPageImage } from '@/components/atoms/ReaderPageImage';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { UnitCommunityPanel } from '@/components/organisms/CommunityPanel';
import { DeferredReadingSettings } from '@/components/molecules/DeferredReadingSettings';
import { ImageReaderScaffold } from '@/components/organisms/ImageReaderScaffold';
import { useUIStore } from '@/store/useUIStore';
import { buildComicChapterHref } from '@/lib/comic-chapter-paths';
import type { ChapterDetail } from '@/lib/types';
import ComicChapterHistoryTracker from './ComicChapterHistoryTracker';

interface ComicChapterClientProps {
  slug: string;
  chapterSlug: string;
  chapter: ChapterDetail;
  routeBase?: string;
}

function extractChapterRouteInput(value?: string | null): { slug?: string; number?: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const segments = trimmed.split('/').filter(Boolean);

  if (!segments.length) {
    return { slug: trimmed };
  }

  const chapterNumberIndex = segments.lastIndexOf('ch');
  if (chapterNumberIndex >= 0) {
    const number = segments[chapterNumberIndex + 1];
    return number ? { number } : null;
  }

  const chapterSlugIndex = segments.lastIndexOf('chapter');
  if (chapterSlugIndex >= 0) {
    const slug = segments[chapterSlugIndex + 1];
    return slug ? { slug } : null;
  }

  return { slug: segments.at(-1) ?? trimmed };
}

function buildChapterHref(
  slug: string,
  navigation: ChapterDetail['navigation'],
  direction: 'next' | 'prev',
): string | null {
  const chapter =
    direction === 'next'
      ? extractChapterRouteInput(navigation.nextChapter ?? navigation.next)
      : extractChapterRouteInput(navigation.previousChapter ?? navigation.prev);

  return chapter ? buildComicChapterHref(slug, chapter) : null;
}

export default function ComicChapterClient({ slug, chapterSlug, chapter, routeBase = '/comics' }: ComicChapterClientProps) {
  const [autoNext, setAutoNext] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { readerWidth } = useUIStore();
  const router = useRouter();
  const endSentinelRef = useRef<HTMLDivElement | null>(null);
  const currentChapterHref = buildComicChapterHref(chapter.manga_slug || slug, {
    slug: chapter.slug || chapterSlug,
    number: chapter.number,
  });

  const previousChapterHref = useMemo(
    () => buildChapterHref(slug, chapter.navigation, 'prev'),
    [chapter.navigation, slug]
  );

  const nextChapterHref = useMemo(
    () => buildChapterHref(slug, chapter.navigation, 'next'),
    [chapter.navigation, slug]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && nextChapterHref) {
        router.push(nextChapterHref);
      } else if (event.key === 'ArrowLeft' && previousChapterHref) {
        router.push(previousChapterHref);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextChapterHref, previousChapterHref, router]);

  useEffect(() => {
    if (!autoNext || !nextChapterHref || !endSentinelRef.current) {
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
      setIsAdvancing(false);
      observer.disconnect();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [autoNext, nextChapterHref, router]);

  return (
    <>
      <ComicChapterHistoryTracker
        slug={slug}
        title={chapter.manga_title || chapter.title}
        image=""
        href={currentChapterHref}
        chapterLabel={chapter.chapter_title || chapterSlug}
      />

      <ImageReaderScaffold
        backHref={`${routeBase}/${slug}`}
        title={chapter.manga_title || chapter.title}
        subtitle={chapter.chapter_title || chapterSlug}
        leftAside={
          <div className="sticky top-24">
            <DeferredAds type="vertical" className="h-[560px] max-w-none" />
          </div>
        }
        rightAside={
          <div className="sticky top-24">
            <DeferredAds type="vertical" className="h-[560px] max-w-none" />
          </div>
        }
        headerActions={
          <>
            <Button
              variant="outline"
              size="icon"
              disabled={!previousChapterHref}
              asChild={!!previousChapterHref}
              className="h-11 w-11 rounded-[var(--radius-sm)] border-border-subtle"
            >
              {previousChapterHref ? (
                <Link href={previousChapterHref}><ChevronLeft className="h-4 w-4" /></Link>
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            <DeferredReadingSettings autoNext={autoNext} setAutoNext={setAutoNext} />

            <Button
              variant="manga"
              size="icon"
              disabled={!nextChapterHref}
              asChild={!!nextChapterHref}
              className="h-11 w-11 rounded-[var(--radius-sm)]"
            >
              {nextChapterHref ? (
                <Link href={nextChapterHref}><ChevronRight className="h-4 w-4" /></Link>
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </>
        }
      >
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
                  <ReaderPageImage
                    key={`${url}-${index}`}
                    src={url}
                    index={index}
                    loading={index < 3 ? 'eager' : 'lazy'}
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
                    <Link href={`${routeBase}/${slug}`}>
                      <LayoutGrid className="mr-2 h-4 w-4" /> Back to library
                    </Link>
                  </Button>
                )}
              </div>
            </Paper>

            <div className="mt-6">
              <UnitCommunityPanel
                titleId={`comics:${slug}`}
                titleLabel={chapter.manga_title || chapter.title}
                unitId={`chapter:${chapterSlug}`}
                unitLabel={chapter.chapter_title || chapterSlug}
                unitHref={currentChapterHref}
                mediaType="manga"
                theme="manga"
              />
            </div>
          </div>
        </div>
      </ImageReaderScaffold>
    </>
  );
}
