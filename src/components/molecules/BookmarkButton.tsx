'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { checkIsBookmarked, toggleBookmark, BookmarkItem } from '@/lib/store';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  item: BookmarkItem;
  theme?: 'manga' | 'anime' | 'donghua' | 'movie';
  className?: string;
}

export function BookmarkButton({ item, theme = 'anime', className }: BookmarkButtonProps) {
  const [, setRefreshKey] = useState(0);
  const isSaved = checkIsBookmarked(item.id);

  const handleToggle = () => {
    toggleBookmark(item);
    setRefreshKey((value) => value + 1);
  };

  const themeClasses = {
    manga: isSaved ? 'bg-orange-600 text-white hover:bg-orange-700 border-transparent' : 'text-orange-500 hover:bg-orange-600/10 border-orange-600/50',
    anime: isSaved ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : 'text-blue-500 hover:bg-blue-600/10 border-blue-600/50',
    donghua: isSaved ? 'bg-red-600 text-white hover:bg-red-700 border-transparent' : 'text-red-500 hover:bg-red-600/10 border-red-600/50',
    movie: isSaved ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent' : 'text-indigo-500 hover:bg-indigo-600/10 border-indigo-600/50',
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      className={cn(
        "gap-2 px-4 transition-all duration-300",
        themeClasses[theme],
        className
      )}
    >
      <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  );
}
