'use client';

import * as React from 'react';
import {
  extractSlugFromUrl,
  filterMangaBySubtype,
  getHDThumbnail,
  getMangaByGenre,
  getNewManga,
  getPopularManga,
  type MangaSearchResult,
  type MangaSubtype,
} from "@/lib/api";
import { incrementInterest } from '@/lib/store';
import { BookOpen, Sparkles } from "lucide-react";
import { Card } from "@/components/atoms/Card";
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionCard } from '@/components/organisms/SectionCard';

const COMMON_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai", "Mystery", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports"
];

interface MangaPageClientProps {
  variant: MangaSubtype;
  initialPopular: MangaSearchResult[];
  initialNewest: MangaSearchResult[];
}

const VARIANT_CONFIG: Record<MangaSubtype, {
  title: string;
  description: string;
  savedTitle: string;
  trendingTitle: string;
  trendingSubtitle: string;
  newestTitle: string;
  newestSubtitle: string;
}> = {
  manga: {
    title: "Manga Library",
    description: "Read thousands of premium manga titles with our high-speed, optimized reading experience.",
    savedTitle: "Saved Manga",
    trendingTitle: "Trending Manga",
    trendingSubtitle: "Most popular this week",
    newestTitle: "New releases",
    newestSubtitle: "Fresh chapters and updates",
  },
  manhwa: {
    title: "Manhwa Library",
    description: "Read curated manhwa picks with the same fast, clean reading experience.",
    savedTitle: "Saved Manhwa",
    trendingTitle: "Trending Manhwa",
    trendingSubtitle: "Most popular this week",
    newestTitle: "New releases",
    newestSubtitle: "Fresh chapters and updates",
  },
  manhua: {
    title: "Manhua Library",
    description: "Read curated manhua picks with the same fast, clean reading experience.",
    savedTitle: "Saved Manhua",
    trendingTitle: "Trending Manhua",
    trendingSubtitle: "Most popular this week",
    newestTitle: "New releases",
    newestSubtitle: "Fresh chapters and updates",
  },
};

function toSubtypeItems(items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] {
  return filterMangaBySubtype(items, subtype);
}

export default function MangaPageClient({ variant, initialPopular, initialNewest }: MangaPageClientProps) {
  const config = VARIANT_CONFIG[variant];
  const [results, setResults] = React.useState<MangaSearchResult[] | null>(null);
  const [popular, setPopular] = React.useState(() => toSubtypeItems(initialPopular, variant));
  const [newest, setNewest] = React.useState(() => toSubtypeItems(initialNewest, variant));
  const [loading, setLoading] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(popular.length === 0 || newest.length === 0);
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null);

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
        setPopular(toSubtypeItems(popularResult.value.comics, variant));
      }

      if (newestResult.status === 'fulfilled' && newestResult.value?.comics?.length) {
        setNewest(toSubtypeItems(newestResult.value.comics, variant));
      }
    }).finally(() => {
      if (!cancelled) {
        setBootstrapping(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [newest.length, popular.length, variant]);

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setActiveGenre(genre);
    try {
      const response = await getMangaByGenre(genre.toLowerCase());
      setResults(toSubtypeItems(response.comics || [], variant));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveVariantSurpriseSlug = React.useCallback(() => {
    const pool = [
      ...(results ?? []),
      ...popular,
      ...newest,
    ];
    if (pool.length === 0) {
      return '';
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    return extractSlugFromUrl(picked.link) || picked.slug || '';
  }, [newest, popular, results]);

  const extraHeaderActions = variant === 'manga'
    ? <SurpriseButton type="manga" theme="manga" />
    : (
      <SurpriseButton
        type="manga"
        theme="manga"
        hrefBase="/manga"
        resolveSlug={resolveVariantSurpriseSlug}
      />
    );

  return (
    <MediaHubTemplate
      title={config.title}
      description={config.description}
      icon={BookOpen}
      theme="manga"
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
      extraHeaderActions={extraHeaderActions}
    >
      <div className="app-section-stack">
        <SectionCard title={config.trendingTitle} subtitle={config.trendingSubtitle} mode="rail" viewAllHref={`/${variant}`}>
          {popular.length === 0 && bootstrapping
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`popular-skeleton-${index}`} />)
            : popular.map((mangaItem, index) => (
              <Card
                key={index}
                href={`/manga/${extractSlugFromUrl(mangaItem.link)}`}
                image={getHDThumbnail(mangaItem.image)}
                title={mangaItem.title}
                subtitle={mangaItem.chapter}
                badgeText={`#${index + 1}`}
                theme="manga"
              />
            ))}
        </SectionCard>

        <SavedContentSection type="manga" title={config.savedTitle} />

        <SectionCard title={config.newestTitle} subtitle={config.newestSubtitle} icon={Sparkles}>
          {newest.length === 0 && bootstrapping
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`newest-skeleton-${index}`} />)
            : newest.map((mangaItem, index) => (
              <Card
                key={index}
                href={`/manga/${extractSlugFromUrl(mangaItem.link)}`}
                image={getHDThumbnail(mangaItem.image)}
                title={mangaItem.title}
                subtitle={mangaItem.time_ago}
                badgeText={mangaItem.chapter}
                theme="manga"
              />
            ))}
        </SectionCard>
      </div>
    </MediaHubTemplate>
  );
}
