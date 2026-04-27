'use client';

import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { cn, ThemeType } from '@/lib/utils';

interface GenreFilterProps {
  genres: string[];
  activeGenre: string | null;
  onGenreClick: (genre: string) => void;
  theme: ThemeType;
  className?: string;
  layout?: 'wrap' | 'rail';
}

export function GenreFilter({
  genres,
  activeGenre,
  onGenreClick,
  theme,
  className,
  layout = 'wrap',
}: GenreFilterProps) {
  const headingId = React.useId();
  const isRail = layout === 'rail';

  return (
    <div className={cn("space-y-[var(--space-md)]", className)}>
      <div className="flex items-center gap-[var(--space-xs)]">
        <Filter className="h-[var(--size-icon-sm)] w-[var(--size-icon-sm)] text-muted-foreground" />
        <h3 id={headingId} className="type-kicker">Filter by Genres</h3>
      </div>
      <div
        className={cn(
          'flex gap-[var(--space-xs)]',
          isRail
            ? 'overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x md:flex-wrap md:overflow-visible md:whitespace-normal md:pb-0'
            : 'flex-wrap'
        )}
        role="group"
        aria-labelledby={headingId}
      >
        {genres.map(genre => (
          <Button 
            key={genre} 
            variant={activeGenre === genre ? theme : "outline"} 
            size="sm"
            onClick={() => onGenreClick(genre)}
            aria-pressed={activeGenre === genre}
            className={cn(
              'h-[var(--size-control-sm)] rounded-xl border-border-subtle px-[var(--space-md)] text-[var(--type-size-xs)] font-black uppercase',
              isRail && 'shrink-0'
            )}
          >
            {genre}
          </Button>
        ))}
      </div>
    </div>
  );
}
