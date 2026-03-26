'use client';

import * as React from 'react';
import { Grid3X3, LayoutGrid, LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { AdSection } from '@/components/organisms/AdSection';
import { MediaHubHeader } from './MediaHubHeader';
import { Card } from '@/components/atoms/Card';
import { GenreFilter } from '@/components/molecules/GenreFilter';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { CardGrid } from '@/components/molecules/card';
import { ThemeType } from '@/lib/utils';
import type { GenericMediaItem } from '@/lib/api';

interface MediaHubTemplateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  theme: ThemeType;
  genres: string[];
  results: GenericMediaItem[] | null;
  loading: boolean;
  error: string | null;
  activeGenre: string | null;
  onGenreClick: (genre: string) => void;
  onClearResults: () => void;
  children?: React.ReactNode;
  extraHeaderActions?: React.ReactNode;
  extraFilters?: React.ReactNode;
}

type ViewMode = 'comfortable' | 'compact';

export function MediaHubTemplate({
  title,
  description,
  icon,
  theme,
  genres,
  results,
  loading,
  error,
  activeGenre,
  onGenreClick,
  onClearResults,
  children,
  extraHeaderActions,
  extraFilters
}: MediaHubTemplateProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('compact');
  const viewModeStorageKey = `dwizzy_view_mode_${theme}`;

  React.useEffect(() => {
    const saved = window.localStorage.getItem(viewModeStorageKey);
    if (saved === 'comfortable' || saved === 'compact') {
      setViewMode(saved);
    }
  }, [viewModeStorageKey]);

  React.useEffect(() => {
    window.localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewMode, viewModeStorageKey]);

  return (
    <div className="app-shell" data-theme={theme} data-view-mode={viewMode}>
      <MediaHubHeader
        title={title}
        description={description}
        icon={icon}
        theme={theme}
        containerClassName="app-container-wide"
      >
        {extraHeaderActions}
        <div className="mx-2 hidden h-8 w-px bg-border-subtle md:block" />
        <GenreFilter
          genres={genres.slice(0, 10)}
          activeGenre={activeGenre}
          onGenreClick={onGenreClick}
          theme={theme}
          className="md:pt-0 space-y-0"
        />
      </MediaHubHeader>

      <main className="app-container-wide mt-8 space-y-10 sm:mt-10 md:mt-12 md:space-y-12">
        {/* Advanced Filters Area */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 rounded-[var(--radius-lg)] border border-white/10 bg-surface-1 p-1">
            <button
              type="button"
              aria-label="Comfortable view"
              onClick={() => setViewMode('comfortable')}
              className={`inline-flex items-center gap-2 rounded-[calc(var(--radius-lg)-0.35rem)] px-3 py-2 text-xs font-semibold tracking-[0.02em] transition ${viewMode === 'comfortable'
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Comfort
            </button>
            <button
              type="button"
              aria-label="Compact view"
              onClick={() => setViewMode('compact')}
              className={`inline-flex items-center gap-2 rounded-[calc(var(--radius-lg)-0.35rem)] px-3 py-2 text-xs font-semibold tracking-[0.02em] transition ${viewMode === 'compact'
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Compact
            </button>
          </div>
          {extraFilters && (
            <div className="flex justify-end">
              {extraFilters}
            </div>
          )}
        </div>

        <AdSection />

        <div className="app-section-stack">
          {results ? (
            <section className="animate-in space-y-4 fade-in duration-500">
              <SectionHeader
                title={activeGenre ? `Genre: ${activeGenre}` : `Filtered results`}
                icon={LayoutGrid}
                action={
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={onClearResults}
                    className="focus-tv shrink-0 text-xs font-semibold tracking-[0.02em] text-zinc-500 hover:text-white"
                  >
                    Clear filter
                  </Button>
                }
              />

              {error ? (
                <StateInfo type="error" title="Search Error" description={error} />
              ) : results.length > 0 ? (
                <StaggerEntry className="media-grid">
                  {results.map((item, index) => (
                    <Card
                      key={`${item.slug}-${index}`}
                      href={`/${theme === 'movie' ? 'movies' : theme}/${item.slug || ''}`}
                      image={item.thumb || item.image || item.thumbnail || item.poster || ''}
                      title={item.title}
                      subtitle={item.episode || item.chapter || item.year}
                      theme={theme}
                    />
                  ))}
                </StaggerEntry>
              ) : (
                <StateInfo title="No Content Found" description="Try choosing a different genre or filter." />
              )}
            </section>
          ) : loading ? (
            <CardGrid>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </CardGrid>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
