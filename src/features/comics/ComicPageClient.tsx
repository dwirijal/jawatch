'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  extractSlugFromUrl,
  filterMangaBySubtype,
  getHDThumbnail,
  getMangaByGenre,
  getNewManga,
  getPopularManga,
} from "@/lib/adapters/comic";
import { incrementInterest } from '@/lib/store';
import { BookOpen, Play, Sparkles } from "lucide-react";
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { MediaCard } from "@/components/atoms/Card";
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { MediaHubTemplate, type MediaHubHero } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { GenreFilter } from '@/components/molecules/GenreFilter';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { formatComicCardSubtitle, getComicCardBadgeText } from '@/lib/card-presentation';
import { buildComicFilterHref, COMIC_FILTER_SEGMENTS, READ_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

const COMMON_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai", "Mystery", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports"
];
const COMIC_HUB_ASSETS = {
  all: '/Manga.png',
  manga: '/Manga.png',
  manhwa: '/Manhwa.png',
  manhua: '/Manhua.png',
  latest: '/New%20Release.png',
  popular: '/Popular.png',
  schedule: '/Schedule.png',
} as const;

interface ComicPageClientProps {
  variant: MangaSubtype | 'all';
  routeBase?: '/comics';
  initialPopular: MangaSearchResult[];
  initialNewest: MangaSearchResult[];
  subtypePosters?: Partial<Record<MangaSubtype, string>>;
}

type ComicPageClientFromSearchParamsProps = Omit<ComicPageClientProps, 'variant'> & {
  fallbackVariant?: MangaSubtype | 'all';
};

const VARIANT_CONFIG: Record<MangaSubtype | 'all', {
  title: string;
  description: string;
  savedTitle: string;
  trendingTitle: string;
  trendingSubtitle: string;
  newestTitle: string;
  newestSubtitle: string;
  browseSubtitle?: string;
}> = {
  manga: {
    title: "Rak Komik: Manga",
    description: "Buka manga pilihan, terbaru, dan yang lagi ramai dibaca.",
    savedTitle: "Komik tersimpan",
    trendingTitle: "Manga lagi ramai",
    trendingSubtitle: "Paling sering dibuka minggu ini",
    newestTitle: "Manga baru update",
    newestSubtitle: "Manga yang baru masuk atau diperbarui",
  },
  all: {
    title: "Rak Komik",
    description: "Pilih manga, manhwa, dan manhua dari satu rak baca yang rapi.",
    savedTitle: "Komik tersimpan",
    trendingTitle: "Komik lagi ramai",
    trendingSubtitle: "Manga, manhwa, dan manhua yang paling sering dibuka",
    newestTitle: "Baru update",
    newestSubtitle: "Komik yang baru masuk atau baru diperbarui",
    browseSubtitle: "Pilih manga, manhwa, atau manhua tanpa keluar dari rak komik.",
  },
  manhwa: {
    title: "Rak Komik: Manhwa",
    description: "Buka manhwa pilihan, terbaru, dan yang lagi ramai dibaca.",
    savedTitle: "Komik tersimpan",
    trendingTitle: "Manhwa lagi ramai",
    trendingSubtitle: "Paling sering dibuka minggu ini",
    newestTitle: "Manhwa baru update",
    newestSubtitle: "Manhwa yang baru masuk atau diperbarui",
  },
  manhua: {
    title: "Rak Komik: Manhua",
    description: "Buka manhua pilihan, terbaru, dan yang lagi ramai dibaca.",
    savedTitle: "Komik tersimpan",
    trendingTitle: "Manhua lagi ramai",
    trendingSubtitle: "Paling sering dibuka minggu ini",
    newestTitle: "Manhua baru update",
    newestSubtitle: "Manhua yang baru masuk atau diperbarui",
  },
};

function toSubtypeItems(items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] {
  return filterMangaBySubtype(items, subtype);
}

function normalizeComicVariant(value?: string | null): MangaSubtype | 'all' {
  switch ((value || '').trim().toLowerCase()) {
    case 'manga':
      return 'manga';
    case 'manhwa':
      return 'manhwa';
    case 'manhua':
      return 'manhua';
    default:
      return 'all';
  }
}

function buildItemHref(routeBase: string, item: MangaSearchResult): string {
  return `${routeBase}/${extractSlugFromUrl(item.link)}`;
}

function getComicHeroFallback(variant: MangaSubtype | 'all'): string {
  if (variant === 'manhwa') {
    return COMIC_HUB_ASSETS.manhwa;
  }
  if (variant === 'manhua') {
    return COMIC_HUB_ASSETS.manhua;
  }
  if (variant === 'manga') {
    return COMIC_HUB_ASSETS.manga;
  }
  return COMIC_HUB_ASSETS.all;
}

