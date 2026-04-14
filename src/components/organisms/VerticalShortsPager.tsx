'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Share2, User } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { useUIStore } from '@/store/useUIStore';

interface ShortEpisode {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  mirrors?: any[];
}

interface VerticalShortsPagerProps {
  episodes: ShortEpisode[];
  onExit: () => void;
}

export function VerticalShortsPager({ episodes, onExit }: VerticalShortsPagerProps) {
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
      className="fixed inset-0 z-[100] h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide"
    >
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onExit}
          className="fixed left-4 top-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-90"
          aria-label="Exit immersive mode"
        >
          <ArrowLeft className="h-6 w-6" />
        </motion.button>
      </AnimatePresence>

      {episodes.map((episode, i) => (
        <section 
          key={episode.slug} 
          className="relative h-screen w-full snap-start overflow-hidden"
        >
          {Math.abs(i - activeIndex) <= 1 && (
            <VideoPlayer
              format="shorts"
              src={episode.videoUrl}
              autoPlay={i === activeIndex}
              mirrors={episode.mirrors}
            />
          )}

          {/* Right Side Actions */}
          <div className="absolute bottom-32 right-4 z-10 flex flex-col items-center gap-6">
            <div className="group flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-background/40 backdrop-blur-md">
                <User className="h-6 w-6 text-accent" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">Follow</span>
            </div>

            <button 
              className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
              aria-label="View comments"
            >
              <MessageSquare className="h-7 w-7 drop-shadow-md" />
              <span className="text-xs font-bold text-white shadow-sm">2.4k</span>
            </button>

            <button 
              className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
              aria-label="Share this short"
            >
              <Share2 className="h-7 w-7 drop-shadow-md" />
              <span className="text-xs font-bold text-white shadow-sm">Share</span>
            </button>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-8 left-4 right-16 z-10 space-y-2 pointer-events-none">
            <h2 className="text-lg font-black tracking-tight text-white drop-shadow-lg line-clamp-1">
              {episode.title}
            </h2>
            <p className="text-sm font-medium text-white/80 line-clamp-2 drop-shadow-md">
              {episode.subtitle}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Trending Now</span>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
