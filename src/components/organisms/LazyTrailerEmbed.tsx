'use client';

import * as React from 'react';
import { Play } from 'lucide-react';

interface LazyTrailerEmbedProps {
  embedUrl: string;
  title: string;
}

export function LazyTrailerEmbed({ embedUrl, title }: LazyTrailerEmbedProps) {
  const [activated, setActivated] = React.useState(false);

  if (!activated) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-black">
        <button
          type="button"
          aria-label={`Putar trailer ${title}`}
          className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/15 text-[var(--accent-contrast)] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-105 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
          onClick={() => setActivated(true)}
        >
          <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black">
      <iframe
        src={embedUrl}
        title={`${title} trailer`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
