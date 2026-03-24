'use client';

import * as React from 'react';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { saveHistoryForAuth } from '@/lib/store';

interface AnimeEpisodeHistoryTrackerProps {
  animeSlug: string;
  animeTitle: string;
  image: string;
  episodeTitle: string;
  href: string;
}

export default function AnimeEpisodeHistoryTracker({
  animeSlug,
  animeTitle,
  image,
  episodeTitle,
  href,
}: AnimeEpisodeHistoryTrackerProps) {
  const session = useAuthSession();

  React.useEffect(() => {
    saveHistoryForAuth(session.authenticated, {
      id: animeSlug,
      type: 'anime',
      title: animeTitle,
      image,
      lastChapterOrEpisode: episodeTitle,
      lastLink: href,
      timestamp: Date.now(),
    });
  }, [session.authenticated, animeSlug, animeTitle, image, episodeTitle, href]);

  return null;
}
