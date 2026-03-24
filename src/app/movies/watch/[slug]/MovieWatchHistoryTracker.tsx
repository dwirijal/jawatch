'use client';

import * as React from 'react';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { saveHistoryForAuth } from '@/lib/store';

interface MovieWatchHistoryTrackerProps {
  slug: string;
  title: string;
  image: string;
  href: string;
  quality: string;
}

export default function MovieWatchHistoryTracker({
  slug,
  title,
  image,
  href,
  quality,
}: MovieWatchHistoryTrackerProps) {
  const session = useAuthSession();

  React.useEffect(() => {
    saveHistoryForAuth(session.authenticated, {
      id: slug,
      type: 'movie',
      title,
      image,
      lastChapterOrEpisode: quality || 'MOVIE',
      lastLink: href,
      timestamp: Date.now(),
    });
  }, [session.authenticated, slug, title, image, href, quality]);

  return null;
}
