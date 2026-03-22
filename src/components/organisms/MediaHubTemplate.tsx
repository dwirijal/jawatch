'use client';

import * as React from 'react';
import { LucideIcon, LayoutGrid } from 'lucide-react';
import { MediaHubHeader } from './MediaHubHeader';
import { GenreFilter } from '@/components/molecules/GenreFilter';
import { StaggerEntry } from '@/components/molecules/StaggerEntry';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { ThemeType, GenericMediaItem } from '@/lib/utils';

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
  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <MediaHubHeader
        title={title}
        description={description}
        icon={icon}
        theme={theme}
      >
        {extraHeaderActions}
        <div className="h-8 w-px bg-zinc-800 mx-2 hidden md:block" />
        <GenreFilter 
          genres={genres.slice(0, 10)} 
          activeGenre={activeGenre} 
          onGenreClick={onGenreClick} 
          theme={theme} 
          className="md:pt-0 space-y-0"
        />
      </MediaHubHeader>

      <main className="max-w-7xl mx-auto px-8 mt-12 space-y-12">
        {/* Advanced Filters Area */}
        {extraFilters && (
          <div className="flex justify-end">
            {extraFilters}
          </div>
        )}

        <div className="space-y-32">
          {results ? (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-6 h-6" />
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                    {activeGenre ? `Genre: ${activeGenre}` : `Filtered Results`}
                  </h2>
                </div>
                <button className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest" onClick={onClearResults}>
                  Clear Filter
                </button>
              </div>

              {error ? (
                <StateInfo type="error" title="Search Error" description={error} />
              ) : results.length > 0 ? (
                <StaggerEntry className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {results.map((item, index) => (
                    <MediaCard
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
