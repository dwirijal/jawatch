import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookOpen, Globe2, User, LibraryBig, ChevronLeft, ScrollText } from 'lucide-react';
import { getNovelDetail } from '@/lib/adapters/novel';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StatCard } from '@/components/molecules/StatCard';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { ReaderMediaDetailPage } from '@/components/organisms/ReaderMediaDetailPage';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { TitleBlock } from '@/components/atoms/TitleBlock';
import { StaticBookCoverArt } from '@/components/atoms/StaticBookCoverArt';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { buildMetadata, buildNovelDetailJsonLd } from '@/lib/seo';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function extractNovelChapterNumber(title: string): string | null {
  const normalized = title.trim();
  const match = normalized.match(/(?:chapter|ch|bab)\s*([0-9]+(?:\.[0-9]+)?)/i);
  return match?.[1] ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const novel = await getNovelDetail(slug).catch(() => null);

  if (!novel) {
    return buildMetadata({
      title: 'Novel Tidak Ditemukan',
      description: 'Novel yang kamu cari tidak tersedia di katalog dwizzyWEEB.',
      path: `/novel/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `Baca Novel ${novel.title} Bahasa Indonesia`,
    description: `${novel.synopsis} Temukan chapter terbaru ${novel.title} dan baca novel online di dwizzyWEEB.`,
    path: `/novel/${novel.slug}`,
    image: novel.poster,
    keywords: [...novel.genres.map((genre) => genre.name), novel.info.author, novel.info.country].filter(Boolean),
  });
}

export default async function NovelDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const novel = await getNovelDetail(slug).catch(() => null);

  if (!novel) {
    notFound();
  }

  const latestChapter = novel.chapters[0];

  return (
    <>
      <JsonLd
        data={buildNovelDetailJsonLd({
          title: novel.title,
          slug: novel.slug,
          poster: novel.poster,
          description: novel.synopsis,
          genres: novel.genres.map((genre) => genre.name),
          author: novel.info.author,
        })}
      />
      <ReaderMediaDetailPage
        theme="novel"
        hero={
          <section className="surface-panel-elevated relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={novel.poster || '/favicon.ico'}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-20 blur-2xl scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80" />
            </div>

            <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
              <nav className="mb-6">
                <Link href="/novel" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" /> Back to Library
                </Link>
              </nav>

              <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
                <div className="relative mx-auto aspect-[210/297] w-44 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2 hard-shadow-md md:mx-0 md:w-52">
                  <StaticBookCoverArt src={novel.poster} title={novel.title} subtitle={novel.altTitle} sizes="208px" priority />
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {novel.genres.map((genre) => (
                        <Badge key={genre.slug} variant="outline">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DeferredHeroActions title={novel.title} theme="novel" />
                    </div>
                  </div>

                  <TitleBlock title={novel.title} subtitle={novel.altTitle} eyebrow={novel.type} theme="novel" />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Author" value={novel.info.author || 'Unknown'} icon={User} />
                    <StatCard label="Status" value={novel.status || 'Unknown'} icon={LibraryBig} />
                    <StatCard label="Origin" value={novel.info.country || 'Unknown'} icon={Globe2} />
                    <StatCard label="Chapters" value={novel.info.totalChapters || String(novel.chapters.length)} icon={BookOpen} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {latestChapter ? (
                      <Button size="lg" asChild>
                        <Link href={`/novel/${slug}/read/${latestChapter.slug}`}>
                          Read Latest
                          <ScrollText className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="lg" asChild>
                      <Link href="#chapters">Browse Chapters</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        }
        sidebar={
          latestChapter ? (
            <DetailActionCard
              title="Ready to read?"
              description="Novel detail stays metadata-first, while the chapter flow stays inside the app reader."
              theme="novel"
              actions={[
                { href: `/novel/${slug}/read/${latestChapter.slug}`, label: 'Read Latest Chapter' },
                { href: '#chapters', label: 'Open Chapter Index', variant: 'outline' },
              ]}
            />
          ) : undefined
        }
      >
        <section className="space-y-8">
        <DetailSectionHeading title="Overview" theme="novel" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">{novel.synopsis}</p>
        </Paper>
      </section>

        <section className="space-y-8">
        <DetailSectionHeading title="Metadata" theme="novel" />
        <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Published" value={novel.info.published || 'Unknown'} icon={LibraryBig} />
            <StatCard label="Rating" value={novel.rating || 'Unknown'} icon={BookOpen} />
          </div>
          {novel.info.tags ? (
            <p className="text-sm leading-7 text-zinc-400">{novel.info.tags}</p>
          ) : null}
        </Paper>
      </section>

        <section id="chapters" className="space-y-8">
        <DetailSectionHeading
          title="Chapter Guide"
          theme="novel"
          aside={novel.chapters.length > 0 ? <Badge variant="outline">{novel.chapters.length} Available</Badge> : undefined}
        />

        <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            {novel.chapters.map((chapter) => (
              <Paper key={chapter.slug} asChild tone="muted" padded={false} interactive className="group overflow-hidden p-4">
                <Link href={`/novel/${slug}/read/${chapter.slug}`} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-white/10">
                    <BookOpen className="h-4 w-4 text-zinc-300" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="line-clamp-1 text-sm font-black tracking-wide text-white">{chapter.title}</p>
                      <Badge variant="outline">
                        {extractNovelChapterNumber(chapter.title) ? `Ch ${extractNovelChapterNumber(chapter.title)}` : 'Special'}
                      </Badge>
                    </div>
                    {chapter.date ? (
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">{chapter.date}</p>
                    ) : null}
                  </div>
                </Link>
              </Paper>
            ))}
          </div>
        </Paper>
        </section>
      </ReaderMediaDetailPage>
    </>
  );
}
