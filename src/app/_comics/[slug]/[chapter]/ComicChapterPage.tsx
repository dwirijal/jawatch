import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getMangaChapter } from '@/lib/adapters/comic-server';
import ComicChapterClient from './ComicChapterClient';

interface PageProps {
  params: Promise<{ slug: string; chapter?: string; chapterSlug?: string }>;
}

export default async function ComicChapterPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const chapterSlug = resolvedParams.chapterSlug || resolvedParams.chapter || '';
  const includeNsfw = await resolveViewerNsfwAccess();

  const chapter = await getMangaChapter(chapterSlug, {
    includeNsfw,
  }).catch(() => null);

  if (!chapter) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background px-8 text-white">
        <Paper tone="muted" shadow="sm" className="flex w-full max-w-xl flex-col items-center gap-4 p-12 text-center">
          <h1 className="text-2xl font-black tracking-tight text-red-500">Chapter not found</h1>
          <p className="text-sm text-zinc-500">This chapter could not be loaded.</p>
          <Button variant="outline" asChild>
            <Link href={`/comics/${slug}`}>Back to Info</Link>
          </Button>
        </Paper>
      </div>
    );
  }

  return <ComicChapterClient slug={slug} chapterSlug={chapterSlug} chapter={chapter} />;
}
