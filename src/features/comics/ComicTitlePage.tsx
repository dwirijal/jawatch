import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getHDThumbnail, getMangaDetail } from '@/lib/adapters/comic-server';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { PosterImageWithFallback } from '@/components/atoms/PosterImageWithFallback';
import { StatCard } from '@/components/molecules/StatCard';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs';
import { MediaTitle } from '@/components/atoms/MediaTitle';
import { TitleCommunityPanel } from '@/components/organisms/CommunityPanel';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { DetailPageScaffold } from '@/components/organisms/DetailPageScaffold';
import { User, Activity, Layout, ShieldAlert, ChevronLeft, Play } from 'lucide-react';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { isReservedComicSlug } from '@/lib/canonical-route-guards';
import { buildComicChapterHref } from '@/lib/comic-chapter-paths';
import { buildComicDetailJsonLd, buildMetadata } from '@/lib/seo';
import { resolveMediaBackgroundUrl } from '@/lib/utils';
import ComicDetailHistoryTracker from './ComicDetailHistoryTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function stripBahasaIndonesiaSuffix(value: string): string {
  return value.replace(/\s+bahasa indonesia$/i, '').trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedComicSlug(slug)) {
    return buildMetadata({
      title: 'Comic Tidak Ditemukan',
      description: 'Komik yang kamu cari tidak tersedia di katalog jawatch.',
      path: `/comics/${slug}`,
      noIndex: true,
    });
  }

  const includeNsfw = await resolveViewerNsfwAccess();
  const manga = await getMangaDetail(slug, {
    includeNsfw,
  }).catch(() => null);

  if (!manga) {
      return buildMetadata({
        title: 'Comic Tidak Ditemukan',
        description: 'Komik yang kamu cari tidak tersedia di katalog jawatch.',
        path: `/comics/${slug}`,
        noIndex: true,
      });
  }

  const image = getHDThumbnail(manga.image);
  const description = manga.synopsis_full || manga.synopsis || manga.summary;
  const title = stripBahasaIndonesiaSuffix(manga.title);

  return buildMetadata({
    title: `Baca ${title} Bahasa Indonesia`,
    description: `${description} Temukan chapter terbaru ${title} dan baca online di jawatch.`,
    path: `/comics/${manga.slug}`,
    image,
    keywords: [...manga.genres.map((genre) => genre.name), manga.metadata.type, manga.metadata.author].filter(Boolean),
  });
}

