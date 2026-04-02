'use client';

import * as React from 'react';

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
    let cancelled = false;

    import('@/lib/store').then(({ saveHistory }) => {
      if (cancelled) {
        return;
      }

      saveHistory({
        id: slug,
        type: 'manga',
        title,
        image,
        lastChapterOrEpisode: chapterLabel,
        lastLink: href,
        timestamp: Date.now(),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [slug, title, image, href, chapterLabel]);

  return null;
}
