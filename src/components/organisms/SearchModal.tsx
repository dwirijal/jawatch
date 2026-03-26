'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, Command, Play, BookOpen, Zap, Loader2, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Kbd } from '@/components/atoms/Kbd';
import { ModalContent, ModalRoot, ModalTitle } from '@/components/atoms/Modal';
import { Paper } from '@/components/atoms/Paper';
import { MangaSearchResult, AnichinDonghua } from '@/lib/api';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { useUIStore } from '@/store/useUIStore';

type AnimeSearchModalResult = {
  title: string;
  slug: string;
  thumb: string;
};

type MovieSearchModalResult = {
  title: string;
  slug: string;
  poster: string;
};

const RESULT_THEME = {
  manga: 'manga',
  anime: 'anime',
  donghua: 'donghua',
  movies: 'movie',
} as const;

const RESULT_ICON = {
  manga: BookOpen,
  anime: Play,
  donghua: Zap,
  movies: Film,
} as const;

const RESULT_ICON_CLASS = {
  manga: 'text-orange-400',
  anime: 'text-blue-400',
  donghua: 'text-red-400',
  movies: 'text-indigo-400',
} as const;

export function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{ type: string; title: string; slug: string; image: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const latestRequestId = React.useRef(0);

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
    if (query.length < 3) {
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
          const [mangaRes, animeRes, movieRes, donghuaRes] = await Promise.all([
            fetch(`/api/search/manga?q=${encodeURIComponent(query)}&page=1&limit=5`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`manga search route failed with status ${response.status}`);
                }
                return response.json() as Promise<MangaSearchResult[]>;
              })
              .catch(() => [] as MangaSearchResult[]),
            fetch(`/api/search/anime?q=${encodeURIComponent(query)}&limit=5`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`anime search route failed with status ${response.status}`);
                }
                return response.json() as Promise<AnimeSearchModalResult[]>;
              })
              .catch(() => [] as AnimeSearchModalResult[]),
            fetch(`/api/search/movies?q=${encodeURIComponent(query)}&limit=5`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`movie search route failed with status ${response.status}`);
                }
                return response.json() as Promise<MovieSearchModalResult[]>;
              })
              .catch(() => [] as MovieSearchModalResult[]),
            fetch(`/api/search/donghua?q=${encodeURIComponent(query)}`)
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`donghua search route failed with status ${response.status}`);
                }
                return response.json() as Promise<AnichinDonghua[]>;
              })
              .catch(() => [] as AnichinDonghua[]),
          ]);

          if (latestRequestId.current !== requestId) {
            return;
          }

          const initialCombined = [
            ...(mangaRes || []).slice(0, 5).map((m) => ({ type: 'manga', title: m.title, slug: m.slug, image: m.thumbnail })),
            ...(animeRes || []).slice(0, 5).map((a) => ({ type: 'anime', title: a.title, slug: a.slug, image: a.thumb })),
            ...(movieRes || []).slice(0, 5).map((m) => ({ type: 'movies', title: m.title, slug: m.slug, image: m.poster })),
            ...(donghuaRes || []).slice(0, 5).map((d) => ({ type: 'donghua', title: d.title, slug: d.slug, image: d.thumb || d.image || '' })),
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

  const onSelect = (type: string, slug: string) => {
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
        className="hidden items-center gap-4 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-zinc-400 hover:bg-surface-elevated hover:text-white md:flex"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Search anything...</span>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-xs)] border border-border-subtle bg-surface-2 px-1.5 py-0.5">
          <Command className="w-2.5 h-2.5" />
          <span className="text-[10px] font-black">K</span>
        </div>
      </Button>

      <ModalRoot open={isSearchOpen} onOpenChange={setSearchOpen}>
          <ModalContent className="w-full max-w-xl p-4 animate-in zoom-in-95 duration-300" overlayClassName="z-[200] animate-in fade-in duration-300">
            <ModalTitle className="sr-only">Search media</ModalTitle>
            <Paper tone="muted" shadow="md" padded={false} className="overflow-hidden rounded-[var(--radius-2xl)]">
              <div className="flex items-center border-b border-border-subtle px-4 py-4">
                <Search className="mr-3 h-5 w-5 text-zinc-500" />
                <Input
                  autoFocus
                  placeholder="Search Anime, Movies, Manga, Donghua..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      openSearchResults();
                    }
                  }}
                  className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-base font-medium text-white placeholder:text-zinc-600 focus-visible:ring-0 md:text-lg"
                />
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                    className="h-8 w-8 rounded-[var(--radius-xs)] text-zinc-500"
                  >
                    <X className="h-5 w-5 text-zinc-500" />
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-5 p-4">
                  {results.length > 0 ? (
                    <div className="space-y-2">
                      {results.map((item, idx) => (
                        <Paper
                          key={`${item.slug}-${idx}`}
                          asChild
                          tone="muted"
                          padded={false}
                          className="overflow-hidden border-transparent transition-colors hover:border-border-subtle hover:bg-surface-elevated"
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(item.type, item.slug)}
                            className="group flex w-full items-center gap-4 p-3 text-left"
                          >
                            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[var(--radius-xs)] border border-border-subtle bg-surface-2">
                              <Image
                                src={item.image || '/favicon.ico'}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                {React.createElement(RESULT_ICON[item.type as keyof typeof RESULT_ICON], {
                                  className: cn(
                                    'h-3 w-3',
                                    item.type !== 'manga' && 'fill-current',
                                    RESULT_ICON_CLASS[item.type as keyof typeof RESULT_ICON_CLASS]
                                  ),
                                })}
                                <Badge
                                  variant={RESULT_THEME[item.type as keyof typeof RESULT_THEME] ?? 'outline'}
                                  className="px-2 py-0.5 text-[9px] tracking-[0.16em]"
                                >
                                  {item.type}
                                </Badge>
                              </div>
                              <h4 className="line-clamp-1 text-sm font-bold text-zinc-200 transition-colors group-hover:text-white">{item.title}</h4>
                            </div>
                          </button>
                        </Paper>
                      ))}
                    </div>
                  ) : query.length >= 3 && !loading ? (
                    <Paper tone="outline" className="py-12 text-center">
                      <p className="text-sm font-medium text-zinc-500">No results found for &quot;{query}&quot;</p>
                    </Paper>
                  ) : (
                    <Paper tone="outline" className="space-y-2 py-12 text-center">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Start typing to search</p>
                      <p className="text-[10px] font-bold text-zinc-600">MINIMUM 3 CHARACTERS</p>
                    </Paper>
                  )}
                </div>
                <ScrollBar />
              </ScrollArea>
              
              <div className="flex items-center justify-between border-t border-border-subtle bg-surface-1 px-6 py-3">
                 <div className="flex items-center gap-4">
                    {query.trim().length >= 2 ? (
                      <Button type="button" variant="outline" size="sm" onClick={openSearchResults}>
                        View all results
                      </Button>
                    ) : null}
                    <div className="flex items-center gap-1.5">
                       <Kbd className="border-border-subtle bg-surface-2 text-[10px] text-zinc-300">ESC</Kbd>
                       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">to close</span>
                    </div>
                 </div>
                 <span className="text-[9px] font-black uppercase italic text-zinc-600">Powered by dwizzyWEEB</span>
              </div>
            </Paper>
          </ModalContent>
      </ModalRoot>
    </>
  );
}
