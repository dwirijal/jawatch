'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ChevronRight, Clock } from 'lucide-react';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { Button } from '@/components/atoms/Button';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { useAuthGate } from '@/components/hooks/useAuthGate';
import { getHistoryForAuth, HistoryItem } from '@/lib/store';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

export function ContinueWatching() {
  const authGate = useAuthGate();
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setHistory(getHistoryForAuth(authGate.authenticated).slice(0, 10));
    setMounted(true);
  }, [authGate.authenticated]);

  // Use a deterministic "hash" instead of Math.random to satisfy linter purity rules
  const getProgress = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 10 + (Math.abs(hash) % 80); // Consistent 10-90%
  };

  if (!mounted || authGate.loading) return null;

  if (!authGate.authenticated) {
    return (
      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-zinc-900 rounded-xl border border-zinc-800">
              <Clock className="w-5 h-5 text-zinc-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-white">Continue Watching</h2>
          </div>
        </div>

        <AuthGateNotice
          compact
          loginHref={authGate.loginHref}
          title="Continue watching is available after login"
          description="Sign in to unlock your local watch progress on this device."
          actionLabel="Login"
        />
      </section>
    );
  }

  if (history.length === 0) return null;

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-zinc-950" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-white">Continue Watching</h2>
        </div>
        <Button variant="ghost" size="sm" className="hidden md:flex text-zinc-500 hover:text-white" asChild>
          <Link href="/collection">
            View Full History <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      <ScrollArea className="w-full overflow-hidden">
        <div className="flex gap-6 pb-6">
          {history.map((item) => {
            const config = THEME_CONFIG[item.type as ThemeType] || THEME_CONFIG.default;
            const progress = getProgress(item.id);

            return (
              <div key={item.id} className="flex-shrink-0 w-64 md:w-80 group relative">
                <Link href={item.lastLink} className={cn(
                  "block relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 transition-all shadow-2xl bg-zinc-900",
                  config.hoverBorder
                )}>
                  <Image
                    src={item.image || '/placeholder-poster.jpg'}
                    alt={item.title}
                    fill
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all group-hover:scale-105 duration-700"
                    sizes="(max-width: 768px) 256px, 320px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 duration-300">
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-2xl text-white", config.primary, config.shadow)}>
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full border",
                        config.bg, config.text, config.border
                      )}>
                        {item.type}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-white line-clamp-1 uppercase italic tracking-tight">{item.title}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 line-clamp-1">
                      {item.type === 'manga' ? 'Read:' : 'Watch:'} {item.lastChapterOrEpisode}
                    </p>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 h-1.5 bg-zinc-800 w-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", config.primary, config.shadow)} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