export default async function ComicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (isReservedComicSlug(slug)) {
    notFound();
  }

  const includeNsfw = await resolveViewerNsfwAccess();
  const manga = await getMangaDetail(slug, {
    includeNsfw,
  }).catch(() => null);

  if (!manga) {
    notFound();
  }

  const hdImage = getHDThumbnail(manga.image);
  const latestChapter = manga.chapters[0];
  const latestChapterHref = latestChapter ? buildComicChapterHref(manga.slug, latestChapter) : null;
  const backgroundImage = resolveMediaBackgroundUrl(manga.background, hdImage);
  const synopsis = manga.synopsis_full || manga.synopsis;

  return (
    <>
      <JsonLd
        data={buildComicDetailJsonLd({
          title: manga.title,
          slug: manga.slug,
          poster: hdImage,
          description: synopsis,
          genres: manga.genres.map((genre) => genre.name),
          author: manga.metadata.author,
        })}
      />
      <ComicDetailHistoryTracker slug={manga.slug} title={manga.title} image={hdImage} href={`/comics/${manga.slug}`} />

      <DetailPageScaffold
        theme="manga"
        desktopColumnsClassName="xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.95fr)] xl:grid-rows-1"
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Beranda', href: '/' },
              { label: 'Baca', href: '/read' },
              { label: 'Komik', href: '/read/comics' },
              { label: manga.title },
            ]}
          />
        }
        hero={
          <section className="surface-panel-elevated relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={backgroundImage}
                alt=""
                fill
                sizes="100vw"
                className="scale-105 object-cover opacity-40 blur-xl saturate-125"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--theme-manga-surface),transparent_46%)] opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-background/86 via-background/76 to-background/90" />
            </div>

            <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
              <nav className="mb-6">
                <Link href="/read/comics" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" /> Kembali ke rak
                </Link>
              </nav>

              <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
                <div className="relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2 hard-shadow-md md:mx-0 md:w-52">
                  <PosterImageWithFallback
                    src={hdImage}
                    title={manga.title}
                    sizes="208px"
                    priority
                    imageClassName="object-cover"
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
                      <DeferredHeroActions
                        title={manga.title}
                        mediaType="manga"
                        theme="manga"
                        bookmarkItem={{
                          id: slug,
                          type: 'manga',
                          title: manga.title,
                          image: hdImage,
                          timestamp: 0,
                        }}
                      />
                    </div>
                  </div>

                  <MediaTitle
                    title={manga.title}
                    subtitle={manga.title_indonesian}
                    eyebrow={manga.metadata.type}
                    theme="manga"
                    logoSrc={manga.logo}
                    logoAlt={manga.title}
                  />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Penulis" value={manga.metadata.author} icon={User} />
                    <StatCard label="Status" value={manga.metadata.status} icon={Activity} />
                    <StatCard label="Jenis" value={manga.metadata.type} icon={Layout} />
                    <StatCard label="Rating" value={manga.metadata.age_rating} icon={ShieldAlert} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {latestChapterHref ? (
                      <Button variant="manga" size="lg" asChild>
                        <Link href={latestChapterHref}>
                          Baca terbaru
                          <Play className="ml-2 h-4 w-4 fill-current" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="lg" asChild>
                      <Link href="#chapters">Lihat daftar chapter</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        }
        sidebar={
          <>
            {latestChapterHref ? (
              <DetailActionCard
                theme="manga"
                title="Mau lanjut baca?"
                description="Info komik tetap rapi, tombol baca tetap dekat saat kamu sudah siap lanjut."
                actions={[
                  { href: latestChapterHref, label: 'Baca chapter terbaru' },
                  { href: '#chapters', label: 'Buka daftar chapter', variant: 'outline' },
                ]}
              />
            ) : null}

            {manga.similar_manga.length > 0 ? (
              <section className="space-y-4">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Komik mirip</p>
                <div className="space-y-4">
                  {manga.similar_manga.map((similar) => (
                    <Paper key={similar.slug} tone="muted" shadow="sm" padded={false} asChild>
                      <Link href={`/comics/${similar.slug}`} className="group flex gap-4 p-4 transition-colors hover:bg-surface-elevated">
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
      >
        <section className="space-y-6">
          <DetailSectionHeading title="Sinopsis" theme="manga" />
          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <p className="whitespace-pre-wrap text-base leading-8 text-muted-foreground">
              {synopsis}
            </p>
          </Paper>
        </section>

        <section id="chapters" className="space-y-6">
          <DetailSectionHeading title={`Daftar chapter (${manga.chapters.length})`} theme="manga" />
          <Paper tone="muted" shadow="sm" padded={false}>
            <div className="max-h-[640px] overflow-y-auto">
              {manga.chapters.map((chapter) => (
                <Link
                  key={chapter.slug}
                  href={buildComicChapterHref(manga.slug, chapter)}
                  className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4 text-sm transition-colors hover:bg-surface-elevated last:border-b-0 md:px-6"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-100">{chapter.chapter}</p>
                    {chapter.date ? (
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {new Date(chapter.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline">Baca</Badge>
                </Link>
              ))}
            </div>
          </Paper>
        </section>

        <section id="community" className="space-y-6">
          <DetailSectionHeading title="Komentar" theme="manga" />
          <TitleCommunityPanel
            titleId={`comics:${manga.slug}`}
            titleLabel={manga.title}
            titleHref={`/comics/${manga.slug}`}
            theme="manga"
            units={manga.chapters.map((chapter) => ({
              id: `chapter:${chapter.slug}`,
              label: chapter.chapter,
              href: buildComicChapterHref(manga.slug, chapter),
            }))}
          />
        </section>
      </DetailPageScaffold>
    </>
  );
}
