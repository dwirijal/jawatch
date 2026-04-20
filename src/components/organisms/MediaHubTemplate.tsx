'use client';

import * as React from 'react';
import { Clapperboard, CalendarDays, Globe2, Grid3X3, LayoutGrid, Tag, Tv, Zap, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { DeferredAdSection } from '@/components/organisms/DeferredAdSection';
import { MediaHubHeader, type MediaHubSpotlight } from './MediaHubHeader';
import { MediaCard } from '@/components/atoms/Card';
import { GenreFilter } from '@/components/molecules/GenreFilter';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { ThemeType } from '@/lib/utils';
import type { GenericMediaItem } from '@/lib/types';

export interface MediaHubHero extends MediaHubSpotlight {
  title: string;
  description: string;
}

const MEDIA_HUB_ICONS = {
  CalendarDays,
  Clapperboard,
  Globe2,
  Grid3X3,
  Tag,
  Tv,
  Zap,
} satisfies Record<string, LucideIcon>;

interface MediaHubTemplateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
  theme: ThemeType;
  eyebrow?: string;
  genres?: string[];
  results: GenericMediaItem[] | null;
  loading: boolean;
  error: string | null;
  activeGenre?: string | null;
  onGenreClick?: (genre: string) => void;
  onClearResults?: () => void;
  children?: React.ReactNode;
  extraHeaderActions?: React.ReactNode;
  extraFilters?: React.ReactNode;
  hero?: MediaHubHero;
  heroFooter?: React.ReactNode;
  personalSection?: React.ReactNode;
  resultHrefBuilder?: (item: GenericMediaItem) => string;
  resultHrefPrefix?: string;
}

function getResultSubtitle(item: GenericMediaItem): string {
  if (item.country && item.latestEpisode) {
    return `${item.country} • ${item.latestEpisode}`;
  }

  return item.latestEpisode || item.episode || item.chapter || item.country || item.year || '';
}

export function MediaHubTemplate({
  title,
  description,
  icon,
  iconName,
  theme,
  eyebrow,
  genres,
  results,
  loading,
  error,
  activeGenre,
  onGenreClick,
  onClearResults,
  children,
  extraHeaderActions,
  extraFilters,
  hero,
  heroFooter,
  personalSection,
  resultHrefBuilder,
  resultHrefPrefix,
}: MediaHubTemplateProps) {
  const gridDensity = 'default';
  const resolvedIcon = icon ?? MEDIA_HUB_ICONS[iconName as keyof typeof MEDIA_HUB_ICONS] ?? Grid3X3;
  const legacyFooter = genres && genres.length > 0 && onGenreClick ? (
    <>
      <div className="min-w-0 flex-1">
        <GenreFilter
          genres={genres.slice(0, 10)}
          activeGenre={activeGenre ?? null}
          onGenreClick={onGenreClick}
          theme={theme}
          layout="rail"
          className="space-y-2.5 md:space-y-3"
        />
      </div>
      {extraFilters ? <div className="hidden md:flex md:justify-end">{extraFilters}</div> : <div className="hidden md:block" />}
    </>
  ) : extraFilters ? (
    <div className="flex w-full justify-start md:justify-end">{extraFilters}</div>
  ) : undefined;
  const headerFooter = heroFooter ?? legacyFooter;

  return (
    <div className="app-shell" data-theme={theme} data-view-mode="compact">
      <MediaHubHeader
        title={hero?.title || title}
        description={hero?.description || description}
        icon={resolvedIcon}
        theme={theme}
        eyebrow={eyebrow}
        containerClassName="app-container-wide"
        layoutVariant="editorial"
        footer={headerFooter}
        spotlight={hero}
        spotlightPriority={Boolean(hero?.image)}
      >
        {hero ? null : extraHeaderActions}
      </MediaHubHeader>

      <main className="app-container-wide mt-5 sm:mt-6 md:mt-7">
        <div className="app-section-stack">
          {personalSection}

          {results ? (
            <section className="animate-in space-y-4 fade-in duration-500">
              <SectionHeader
                title={activeGenre ? `Genre: ${activeGenre}` : 'Hasil filter'}
                icon={LayoutGrid}
                action={onClearResults ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={onClearResults}
                    className="focus-tv shrink-0 text-xs font-semibold tracking-[0.02em] text-zinc-500 hover:text-white"
                  >
                    Hapus filter
                  </Button>
                ) : undefined}
              />

              {error ? (
                <StateInfo type="error" title="Pencarian belum bisa dibuka" description={error} />
              ) : results.length > 0 ? (
                <div className="media-grid" data-grid-density={gridDensity}>
                  <StaggerEntry className="contents">
                    {results.map((item, index) => (
                      <MediaCard
                        key={`${item.slug}-${index}`}
                        href={
                          resultHrefBuilder
                            ? resultHrefBuilder(item)
                            : `${resultHrefPrefix ?? `/${theme === 'movie' ? 'movies' : theme}`}/${item.slug || ''}`
                        }
                        image={item.thumb || item.image || item.thumbnail || item.poster || ''}
                        title={item.title}
                        subtitle={getResultSubtitle(item)}
                        theme={theme}
                      />
                    ))}
                  </StaggerEntry>
                </div>
              ) : (
                <StateInfo title="Belum ada hasil" description="Coba genre atau filter lain." />
              )}
            </section>
          ) : loading ? (
            <div className="media-grid" data-grid-density={gridDensity}>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            children
          )}

          <div className="hidden md:block">
            <DeferredAdSection />
          </div>
        </div>
      </main>
    </div>
  );
}
