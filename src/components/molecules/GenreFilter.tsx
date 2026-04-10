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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-zinc-500" />
        <h3 id={headingId} className="type-kicker">Filter by Genres</h3>
      </div>
      <div
        className={cn(
          'flex gap-2',
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
              'rounded-xl text-[10px] uppercase font-black px-4 h-9 border-zinc-800',
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
