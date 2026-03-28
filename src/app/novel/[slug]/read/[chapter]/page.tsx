import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, LibraryBig } from 'lucide-react';
import { getNovelDetail, getNovelRead } from '@/lib/adapters/novel';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { TextReaderScaffold } from '@/components/organisms/TextReaderScaffold';

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

function sanitizeNovelHtml(content: string): string {
  return content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export default async function NovelReadPage({ params }: PageProps) {
  const { slug, chapter } = await params;
  const [novel, reading] = await Promise.all([
    getNovelDetail(slug).catch(() => null),
    getNovelRead(chapter).catch(() => null),
  ]);

  if (!novel || !reading) {
    notFound();
  }

  const chapterIndex = novel.chapters.findIndex((entry) => entry.slug === chapter);
  const previousChapter = chapterIndex >= 0 ? novel.chapters[chapterIndex + 1] ?? null : null;
  const nextChapter = chapterIndex > 0 ? novel.chapters[chapterIndex - 1] ?? null : null;
  const sanitizedContent = sanitizeNovelHtml(reading.content);

  return (
    <TextReaderScaffold
      backHref={`/novel/${slug}`}
      title={novel.title}
      subtitle={reading.title}
      headerActions={
        <>
          <Button variant="outline" size="icon" disabled={!previousChapter} asChild={!!previousChapter} className="h-9 w-9 rounded-[var(--radius-sm)] border-border-subtle">
            {previousChapter ? (
              <Link href={`/novel/${slug}/read/${previousChapter.slug}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" disabled={!nextChapter} asChild={!!nextChapter} className="h-9 w-9 rounded-[var(--radius-sm)] border-border-subtle">
            {nextChapter ? (
              <Link href={`/novel/${slug}/read/${nextChapter.slug}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </>
      }
    >
        {sanitizedContent ? (
          <Paper tone="muted" shadow="sm" className="p-6 md:p-8">
            <article
              className="[&_h1]:mb-6 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:mb-5 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_p]:mb-5 [&_p]:text-base [&_p]:leading-8 [&_strong]:font-black [&_ul]:mb-5 [&_ul]:pl-5 [&_li]:mb-2"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </Paper>
        ) : (
          <StateInfo
            title="Chapter unavailable"
            description="This chapter could not be rendered from the upstream source."
          />
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Paper tone="muted" shadow="sm" className="p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Type</p>
            <p className="mt-2 text-sm font-bold text-zinc-100">{novel.type || 'Novel'}</p>
          </Paper>
          <Paper tone="muted" shadow="sm" className="p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Chapter Library</p>
            <Link href={`/novel/${slug}#chapters`} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-100 hover:text-white">
              <LibraryBig className="h-4 w-4" />
              Browse all chapters
            </Link>
          </Paper>
        </div>
    </TextReaderScaffold>
  );
}
