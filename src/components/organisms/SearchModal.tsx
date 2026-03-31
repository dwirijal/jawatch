'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, Command, BookOpen, Loader2, Film, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Kbd } from '@/components/atoms/Kbd';
import { Typography } from '@/components/atoms/Typography';
import { ModalContent, ModalRoot, ModalTitle } from '@/components/atoms/Modal';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { useUIStore } from '@/store/useUIStore';
import type { MangaSearchResult } from '@/lib/types';
import { getSeriesBadgeText, getSeriesTheme, type SeriesMediaType } from '@/lib/series-presentation';

type SeriesSearchModalResult = {
  title: string;
  slug: string;
  poster: string;
  latestEpisode?: string;
  country?: string;
  type?: SeriesMediaType;
};

type MovieSearchModalResult = {
  title: string;
  slug: string;
  poster: string;
};

const RESULT_THEME = {
  comic: 'manga',
  series: 'drama',
  movies: 'movie',
} as const;

const RESULT_ICON = {
  comic: BookOpen,
  series: Tv,
  movies: Film,
} as const;

const RESULT_ICON_CLASS = {
  comic: 'text-orange-400',
  series: 'text-rose-400',
  movies: 'text-indigo-400',
} as const;

type SearchModalResultItem = {
  routeType: 'comic' | 'series' | 'movies';
  title: string;
  slug: string;
  image: string;
  badgeText?: string;
  theme: 'manga' | 'movie' | 'anime' | 'donghua' | 'drama';
};

