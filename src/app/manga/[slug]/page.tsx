'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { getMangaDetail, getHDThumbnail, getJikanEnrichment } from '@/lib/adapters/comic';
import { saveRecentManga } from '@/lib/store';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea } from '@/components/atoms/ScrollArea';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CircularLoader } from '@/components/atoms/CircularLoader';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { TitleBlock } from '@/components/atoms/TitleBlock';
import { ReaderMediaDetailPage } from '@/components/organisms/ReaderMediaDetailPage';
import { MetadataPanel } from '@/components/organisms/MetadataPanel';
import { User, Activity, Layout, ShieldAlert, ChevronLeft, Play } from 'lucide-react';
import type { JikanEnrichment, MangaDetail } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MangaDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
          lastReadAt: Date.now(),
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  useEffect(() => {
    const mangaTitle = manga?.title ?? '';
    if (!mangaTitle) return;

    let cancelled = false;
    async function fetchEnrichment() {
      setEnrichmentLoading(true);
      try {
        const data = await getJikanEnrichment('manga', mangaTitle);
        if (!cancelled) setEnrichment(data);
      } catch {
        if (!cancelled) setEnrichment(null);
      } finally {
        if (!cancelled) setEnrichmentLoading(false);
      }
    }
    fetchEnrichment();
    return () => {
      cancelled = true;
    };
  }, [manga?.title]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <CircularLoader theme="manga" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <Paper tone="muted" shadow="sm" className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-black tracking-tight text-red-500">Manga tidak ditemukan</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Detail manga ini belum tersedia atau slug yang kamu buka sudah tidak valid.
          </p>
          <Button variant="manga" asChild>
            <Link href="/manga">Kembali ke Library</Link>
          </Button>
        </Paper>
      </div>
    );
  }

  const hdImage = getHDThumbnail(manga.image);
  const latestChapter = manga.chapters[0];

  return (
    <ReaderMediaDetailPage
      theme="manga"
      hero={
        <section className="surface-panel-elevated relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={hdImage || '/favicon.ico'}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-25 blur-2xl scale-110"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80" />
          </div>

          <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
            <nav className="mb-6">
              <Link href="/manga" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground">
                <ChevronLeft className="h-4 w-4" /> Back to Library
              </Link>
            </nav>

            <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
              <div className="relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2 hard-shadow-md md:mx-0 md:w-52">
                <Image
                  src={hdImage || '/favicon.ico'}
                  alt={manga.title}
                  fill
                  sizes="208px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {manga.genres.map((genre) => (
                      <Badge key={genre.slug} variant="manga">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShareButton title={manga.title} theme="manga" />
                    <BookmarkButton
                      item={{
                        id: slug,
                        type: 'manga',
                        title: manga.title,
                        image: hdImage,
                        timestamp: Date.now(),
                      }}
                      theme="manga"
                    />
                  </div>
                </div>

                <TitleBlock
                  title={manga.title}
                  subtitle={manga.title_indonesian}
                  eyebrow={manga.metadata.type}
                  theme="manga"
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Author" value={manga.metadata.author} icon={User} />
                  <StatCard label="Status" value={manga.metadata.status} icon={Activity} />
                  <StatCard label="Type" value={manga.metadata.type} icon={Layout} />
                  <StatCard label="Rating" value={manga.metadata.age_rating} icon={ShieldAlert} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {latestChapter ? (
                    <Button variant="manga" size="lg" asChild>
                      <Link href={`/manga/${slug}/${latestChapter.slug}`}>
                        Read Latest
                        <Play className="ml-2 h-4 w-4 fill-current" />
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
        <>
          {latestChapter ? (
            <DetailActionCard
              theme="manga"
              title="Ready to read?"
              description="Halaman manga tetap metadata-first, tapi aksi membaca tetap dekat dan mudah dijangkau."
              actions={[
                { href: `/manga/${slug}/${latestChapter.slug}`, label: 'Read Latest Chapter' },
                { href: '#chapters', label: 'Open Chapter Index', variant: 'outline' },
              ]}
            />
          ) : null}

          {manga.similar_manga.length > 0 ? (
            <section className="space-y-4">
              <p className="px-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Similar Manga</p>
              <div className="space-y-4">
                {manga.similar_manga.map((similar) => (
                  <Paper key={similar.slug} tone="muted" shadow="sm" padded={false} asChild>
                    <Link href={`/manga/${similar.slug}`} className="group flex gap-4 p-4 transition-colors hover:bg-surface-elevated">
                      <div className="relative aspect-[3/4] w-24 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 transition-all group-hover:border-white/20">
                        <Image
                          src={getHDThumbnail(similar.image) || '/favicon.ico'}
                          alt={similar.title}
                          fill
                          sizes="96px"
                          className="object-cover transition-transform group-hover:scale-110"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 py-1">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-100 transition-colors group-hover:text-white">
                          {similar.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">{similar.description}</p>
                      </div>
                    </Link>
                  </Paper>
                ))}
              </div>
            </section>
          ) : null}
        </>
      }
      footer={<CommunityCTA mediaId={slug} title={manga.title} type="manga" theme="manga" />}
    >
      {(enrichmentLoading || enrichment) ? (
        <section className="space-y-6">
          <DetailSectionHeading title="Global Stats" theme="manga" />
          <MetadataPanel data={enrichment} loading={enrichmentLoading} />
        </section>
      ) : null}

      <section className="space-y-6">
        <DetailSectionHeading title="Synopsis" theme="manga" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="whitespace-pre-wrap text-base leading-8 text-muted-foreground">
            {enrichment?.synopsis || manga.synopsis_full || manga.synopsis}
          </p>
        </Paper>
      </section>

      <section id="chapters" className="space-y-6">
        <DetailSectionHeading
          title="Chapters"
          theme="manga"
          aside={<Badge variant="outline">{manga.chapters.length} Entries</Badge>}
        />
        <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
          <ScrollArea className="h-[600px] w-full">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:p-5">
              {manga.chapters.map((chapter) => (
                <Link
                  key={chapter.slug}
                  href={`/manga/${slug}/${chapter.slug}`}
                  className="group flex items-center justify-between rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 p-4 transition-all hover:bg-surface-elevated hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/10 transition-colors group-hover:bg-orange-600">
                      <Play className="h-3 w-3 fill-orange-500 text-orange-500 group-hover:fill-white group-hover:text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-zinc-100 transition-colors group-hover:text-white">
                      {chapter.chapter}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-zinc-600">{chapter.date}</span>
                </Link>
                ))}
            </div>
          </ScrollArea>
        </Paper>
      </section>
    </ReaderMediaDetailPage>
  );
}
