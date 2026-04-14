'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Link as LinkIcon, Share2, User } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

export interface ShortDrama {
  slug: string;
  title: string;
  image: string;
  subtitle?: string;
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
}

interface VerticalShortsPagerProps {
  shorts: ShortDrama[];
  onNext?: () => void;
  hasNext?: boolean;
}

export function VerticalShortsPager({ shorts, onNext, hasNext }: VerticalShortsPagerProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) {
      return;
    }

    const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide"
    >
      {shorts.map((short, index) => (
        <div
          key={short.slug}
          className="relative flex h-[100dvh] w-full snap-start flex-col items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            {Math.abs(index - activeIndex) <= 1 ? (
              <VideoPlayer
                mirrors={short.mirrors}
                defaultUrl={short.defaultUrl}
                format="shorts"
                showMirrorPanel={false}
                theme="drama"
                onNext={index === shorts.length - 1 ? onNext : undefined}
                hasNext={index === shorts.length - 1 ? hasNext : true}
              />
            ) : null}
          </div>

          <div className="absolute bottom-32 right-4 z-50 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-xl">
                  <User className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-2 left-1/2 rounded-full border-2 border-black bg-rose-600 p-0.5 -translate-x-1/2">
                  <ChevronDown className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <button type="button" className="flex flex-col items-center gap-1 text-white drop-shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60">
                <Share2 className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Share</span>
            </button>

            <Link href={`/series/${short.slug}`} className="flex flex-col items-center gap-1 text-white drop-shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60">
                <LinkIcon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Series</span>
            </Link>
          </div>

          <div className="pointer-events-none absolute bottom-10 left-4 right-20 z-50 text-white">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Short</span>
              <span className="text-xs font-medium text-zinc-400">#{index + 1} in Feed</span>
            </div>
            <h3 className="text-xl font-black leading-tight drop-shadow-2xl">@{short.title}</h3>
            {short.subtitle ? (
              <p className="mt-2 max-w-[80%] line-clamp-2 text-sm font-medium text-zinc-200 opacity-90 drop-shadow-lg">
                {short.subtitle}
              </p>
            ) : null}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-48 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
      ))}
    </div>
  );
}
