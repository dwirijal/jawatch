import { redirect } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { getMangaChapter } from '@/lib/adapters/comic-server';
import {
  buildComicChapterHref,
  buildComicChapterSlugFromNumber,
} from '@/lib/comic-chapter-paths';
import ComicChapterClient from './ComicChapterClient';

interface PageProps {
  params: Promise<{ slug: string; chapter?: string; chapterNumber?: string; chapterSlug?: string }>;
}

export default async function ComicChapterPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const chapterSlug = resolvedParams.chapterSlug || resolvedParams.chapter || (
    resolvedParams.chapterNumber ? buildComicChapterSlugFromNumber(slug, resolvedParams.chapterNumber) : ''
  );
  const includeNsfw = await resolveViewerNsfwAccess();

  const chapter = await getMangaChapter(chapterSlug, {
    includeNsfw,
    comicSlug: slug,
  }).catch(() => null);

  if (!chapter) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background px-8 text-white">
        <Paper tone="muted" shadow="sm" className="flex w-full max-w-xl flex-col items-center gap-4 p-12 text-center">
          <h1 className="text-2xl font-black tracking-tight text-red-500">Chapter tidak ditemukan</h1>
          <p className="text-sm text-zinc-500">Chapter ini belum bisa dibuka.</p>
          <Button variant="outline" asChild>
            <Link href={`/comics/${slug}`}>Kembali ke info</Link>
          </Button>
        </Paper>
      </div>
    );
  }

  const canonicalHref = buildComicChapterHref(chapter.manga_slug || slug, {
    slug: chapter.slug || chapterSlug,
    number: chapter.number,
  });
  const requestedHref = resolvedParams.chapterNumber
    ? `/comics/${slug}/ch/${resolvedParams.chapterNumber}`
    : resolvedParams.chapterSlug
      ? `/comics/${slug}/chapter/${resolvedParams.chapterSlug}`
      : `/comics/${slug}/chapters/${chapterSlug}`;

  if ((chapter.manga_slug && chapter.manga_slug !== slug) || canonicalHref !== requestedHref) {
    redirect(canonicalHref);
  }

  return <ComicChapterClient slug={slug} chapterSlug={chapterSlug} chapter={chapter} />;
}
