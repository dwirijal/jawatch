'use client';

import * as React from 'react';
import Image from 'next/image';
import { Play, ChevronRight, Clock } from 'lucide-react';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { Progress } from '@/components/atoms/Progress';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { useAuthGate } from '@/components/hooks/useAuthGate';
import { getHistoryForAuth, HistoryItem, MediaType } from '@/lib/store';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface ContinueWatchingProps {
  type?: MediaType;
  title?: string;
  limit?: number;
}

export function ContinueWatching({ type, title = 'Continue Watching', limit = 10 }: ContinueWatchingProps) {
  const authGate = useAuthGate();
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const nextHistory = getHistoryForAuth(authGate.authenticated);
    const filteredHistory = type ? nextHistory.filter((item) => item.type === type) : nextHistory;
    setHistory(filteredHistory.slice(0, limit));
    setMounted(true);
  }, [authGate.authenticated, limit, type]);

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
      <section className="animate-in space-y-4 fade-in slide-in-from-bottom-4 duration-700">
        <SectionHeader title={title} icon={Clock} />

        <AuthGateNotice
          compact
          loginHref={authGate.loginHref}
          title={`${title} is available after login`}
          description="Sign in to unlock your local watch progress on this device."
          actionLabel="Login"
        />
      </section>
    );
  }

  if (history.length === 0) return null;

  return (
    <section className="animate-in space-y-4 fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader
        title={title}
        icon={Clock}
        action={
          <Button variant="ghost" size="sm" className="hidden text-muted-foreground hover:text-foreground md:flex" asChild>
            <Link href="/vault/history">
              View Full History <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <ScrollArea className="w-full overflow-hidden">
        <div className="flex gap-4 pb-4 md:gap-6 md:pb-6">
          {history.map((item) => {
            const config = THEME_CONFIG[item.type as ThemeType] || THEME_CONFIG.default;
            const progress = getProgress(item.id);

            return (
              <Paper
                key={item.id}
                asChild
                tone="muted"
                shadow="sm"
                padded={false}
                interactive
                className={cn(
                  "group relative w-[68vw] max-w-[16rem] min-w-[14rem] flex-shrink-0 overflow-hidden sm:w-[52vw] sm:max-w-[18rem] md:w-80",
                  config.hoverBorder
                )}
              >
                <Link href={item.lastLink} className="block">
                  <div className="relative aspect-video border-b border-border-subtle bg-surface-2">
                    <Image
                      src={item.image || '/placeholder-poster.jpg'}
                      alt={item.title}
                      fill
                      className="h-full w-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-40"
                      sizes="(max-width: 768px) 256px, 320px"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 flex scale-90 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl", config.primary, config.shadow)}>
                        <Play className="ml-1 h-6 w-6 fill-current" />
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Badge variant={item.type as ThemeType} className="px-2.5 py-0.5 text-[9px] tracking-[0.2em]">
                          {item.type}
                        </Badge>
                      </div>
                      <h3 className="line-clamp-1 text-sm font-black tracking-tight text-white">{item.title}</h3>
                      <p className="mt-1 line-clamp-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {item.type === 'manga' ? 'Read:' : 'Watch:'} {item.lastChapterOrEpisode}
                      </p>
                    </div>
                  </div>

                  <Progress
                    value={progress}
                    theme={item.type as ThemeType}
                    className="absolute bottom-0 left-0"
                  />
                </Link>
              </Paper>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
