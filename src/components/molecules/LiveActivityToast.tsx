'use client';

import * as React from 'react';
import { Play, BookOpen, Film, Zap } from 'lucide-react';
import { animate } from 'animejs';
import { cn } from '@/lib/utils';

const ACTIVITIES = [
  { name: "Andi", action: "watching", target: "One Piece", type: "anime" },
  { name: "Budi", action: "reading", target: "Solo Leveling", type: "manga" },
  { name: "Citra", action: "watching", target: "Link Click", type: "donghua" },
  { name: "Dewi", action: "watching", target: "The Batman", type: "movie" },
  { name: "Eko", action: "watching", target: "Naruto", type: "anime" },
  { name: "Fany", action: "reading", target: "Berserk", type: "manga" },
];

export function LiveActivityToast() {
  const [current, setCurrent] = React.useState<typeof ACTIVITIES[0] | null>(null);
  const toastRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const showToast = () => {
      const random = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      setCurrent(random);

      // Animate In
      if (toastRef.current) {
        animate(toastRef.current, {
          translateX: [100, 0],
          opacity: [0, 1],
          duration: 1000,
          ease: 'outExpo'
        });

        // Animate Out after 5s
        setTimeout(() => {
          if (toastRef.current) {
            animate(toastRef.current, {
              translateX: [0, 100],
              opacity: [1, 0],
              duration: 1000,
              ease: 'inExpo',
              complete: () => setCurrent(null)
            });
          }
        }, 5000);
      }
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) showToast();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (!current) return null;

  const Icons = {
    anime: Play,
    manga: BookOpen,
    donghua: Zap,
    movie: Film
  };
  const Icon = Icons[current.type as keyof typeof Icons];

  return (
    <div 
      ref={toastRef}
      className="fixed bottom-24 right-8 z-[200] hidden md:block"
    >
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[280px]">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          current.type === 'anime' && "bg-blue-600/20 text-blue-500",
          current.type === 'manga' && "bg-orange-600/20 text-orange-500",
          current.type === 'donghua' && "bg-red-600/20 text-red-500",
          current.type === 'movie' && "bg-indigo-600/20 text-indigo-500",
        )}>
          <Icon className="w-5 h-5 fill-current" />
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Activity</p>
          <p className="text-sm font-bold text-zinc-200">
            <span className="text-white italic">{current.name}</span> is {current.action}
          </p>
          <p className={cn(
            "text-xs font-black uppercase italic tracking-tighter truncate max-w-[180px]",
            current.type === 'anime' && "text-blue-400",
            current.type === 'manga' && "text-orange-400",
            current.type === 'donghua' && "text-red-400",
            current.type === 'movie' && "text-indigo-400",
          )}>
            {current.target}
          </p>
        </div>
      </div>
    </div>
  );
}
