'use client';

import * as React from 'react';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';
import { Share2, User, Link as LinkIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';

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
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
    >
      {shorts.map((short, index) => (
        <div key={short.slug} className="relative h-[100dvh] w-full snap-start flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Only render VideoPlayer for active, previous, and next slides for performance */}
            {Math.abs(index - activeIndex) <= 1 && (
              <VideoPlayer
                mirrors={short.mirrors}
                defaultUrl={short.defaultUrl}
                format="shorts"
                showMirrorPanel={false}
                theme="drama"
                onNext={index === shorts.length - 1 ? onNext : undefined}
                hasNext={index === shorts.length - 1 ? hasNext : true}
              />
            )}
          </div>

          {/* TikTok-style right-side overlays */}
          <div className="absolute right-4 bottom-32 z-50 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shadow-xl">
                  <User className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rose-600 rounded-full p-0.5 border-2 border-black">
                  <ChevronDown className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            <button className="flex flex-col items-center gap-1 text-white drop-shadow-lg">
              <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Share</span>
            </button>

            <Link href={`/series/${short.slug}`} className="flex flex-col items-center gap-1 text-white drop-shadow-lg">
              <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors">
                <LinkIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Series</span>
            </Link>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-10 left-4 right-20 z-50 text-white pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-rose-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Short</span>
               <span className="text-zinc-400 text-xs font-medium">#{index + 1} in Feed</span>
            </div>
            <h3 className="font-black text-xl leading-tight drop-shadow-2xl">@{short.title}</h3>
            {short.subtitle && (
              <p className="text-sm text-zinc-200 mt-2 line-clamp-2 drop-shadow-lg max-w-[80%] font-medium opacity-90">{short.subtitle}</p>
            )}
          </div>

          {/* Gradient Overlay for readability */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent z-40 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
