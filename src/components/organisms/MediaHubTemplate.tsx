'use client';

import * as React from 'react';
import { Clapperboard, CalendarDays, Globe2, Grid3X3, LayoutGrid, Tag, Tv, Zap, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { DeferredAdSection } from '@/components/organisms/DeferredAdSection';
import { MediaHubHeader } from './MediaHubHeader';
import { MediaCard } from '@/components/atoms/Card';
import { GenreFilter } from '@/components/molecules/GenreFilter';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { ThemeType } from '@/lib/utils';
import type { GenericMediaItem } from '@/lib/types';

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
  resultHrefBuilder,
  resultHrefPrefix,
}: MediaHubTemplateProps) {
  const gridDensity = 'dense';
  const resolvedIcon = icon ?? MEDIA_HUB_ICONS[iconName as keyof typeof MEDIA_HUB_ICONS] ?? Grid3X3;

  return (
    <div className="app-shell" data-theme={theme} data-view-mode="compact">
      <MediaHubHeader
        title={title}
        description={description}
        icon={resolvedIcon}
        theme={theme}
        eyebrow={eyebrow}
        containerClassName="app-container-wide"
        layoutVariant="editorial"
        footer={(
          <>
            <div className="min-w-0 flex-1">
              {genres && genres.length > 0 && onGenreClick ? (
                <GenreFilter
                  genres={genres.slice(0, 10)}
                  activeGenre={activeGenre ?? null}
                  onGenreClick={onGenreClick}
                  theme={theme}
                  layout="rail"
                  className="space-y-2.5 md:space-y-3"
                />
              ) : <div className="hidden md:block" />}
            </div>
            {extraFilters ? <div className="hidden md:flex md:justify-end">{extraFilters}</div> : <div className="hidden md:block" />}
          </>
        )}
      >
        {extraHeaderActions}
      </MediaHubHeader>

      <main className="app-container-wide mt-7 sm:mt-8 md:mt-10">
        <div className="border-t border-white/8 pt-5 md:pt-6">
          <div className="hidden md:block">
            <DeferredAdSection />
          </div>

          <div className="app-section-stack mt-5 md:mt-7">
            {results ? (
              <section className="animate-in space-y-4 fade-in duration-500">
                <SectionHeader
                  title={activeGenre ? `Genre: ${activeGenre}` : `Filtered results`}
                  icon={LayoutGrid}
                  action={onClearResults ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={onClearResults}
                      className="focus-tv shrink-0 text-xs font-semibold tracking-[0.02em] text-zinc-500 hover:text-white"
                    >
                      Clear filter
                    </Button>
                  ) : undefined}
                />

                {error ? (
                  <StateInfo type="error" title="Search Error" description={error} />
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
                  <StateInfo title="No Content Found" description="Try choosing a different genre or filter." />
                )}
              </section>
            ) : loading ? (
              <div className="media-grid" data-grid-density={gridDensity}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