function getCompactComicHeroTitle(title: string | undefined, fallback: string): string {
  const normalized = title?.trim();
  if (!normalized) {
    return fallback;
  }

  if (normalized.length <= 42) {
    return normalized;
  }

  const candidate = normalized.slice(0, 40).trimEnd();
  const safeCut = candidate.lastIndexOf(' ');
  const shortened = safeCut > 20 ? candidate.slice(0, safeCut) : candidate;
  return `${shortened.trimEnd()}…`;
}

export default function ComicPageClient({
  variant,
  routeBase = '/comics',
  initialPopular,
  initialNewest,
  subtypePosters = {},
}: ComicPageClientProps) {
  const config = VARIANT_CONFIG[variant];
  const isAllVariant = variant === 'all';
  const eyebrow = isAllVariant
    ? 'Rak komik'
    : `Rak ${config.title.split(': ')[1] ?? 'komik'}`;
  const [results, setResults] = React.useState<MangaSearchResult[] | null>(null);
  const [popular, setPopular] = React.useState(() => {
    if (isAllVariant) {
      return initialPopular;
    }

    const subtypePopular = toSubtypeItems(initialPopular, variant);
    if (subtypePopular.length > 0 || variant === 'manga') {
      return subtypePopular;
    }
    return toSubtypeItems(initialNewest, variant);
  });
  const [newest, setNewest] = React.useState(() => (isAllVariant ? initialNewest : toSubtypeItems(initialNewest, variant)));
  const [loading, setLoading] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(popular.length === 0 || newest.length === 0);
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null);
  const spotlightComic = newest[0] ?? popular[0] ?? initialNewest[0] ?? initialPopular[0] ?? null;
  const spotlightBadges = React.useMemo(() => {
    if (!spotlightComic) {
      return isAllVariant ? [] : [variant.toUpperCase()];
    }

    const badges = [
      getComicCardBadgeText(spotlightComic),
      ...spotlightComic.genre.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 2),
    ];
    return Array.from(new Set(badges)).slice(0, 3);
  }, [isAllVariant, spotlightComic, variant]);
  const heroTitle = React.useMemo(
    () => getCompactComicHeroTitle(spotlightComic?.title, config.title),
    [config.title, spotlightComic?.title],
  );
  const heroDescription = isAllVariant
    ? 'Manga, manhwa, dan manhua terbaru siap kamu pilih dari sini.'
    : `Sorotan ${variant} terbaru buat kamu yang mau langsung baca.`;
  const comicHero = React.useMemo<MediaHubHero>(() => ({
    title: heroTitle,
    description: heroDescription,
    label: isAllVariant ? 'Pilihan komik' : `Sorotan ${variant}`,
    meta: [
      spotlightComic ? getComicCardBadgeText(spotlightComic) : isAllVariant ? 'COMIC' : variant.toUpperCase(),
      formatComicCardSubtitle(spotlightComic || { chapter: undefined, time_ago: undefined }),
    ].filter(Boolean).join(' • '),
    image: spotlightComic?.background
      ? getHDThumbnail(spotlightComic.background)
      : (spotlightComic ? getHDThumbnail(spotlightComic.image) : getComicHeroFallback(variant)),
    imageAlt: spotlightComic?.title || config.title,
    logo: spotlightComic?.logo,
    logoAlt: spotlightComic?.title || config.title,
    useLogo: false,
    badges: spotlightBadges,
    actions: spotlightComic ? (
      <>
        <Button
          variant="manga"
          className="h-11 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_26px_68px_-30px_rgba(199,154,99,0.72)] md:h-12 md:px-5 md:text-sm"
          asChild
        >
          <Link href={buildItemHref(routeBase, spotlightComic)}>
            <Play className="h-4 w-4 fill-current" /> Baca sekarang
          </Link>
        </Button>
        <BookmarkButton
          theme="manga"
          className="h-11 whitespace-nowrap rounded-full border-white/16 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-white/18 md:h-12 md:px-5 md:text-sm"
          saveLabel="Simpan ke rak"
          item={{
            id: extractSlugFromUrl(spotlightComic.link),
            type: 'manga',
            title: spotlightComic.title,
            image: getHDThumbnail(spotlightComic.image),
            timestamp: 0,
          }}
        />
      </>
    ) : (
      <Button
        variant="manga"
        className="h-11 whitespace-nowrap rounded-full px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_26px_68px_-30px_rgba(199,154,99,0.72)] md:h-12 md:px-5 md:text-sm"
        asChild
      >
        <Link href="/read/comics#popular">
          <Play className="h-4 w-4 fill-current" /> Cari komik
        </Link>
      </Button>
    ),
  }), [config.title, heroDescription, heroTitle, isAllVariant, routeBase, spotlightBadges, spotlightComic, variant]);
  const subtypeBrowseCards = React.useMemo(
    () => [
      {
        label: 'Manga',
        route: '/read/comics?type=manga',
        badge: 'MANGA',
        image: subtypePosters.manga || COMIC_HUB_ASSETS.manga,
      },
      {
        label: 'Manhwa',
        route: '/read/comics?type=manhwa',
        badge: 'MANHWA',
        image: subtypePosters.manhwa || COMIC_HUB_ASSETS.manhwa,
      },
      {
        label: 'Manhua',
        route: '/read/comics?type=manhua',
        badge: 'MANHUA',
        image: subtypePosters.manhua || COMIC_HUB_ASSETS.manhua,
      },
    ],
    [subtypePosters.manga, subtypePosters.manhua, subtypePosters.manhwa],
  );
  const readPrimarySegments = React.useMemo(
    () => READ_PRIMARY_SEGMENTS.map((segment) => ({
      href: segment.href,
      label: segment.label,
      title: segment.description,
      active: segment.href === '/read/comics',
    })),
    [],
  );
  const activeComicFilterHref = buildComicFilterHref(variant);
  const comicFilterSegments = React.useMemo(
    () => COMIC_FILTER_SEGMENTS.map((segment) => ({
      href: segment.href,
      label: segment.label,
      title: segment.description,
      active: segment.href === activeComicFilterHref,
    })),
    [activeComicFilterHref],
  );
  const shelfBrowseCards = React.useMemo(
    () => [
      {
        label: 'Baru update',
        route: '/read/comics#latest',
        badge: 'NEW',
        image: COMIC_HUB_ASSETS.latest,
        subtitle: 'Komik yang baru masuk atau baru dirapikan.',
      },
      {
        label: 'Lagi ramai',
        route: '/read/comics#popular',
        badge: 'HOT',
        image: COMIC_HUB_ASSETS.popular,
        subtitle: 'Komik yang paling sering dibuka pembaca.',
      },
      {
        label: 'Masih lanjut',
        route: '/read/comics#latest',
        badge: 'LIVE',
        image: COMIC_HUB_ASSETS.schedule,
        subtitle: 'Judul yang masih aktif update.',
      },
    ],
    [],
  );

  React.useEffect(() => {
    incrementInterest('manga');
  }, []);

  React.useEffect(() => {
    const needsPopular = popular.length === 0;
    const needsNewest = newest.length === 0;

    if (!needsPopular && !needsNewest) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;

    Promise.allSettled([
      needsPopular ? getPopularManga() : Promise.resolve(null),
      needsNewest ? getNewManga(1, 40) : Promise.resolve(null),
    ]).then(([popularResult, newestResult]) => {
      if (cancelled) {
        return;
      }

      if (popularResult.status === 'fulfilled' && popularResult.value?.comics?.length) {
        if (isAllVariant) {
          setPopular(popularResult.value.comics);
        } else {
          const subtypePopular = toSubtypeItems(popularResult.value.comics, variant);
          if (subtypePopular.length > 0 || variant === 'manga') {
            setPopular(subtypePopular);
          }
        }
      }

      if (newestResult.status === 'fulfilled' && newestResult.value?.comics?.length) {
        if (isAllVariant) {
          setNewest(newestResult.value.comics);
        } else {
          const subtypeNewest = toSubtypeItems(newestResult.value.comics, variant);
          setNewest(subtypeNewest);
          setPopular((current) => {
            if (current.length > 0 || variant === 'manga') {
              return current;
            }
            return subtypeNewest;
          });
        }
      }
    }).finally(() => {
      if (!cancelled) {
        setBootstrapping(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAllVariant, newest.length, popular.length, variant]);

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setActiveGenre(genre);
    try {
      const response = await getMangaByGenre(genre.toLowerCase());
      setResults(isAllVariant ? (response.comics || []) : toSubtypeItems(response.comics || [], variant));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MediaHubTemplate
      title={config.title}
      description={config.description}
      icon={BookOpen}
      theme="manga"
      eyebrow={eyebrow}
      results={null}
      loading={false}
      error={null}
      hero={comicHero}
      personalSection={(
        <>
          <ContinueWatching type="manga" title="Lanjut baca komik" hideWhenUnavailable />
          <SavedContentSection type="manga" title={config.savedTitle} hideWhenUnavailable />
        </>
      )}
    >
      <StaggerEntry className="contents" delay={100}>
        <section className="surface-panel relative overflow-hidden p-4 md:p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--theme-manga-surface),transparent_74%)]" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Pilih komik</p>
                <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-foreground md:text-[1.85rem]">
                  Pilih jenis komik, lalu tambah filter genre kalau perlu.
                </h2>
              </div>
              {activeGenre ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResults(null);
                    setActiveGenre(null);
                  }}
                  className="shrink-0"
                >
                  Bersihkan genre
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Kategori baca</p>
              <SegmentedNav ariaLabel="Read segments" items={readPrimarySegments} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Filter komik</p>
              <SegmentedNav ariaLabel="Comic filters" items={comicFilterSegments} />
            </div>

            <GenreFilter
              genres={COMMON_GENRES.slice(0, 12)}
              activeGenre={activeGenre}
              onGenreClick={handleGenreClick}
              theme="manga"
              layout="rail"
            />
          </div>
        </section>

        {results ? (
          <SectionCard
            title={activeGenre ? `Genre: ${activeGenre}` : 'Hasil komik'}
            subtitle={loading ? 'Sedang mengambil pilihan komik...' : 'Pilihan komik dari genre yang kamu pilih.'}
            mode="grid"
            gridDensity="default"
          >
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`genre-loading-${index}`} />)
              : results.length > 0
                ? results.map((mangaItem, index) => (
                  <MediaCard
                    key={`${mangaItem.slug}-${index}`}
                    href={buildItemHref(routeBase, mangaItem)}
                    image={getHDThumbnail(mangaItem.image)}
                    title={mangaItem.title}
                    subtitle={formatComicCardSubtitle(mangaItem)}
                    badgeText={getComicCardBadgeText(mangaItem)}
                    theme="manga"
                  />
                ))
                : (
                  <div className="col-span-full">
                    <StateInfo
                      title="Belum ada komik"
                      description="Coba genre lain atau hapus filter untuk kembali ke rak utama."
                    />
                  </div>
                )}
          </SectionCard>
        ) : null}

        <SectionCard
          title="Pilih rak komik"
          subtitle={
            isAllVariant
              ? 'Buka rak terbaru atau paling ramai.'
              : 'Masuk ke rak terbaru dan populer dari jenis komik ini.'
          }
          mode="rail"
          railVariant="shelf"
        >
          {shelfBrowseCards.map((item) => (
            <MediaCard
              key={item.route}
              href={item.route}
              image={item.image}
              title={item.label}
              subtitle={item.subtitle}
              badgeText={item.badge}
              contentLabel="Komik"
              theme="manga"
              displayVariant="shelf"
            />
          ))}
        </SectionCard>

        {isAllVariant ? (
          <SectionCard title="Pilih jenis komik" subtitle={config.browseSubtitle} mode="rail" railVariant="shelf">
            {subtypeBrowseCards.map((item) => (
              <MediaCard
                key={item.route}
                href={item.route}
                image={item.image}
                title={item.label}
                subtitle="Buka katalog pilihan"
                badgeText={item.badge}
                contentLabel="Komik"
                theme="manga"
                displayVariant="shelf"
              />
            ))}
          </SectionCard>
        ) : null}
        <SectionCard
          id="popular"
          title={config.trendingTitle}
          subtitle={config.trendingSubtitle}
          mode="rail"
          railVariant="default"
          viewAllHref={isAllVariant ? '/read/comics#popular' : undefined}
        >
          {popular.length === 0 && bootstrapping
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`popular-skeleton-${index}`} />)
            : popular.map((mangaItem, index) => (
              <MediaCard
                key={index}
                href={buildItemHref(routeBase, mangaItem)}
                image={getHDThumbnail(mangaItem.image)}
                title={mangaItem.title}
                subtitle={formatComicCardSubtitle(mangaItem)}
                badgeText={getComicCardBadgeText(mangaItem)}
                theme="manga"
              />
            ))}
        </SectionCard>

        <SectionCard
          id="latest"
          title={config.newestTitle}
          subtitle={config.newestSubtitle}
          icon={Sparkles}
          gridDensity="default"
          viewAllHref={isAllVariant ? '/read/comics#latest' : undefined}
        >
          {newest.length === 0 && bootstrapping
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`newest-skeleton-${index}`} />)
            : newest.map((mangaItem, index) => (
              <MediaCard
                key={index}
                href={buildItemHref(routeBase, mangaItem)}
                image={getHDThumbnail(mangaItem.image)}
                title={mangaItem.title}
                subtitle={formatComicCardSubtitle(mangaItem)}
                badgeText={getComicCardBadgeText(mangaItem)}
                theme="manga"
              />
            ))}
        </SectionCard>
      </StaggerEntry>
      </MediaHubTemplate>
  );
}

export function ComicPageClientFromSearchParams({
  fallbackVariant = 'all',
  ...props
}: ComicPageClientFromSearchParamsProps) {
  const searchParams = useSearchParams();
  const variant = normalizeComicVariant(searchParams.get('type')) || fallbackVariant;

  return <ComicPageClient {...props} variant={variant} />;
}
