'use client';

import * as React from 'react';
import {
  extractSlugFromUrl,
  filterMangaBySubtype,
  getHDThumbnail,
  getMangaByGenre,
  getNewManga,
  getPopularManga,
} from "@/lib/adapters/comic";
import { pickSubtypePosterImage } from '@/lib/comic-media';
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
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { formatComicCardSubtitle, getComicCardBadgeText } from '@/lib/card-presentation';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

const COMMON_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai", "Mystery", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports"
];

interface ComicPageClientProps {
  variant: MangaSubtype | 'all';
  routeBase?: '/comics';
  initialPopular: MangaSearchResult[];
  initialNewest: MangaSearchResult[];
  subtypePosters?: Partial<Record<MangaSubtype, string>>;
}

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
    title: "Comic Library: Manga",
    description: "Explore the manga shelf inside the canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending in Manga",
    trendingSubtitle: "Most popular this week",
    newestTitle: "Updated in Manga",
    newestSubtitle: "Recent manga catalog updates",
  },
  all: {
    title: "Comic Library",
    description: "Browse manga, manhwa, and manhua in one canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending Comics",
    trendingSubtitle: "Most popular across manga, manhwa, and manhua",
    newestTitle: "Recent updates",
    newestSubtitle: "Recently updated titles across all comic formats",
    browseSubtitle: "Jump into a specific comic subtype without leaving the hub.",
  },
  manhwa: {
    title: "Comic Library: Manhwa",
    description: "Explore the manhwa shelf inside the canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending in Manhwa",
    trendingSubtitle: "Most popular this week",
    newestTitle: "Updated in Manhwa",
    newestSubtitle: "Recent manhwa catalog updates",
  },
  manhua: {
    title: "Comic Library: Manhua",
    description: "Explore the manhua shelf inside the canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending in Manhua",
    trendingSubtitle: "Most popular this week",
    newestTitle: "Updated in Manhua",
    newestSubtitle: "Recent manhua catalog updates",
  },
};

function toSubtypeItems(items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] {
  return filterMangaBySubtype(items, subtype);
}

function buildItemHref(routeBase: string, item: MangaSearchResult): string {
  return `${routeBase}/${extractSlugFromUrl(item.link)}`;
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
    ? 'Graphic Shelf'
    : `${config.title.split(': ')[1] ?? 'Graphic'} Shelf`;
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
  const comicHero = React.useMemo<MediaHubHero>(() => ({
    title: spotlightComic?.title || config.title,
    description: spotlightComic?.description?.trim()
      || (isAllVariant
        ? 'Browse manga, manhwa, and manhua in one calmer reading shell with the same hero rhythm and section spacing.'
        : `Focused ${variant} shelf inside the canonical comics hub.`),
    label: isAllVariant ? 'Featured comic' : `${variant} spotlight`,
    meta: [
      spotlightComic ? getComicCardBadgeText(spotlightComic) : isAllVariant ? 'COMIC' : variant.toUpperCase(),
      formatComicCardSubtitle(spotlightComic || { chapter: undefined, time_ago: undefined }),
    ].filter(Boolean).join(' • '),
    image: spotlightComic ? getHDThumbnail(spotlightComic.image) : '',
    imageAlt: spotlightComic?.title || config.title,
    badges: spotlightBadges,
    actions: spotlightComic ? (
      <>
        <Button variant="manga" className="whitespace-nowrap" asChild>
          <Link href={buildItemHref(routeBase, spotlightComic)}>
            <Play className="h-4 w-4 fill-current" /> Read Now
          </Link>
        </Button>
        <BookmarkButton
          theme="manga"
          className="whitespace-nowrap border-white/14 bg-black/24 text-white hover:bg-white/12"
          saveLabel="Add to Library"
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
      <Button variant="manga" className="whitespace-nowrap" asChild>
        <Link href="/read/comics#popular">
          <Play className="h-4 w-4 fill-current" /> Browse Comics
        </Link>
      </Button>
    ),
  }), [config.title, isAllVariant, routeBase, spotlightBadges, spotlightComic, variant]);
  const subtypeBrowseCards = React.useMemo(
    () => [
      {
        label: 'Manga',
        route: '/read/comics?type=manga',
        badge: 'MANGA',
        image: subtypePosters.manga || pickSubtypePosterImage(popular, newest, 'manga'),
      },
      {
        label: 'Manhwa',
        route: '/read/comics?type=manhwa',
        badge: 'MANHWA',
        image: subtypePosters.manhwa || pickSubtypePosterImage(popular, newest, 'manhwa'),
      },
      {
        label: 'Manhua',
        route: '/read/comics?type=manhua',
        badge: 'MANHUA',
        image: subtypePosters.manhua || pickSubtypePosterImage(popular, newest, 'manhua'),
      },
    ],
    [newest, popular, subtypePosters.manga, subtypePosters.manhua, subtypePosters.manhwa],
  );
  const shelfBrowseCards = React.useMemo(
    () => [
      {
        label: 'Updated',
        route: '/read/comics#latest',
        badge: 'NEW',
        image: newest[0]?.image || newest[0]?.thumbnail || popular[0]?.image || popular[0]?.thumbnail || '',
        subtitle: 'Open the recently updated comic feed',
      },
      {
        label: 'Popular',
        route: '/read/comics#popular',
        badge: 'HOT',
        image: popular[0]?.image || popular[0]?.thumbnail || newest[0]?.image || newest[0]?.thumbnail || '',
        subtitle: 'See what readers open most',
      },
      {
        label: 'Ongoing',
        route: '/read/comics#latest',
        badge: 'LIVE',
        image: newest[1]?.image || newest[1]?.thumbnail || popular[1]?.image || popular[1]?.thumbnail || newest[0]?.image || '',
        subtitle: 'Browse titles still updating',
      },
    ],
    [newest, popular],
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
          <ContinueWatching type="manga" title="Continue Reading Comics" hideWhenUnavailable />
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
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Comic browse</p>
                <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-white md:text-[1.85rem]">
                  Filter genre lanes here, then continue through the shared reading shelves below.
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
                  Clear Genre
                </Button>
              ) : null}
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
            title={activeGenre ? `Genre: ${activeGenre}` : 'Comic Results'}
            subtitle={loading ? 'Loading the selected comic lane...' : 'Filtered comic picks from the selected genre lane.'}
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
                      title="No Comics Found"
                      description="Try a different genre or clear the current lane to return to the main comic shelves."
                    />
                  </div>
                )}
          </SectionCard>
        ) : null}

        <SectionCard
          title="Browse By Shelf"
          subtitle={
            isAllVariant
              ? 'Open focused lanes for what is newest or most read right now.'
              : 'Jump to the shared latest and popular comic shelves from this subtype lane.'
          }
          mode="rail"
          railVariant="compact"
        >
          {shelfBrowseCards.map((item) => (
            <MediaCard
              key={item.route}
              href={item.route}
              image={item.image}
              title={item.label}
              subtitle={item.subtitle}
              badgeText={item.badge}
              theme="manga"
            />
          ))}
        </SectionCard>

        {isAllVariant ? (
          <SectionCard title="Browse By Type" subtitle={config.browseSubtitle} mode="rail" railVariant="compact">
            {subtypeBrowseCards.map((item) => (
              <MediaCard
                key={item.route}
                href={item.route}
                image={item.image}
                title={item.label}
                subtitle="Open curated subtype catalog"
                badgeText={item.badge}
                theme="manga"
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
