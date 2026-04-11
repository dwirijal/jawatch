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
import { BookOpen, Sparkles } from "lucide-react";
import { MediaCard } from "@/components/atoms/Card";
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { formatComicCardSubtitle, getComicCardBadgeText } from '@/lib/card-presentation';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

const COMMON_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai", "Mystery", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports"
];

interface ComicPageClientProps {
  variant: MangaSubtype | 'all';
  routeBase?: '/comic';
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
    newestTitle: "New in Manga",
    newestSubtitle: "Fresh manga chapters and updates",
  },
  all: {
    title: "Comic Library",
    description: "Browse manga, manhwa, and manhua in one canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending Comics",
    trendingSubtitle: "Most popular across manga, manhwa, and manhua",
    newestTitle: "New releases",
    newestSubtitle: "Fresh chapter updates across all comic formats",
    browseSubtitle: "Jump into a specific comic subtype without leaving the hub.",
  },
  manhwa: {
    title: "Comic Library: Manhwa",
    description: "Explore the manhwa shelf inside the canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending in Manhwa",
    trendingSubtitle: "Most popular this week",
    newestTitle: "New in Manhwa",
    newestSubtitle: "Fresh manhwa chapters and updates",
  },
  manhua: {
    title: "Comic Library: Manhua",
    description: "Explore the manhua shelf inside the canonical comic hub.",
    savedTitle: "Saved Comics",
    trendingTitle: "Trending in Manhua",
    trendingSubtitle: "Most popular this week",
    newestTitle: "New in Manhua",
    newestSubtitle: "Fresh manhua chapters and updates",
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
  routeBase = '/comic',
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
  const subtypeBrowseCards = React.useMemo(
    () => [
      {
        label: 'Manga',
        route: '/comic/manga',
        badge: 'MANGA',
        image: subtypePosters.manga || pickSubtypePosterImage(popular, newest, 'manga'),
      },
      {
        label: 'Manhwa',
        route: '/comic/manhwa',
        badge: 'MANHWA',
        image: subtypePosters.manhwa || pickSubtypePosterImage(popular, newest, 'manhwa'),
      },
      {
        label: 'Manhua',
        route: '/comic/manhua',
        badge: 'MANHUA',
        image: subtypePosters.manhua || pickSubtypePosterImage(popular, newest, 'manhua'),
      },
    ],
    [newest, popular, subtypePosters.manga, subtypePosters.manhua, subtypePosters.manhwa],
  );
  const shelfBrowseCards = React.useMemo(
    () => [
      {
        label: 'Latest',
        route: '/comic/latest',
        badge: 'NEW',
        image: newest[0]?.image || newest[0]?.thumbnail || popular[0]?.image || popular[0]?.thumbnail || '',
        subtitle: 'Open the newest chapter feed',
      },
      {
        label: 'Popular',
        route: '/comic/popular',
        badge: 'HOT',
        image: popular[0]?.image || popular[0]?.thumbnail || newest[0]?.image || newest[0]?.thumbnail || '',
        subtitle: 'See what readers open most',
      },
      {
        label: 'Ongoing',
        route: '/comic/ongoing',
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
      genres={COMMON_GENRES}
      results={results}
      loading={loading}
      error={null}
      activeGenre={activeGenre}
      onGenreClick={handleGenreClick}
      onClearResults={() => {
        setResults(null);
        setActiveGenre(null);
      }}
    >
      <StaggerEntry className="app-section-stack" delay={100}>
        <SectionCard
          title="Browse By Shelf"
          subtitle={
            isAllVariant
              ? 'Open focused lanes for what is newest or most read right now.'
              : 'Jump to the shared latest and popular comic shelves from this subtype lane.'
          }
          mode="rail"
          railVariant="default"
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
          <SectionCard title="Browse By Type" subtitle={config.browseSubtitle} mode="rail" railVariant="default">
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
          title={config.trendingTitle}
          subtitle={config.trendingSubtitle}
          mode="rail"
          railVariant="default"
          viewAllHref={isAllVariant ? '/comic/popular' : routeBase}
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

        <SavedContentSection type="manga" title={config.savedTitle} />

        <SectionCard
          title={config.newestTitle}
          subtitle={config.newestSubtitle}
          icon={Sparkles}
          gridDensity="default"
          viewAllHref={isAllVariant ? '/comic/latest' : routeBase}
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
