'use client';

import * as React from 'react';
import { saveHistory } from '@/lib/store';

interface ComicChapterHistoryTrackerProps {
  slug: string;
  title: string;
  image: string;
  href: string;
  chapterLabel: string;
}

export default function ComicChapterHistoryTracker({
  slug,
  title,
  image,
  href,
  chapterLabel,
}: ComicChapterHistoryTrackerProps) {
  React.useEffect(() => {
    saveHistory({
      id: slug,
      type: 'manga',
      title,
      image,
      lastChapterOrEpisode: chapterLabel,
      lastLink: href,
      timestamp: Date.now(),
    });
  }, [slug, title, image, href, chapterLabel]);

  return null;
}