export function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchModalResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const latestRequestId = React.useRef(0);
  const inputId = React.useId();

  const openSearchResults = React.useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    setSearchOpen(false);
    setLoading(false);
    setResults([]);
    latestRequestId.current += 1;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&type=all`);
  }, [query, router, setSearchOpen]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchOpen, setSearchOpen]);

  React.useEffect(() => {
    if (query.length < 2) {
      latestRequestId.current += 1;
      setLoading(false);
      setResults([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      void (async () => {
        setLoading(true);
        try {
          const [mangaRes, seriesRes, movieRes] = await Promise.all([
            fetch(`/api/search/comic?q=${encodeURIComponent(query)}&page=1&limit=5`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`manga search route failed with status ${response.status}`);
                }
                return response.json() as Promise<MangaSearchResult[]>;
              })
              .catch(() => [] as MangaSearchResult[]),
            fetch(`/api/search/series?q=${encodeURIComponent(query)}&limit=5`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`series search route failed with status ${response.status}`);
                }
                return response.json() as Promise<SeriesSearchModalResult[]>;
              })
              .catch(() => [] as SeriesSearchModalResult[]),
            fetch(`/api/search/movies?q=${encodeURIComponent(query)}&limit=5`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`movie search route failed with status ${response.status}`);
                }
                return response.json() as Promise<MovieSearchModalResult[]>;
              })
              .catch(() => [] as MovieSearchModalResult[]),
          ]);

          if (latestRequestId.current !== requestId) {
            return;
          }

          const initialCombined = [
            ...(mangaRes || []).slice(0, 5).map((m) => ({
              routeType: 'comic' as const,
              title: m.title,
              slug: m.slug,
              image: m.thumbnail,
              badgeText: m.type || 'Manga',
              theme: 'manga' as const,
            })),
            ...(seriesRes || []).slice(0, 5).map((a) => ({
              routeType: 'series' as const,
              title: a.title,
              slug: a.slug,
              image: a.poster,
              badgeText: getSeriesBadgeText(a.type || 'anime'),
              theme: getSeriesTheme(a.type || 'anime'),
            })),
            ...(movieRes || []).slice(0, 5).map((m) => ({
              routeType: 'movies' as const,
              title: m.title,
              slug: m.slug,
              image: m.poster,
              badgeText: 'MOVIE',
              theme: 'movie' as const,
            })),
          ];

          setResults(initialCombined);
        } catch (err) {
          if (latestRequestId.current === requestId) {
            console.error(err);
          }
        } finally {
          if (latestRequestId.current === requestId) {
            setLoading(false);
          }
        }
      })();
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const onSelect = (type: SearchModalResultItem['routeType'], slug: string) => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    setLoading(false);
    latestRequestId.current += 1;
    router.push(`/${type}/${slug}`);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={() => setSearchOpen(true)}
        className="hidden items-center gap-4 rounded-[var(--radius-sm)] border border-white/5 bg-surface-1/50 backdrop-blur-md px-4 py-2 text-zinc-400 hover:bg-surface-elevated hover:text-white md:flex refractive-border glass-noise"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Search Discovery</span>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-xs)] border border-white/10 bg-white/5 px-1.5 py-0.5">
          <Command className="w-2.5 h-2.5 opacity-50" />
          <span className="text-[9px] font-black">K</span>
        </div>
      </Button>

      <ModalRoot open={isSearchOpen} onOpenChange={setSearchOpen}>
          <ModalContent className="w-full max-w-2xl p-4 animate-in zoom-in-95 duration-300" overlayClassName="z-[200] backdrop-blur-2xl bg-black/60 animate-in fade-in duration-300">
            <ModalTitle className="sr-only">Search media</ModalTitle>
            <Paper glassy padded={false} className="overflow-hidden rounded-[var(--radius-2xl)] bg-background/40 shadow-2xl">
              <div className="flex items-center border-b border-white/5 px-6 py-6 bg-white/5">
                <Search className="mr-4 h-6 w-6 text-white/40" />
                <Input
                  id={inputId}
                  autoFocus
                  placeholder="Type to search anything..."
                  aria-label="Search media"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      openSearchResults();
                    }
                  }}
                  className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-lg font-black uppercase tracking-tight text-white placeholder:text-zinc-600 focus-visible:ring-0 md:text-2xl"
                />
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white/20" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                    className="h-10 w-10 rounded-full bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[65vh]">
                <div className="space-y-6 p-6">
                  {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {results.map((item, idx) => {
                        const Icon = RESULT_ICON[item.routeType as keyof typeof RESULT_ICON];
                        const theme = item.routeType === 'series' ? item.theme : RESULT_THEME[item.routeType as keyof typeof RESULT_THEME];
                        return (
                          <Paper
                            key={`${item.slug}-${idx}`}
                            asChild
                            tone="muted"
                            padded={false}
                            className="group relative overflow-hidden border-white/5 bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => onSelect(item.routeType, item.slug)}
                              className="flex w-full items-center gap-4 p-3 text-left"
                            >
                              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-white/5 bg-surface-2 refractive-border">
                                <Image
                                  src={item.image || '/favicon.ico'}
                                  alt=""
                                  fill
                                  sizes="56px"
                                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                                  unoptimized
                                />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Icon className={cn('h-3.5 w-3.5', RESULT_ICON_CLASS[item.routeType as keyof typeof RESULT_ICON_CLASS])} />
                                  <Badge
                                    variant={theme ?? 'outline'}
                                    className="px-2 py-0.5 text-[8px] tracking-[0.2em]"
                                  >
                                    {item.badgeText || item.routeType}
                                  </Badge>
                                </div>
                                <Typography as="h4" size="base" className="line-clamp-2 font-black leading-tight text-white group-hover:text-white transition-colors">
                                  {item.title}
                                </Typography>
                              </div>
                              {/* Themed Glow Hover */}
                              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 blur-xl transition-opacity", 
                                item.theme === 'manga' ? 'bg-orange-500' : 
                                item.theme === 'anime' || item.theme === 'drama' ? 'bg-rose-500' : 
                                item.theme === 'donghua' ? 'bg-red-500' : 'bg-indigo-500')} 
                              />
                            </button>
                          </Paper>
                        );
                      })}
                    </div>
                  ) : query.length >= 2 && !loading ? (
                    <div className="py-20 text-center">
                      <Typography as="p" size="lg" className="font-bold text-zinc-500">No results found for &quot;{query}&quot;</Typography>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Try searching for something else</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-20 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/5">
                        <Command className="h-8 w-8 text-white/20" />
                      </div>
                      <div className="space-y-1">
                        <Typography as="p" size="xl" uppercase className="font-black tracking-[-0.04em] text-white/40">Enter Search</Typography>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">MINIMUM 2 CHARACTERS</p>
                      </div>
                    </div>
                  )}
                </div>
                <ScrollBar />
              </ScrollArea>
              
              <div className="flex items-center justify-between border-t border-white/5 bg-white/5 px-6 py-4">
                 <div className="flex items-center gap-6">
                    {query.trim().length >= 2 ? (
                      <Button type="button" variant="outline" size="sm" onClick={openSearchResults} className="refractive-border h-9 px-5 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-200 border-none shadow-xl transition-all hover:scale-105 active:scale-95">
                        View all results
                      </Button>
                    ) : null}
                    <div className="flex items-center gap-2">
                       <Kbd className="border-white/10 bg-white/5 text-[9px] text-zinc-400">ESC</Kbd>
                       <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">to close</span>
                    </div>
                 </div>
                 <Typography as="span" size="xs" uppercase className="font-black italic text-white/10 tracking-[0.3em]">dwizzyWEEB</Typography>
              </div>
            </Paper>
          </ModalContent>
      </ModalRoot>
    </>
  );
}
