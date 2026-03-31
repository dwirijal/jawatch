import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { getMangaChapter } from '@/lib/adapters/comic-server';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import ComicChapterClient from './ComicChapterClient';

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

export default async function ComicChapterPage({ params }: PageProps) {
  const { slug, chapter: chapterSlug } = await params;
  const session = await getServerAuthStatus();

  const chapter = await getMangaChapter(chapterSlug, {
    includeNsfw: session.authenticated,
  }).catch(() => null);

  if (!chapter) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background px-8 text-white">
        <Paper tone="muted" shadow="sm" className="flex w-full max-w-xl flex-col items-center gap-4 p-12 text-center">
          <h1 className="text-2xl font-black tracking-tight text-red-500">Chapter not found</h1>
          <p className="text-sm text-zinc-500">This chapter could not be loaded.</p>
          <Button variant="outline" asChild>
            <Link href={`/comic/${slug}`}>Back to Info</Link>
          </Button>
        </Paper>
      </div>
    );
  }

  return <ComicChapterClient slug={slug} chapterSlug={chapterSlug} chapter={chapter} />;
}
