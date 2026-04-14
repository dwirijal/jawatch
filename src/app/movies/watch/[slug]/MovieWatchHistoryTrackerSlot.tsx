'use client';

import MovieWatchHistoryTracker from './MovieWatchHistoryTracker';

type MovieWatchHistoryTrackerSlotProps = {
  slug: string;
  title: string;
  image: string;
  href: string;
  quality: string;
};

export function MovieWatchHistoryTrackerSlot(props: MovieWatchHistoryTrackerSlotProps) {
  return <MovieWatchHistoryTracker {...props} />;
}
