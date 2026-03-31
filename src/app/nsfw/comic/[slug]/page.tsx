import Image from 'next/image';
import { Activity, ChevronLeft, Layout, Play, ShieldAlert, User } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { TitleBlock } from '@/components/atoms/TitleBlock';
import ComicDetailHistoryTracker from '@/app/comic/[slug]/ComicDetailHistoryTracker';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { ShareButton } from '@/components/molecules/ShareButton';
import { StatCard } from '@/components/molecules/StatCard';
import { MetadataPanel } from '@/components/organisms/MetadataPanel';
import { ReaderMediaDetailPage } from '@/components/organisms/ReaderMediaDetailPage';
import { getHDThumbnail, getJikanEnrichment, getMangaDetail } from '@/lib/adapters/comic-server';
import { getNsfwComicChapterHref, getNsfwComicDetailHref } from '@/lib/nsfw-routes';
import { requireNsfwAccess } from '../../access';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NsfwComicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  await requireNsfwAccess(getNsfwComicDetailHref(slug));

  const manga = await getMangaDetail(slug, {
    includeNsfw: true,
  }).catch(() => null);

  if (!manga) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <Paper tone="muted" shadow="sm" className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-black tracking-tight text-red-500">Comic tidak ditemukan</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Detail comic ini belum tersedia atau slug yang kamu buka sudah tidak valid.
          </p>
          <Button variant="manga" asChild>
            <Link href="/nsfw#comics">Kembali ke NSFW</Link>
          </Button>
        </Paper>
      </div>
    );
  }

  const enrichment = await getJikanEnrichment('manga', manga.title).catch(() => null);
  const hdImage = getHDThumbnail(manga.image);
  const latestChapter = manga.chapters[0];

  return (
    <>
      <ComicDetailHistoryTracker slug={manga.slug} title={manga.title} image={hdImage} href={getNsfwComicDetailHref(manga.slug)} />

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
                className="scale-110 object-cover opacity-25 blur-2xl"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80" />
            </div>

            <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
              <nav className="mb-6">
                <Link href="/nsfw#comics" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" /> Back to NSFW
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
                        <Link href={getNsfwComicChapterHref(slug, latestChapter.slug)}>
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
                description="Reader NSFW ini tetap terisolasi dari surface comic biasa."
                actions={[
                  { href: getNsfwComicChapterHref(slug, latestChapter.slug), label: 'Read Latest Chapter' },
                  { href: '#chapters', label: 'Open Chapter Index', variant: 'outline' },
                ]}
              />
            ) : null}

            {manga.similar_manga.length > 0 ? (
              <section className="space-y-4">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Similar Comics</p>
                <div className="space-y-4">
                  {manga.similar_manga.map((similar) => (
                    <Paper key={similar.slug} tone="muted" shadow="sm" padded={false} asChild>
                      <Link href={getNsfwComicDetailHref(similar.slug)} className="group flex gap-4 p-4 transition-colors hover:bg-surface-elevated">
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
        footer={<CommunityCTA mediaId={`nsfw:${slug}`} title={manga.title} type="manga" theme="manga" />}
      >
        {enrichment ? (
          <section className="space-y-6">
            <DetailSectionHeading title="Global Stats" theme="manga" />
            <MetadataPanel data={enrichment} loading={false} />
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
          <DetailSectionHeading title={`Chapter Index (${manga.chapters.length})`} theme="manga" />
          <Paper tone="muted" shadow="sm" padded={false}>
            <div className="max-h-[640px] overflow-y-auto">
              {manga.chapters.map((chapter, index) => (
                <Link
                  key={chapter.slug}
                  href={getNsfwComicChapterHref(slug, chapter.slug)}
                  className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4 text-sm transition-colors hover:bg-surface-elevated last:border-b-0 md:px-6"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-100">{chapter.chapter}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Chapter {manga.chapters.length - index}
                    </p>
                  </div>
                  <Badge variant="outline">Read</Badge>
                </Link>
              ))}
            </div>
          </Paper>
        </section>
      </ReaderMediaDetailPage>
    </>
  );
}
