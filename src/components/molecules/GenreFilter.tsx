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
}

export function GenreFilter({
  genres,
  activeGenre,
  onGenreClick,
  theme,
  className
}: GenreFilterProps) {
  const headingId = React.useId();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-zinc-500" />
        <h3 id={headingId} className="type-kicker">Filter by Genres</h3>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={headingId}>
        {genres.map(genre => (
          <Button 
            key={genre} 
            variant={activeGenre === genre ? theme : "outline"} 
            size="sm"
            onClick={() => onGenreClick(genre)}
            aria-pressed={activeGenre === genre}
            className="rounded-xl text-[10px] uppercase font-black px-4 h-9 border-zinc-800"
          >
            {genre}
          </Button>
        ))}
      </div>
    </div>
  );
}
