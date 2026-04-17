'use client';

import * as React from 'react';
import { saveHistory } from '@/lib/store';

interface ComicDetailHistoryTrackerProps {
  slug: string;
  title: string;
  image: string;
  href: string;
}

export default function ComicDetailHistoryTracker({
  slug,
  title,
  image,
  href,
}: ComicDetailHistoryTrackerProps) {
  React.useEffect(() => {
    saveHistory({
      id: slug,
      type: 'manga',
      title,
      image,
      lastChapterOrEpisode: 'Recently viewed',
      lastLink: href,
      timestamp: Date.now(),
    });
  }, [slug, title, image, href]);

  return null;
}
