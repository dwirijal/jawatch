'use client';

import * as React from 'react';
import Image from 'next/image';
import { BookOpen, Command, Film, Loader2, Search, Tv, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Kbd } from '@/components/atoms/Kbd';
import { ModalContent, ModalRoot, ModalTitle } from '@/components/atoms/Modal';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea } from '@/components/atoms/ScrollArea';
import { useUIStore } from '@/store/useUIStore';
import { reportClientError } from '@/lib/client-log';
import { cn } from '@/lib/utils';
import type { SearchResultItem, UnifiedSearchResult } from '@/lib/search/search-contract';

const RESULT_ICON = {
  comic: BookOpen,
  series: Tv,
  movies: Film,
} as const;

const RESULT_ICON_CLASS = {
  comic: 'text-[var(--signal-warning)]',
  series: 'text-[var(--signal-danger)]',
  movies: 'text-indigo-400',
} as const;

function createEmptySearchState(query: string): UnifiedSearchResult {
  return {
    query,
    domain: 'all',
    source: 'empty',
    total: 0,
    topMatch: null,
    groups: [],
  };
}

function flattenPreviewItems(result: UnifiedSearchResult): SearchResultItem[] {
  const topMatchId = result.topMatch?.id;
  return result.groups
    .flatMap((group) => group.items)
    .filter((item) => item.id !== topMatchId)
    .slice(0, 6);
}

function buildSearchCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

export function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [result, setResult] = React.useState<UnifiedSearchResult>(createEmptySearchState(''));
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const latestRequestId = React.useRef(0);
  const searchCacheRef = React.useRef(new Map<string, UnifiedSearchResult>());
  const inputId = React.useId();
  const normalizedQuery = query.trim();
  const deferredQuery = React.useDeferredValue(normalizedQuery);
  const previewItems = React.useMemo(() => flattenPreviewItems(result), [result]);

  const openSearchResults = React.useCallback(() => {
    if (normalizedQuery.length < 2) {
      return;
    }

    setSearchOpen(false);
    setLoading(false);
    setResult(createEmptySearchState(''));
    latestRequestId.current += 1;
    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}&type=all`);
  }, [normalizedQuery, router, setSearchOpen]);

  React.useEffect(() => {
    if (deferredQuery.length < 2) {
      latestRequestId.current += 1;
      setLoading(false);
      setResult(createEmptySearchState(deferredQuery));
      return;
    }

    const cacheKey = buildSearchCacheKey(deferredQuery);
    const cachedResult = searchCacheRef.current.get(cacheKey);
    if (cachedResult) {
      latestRequestId.current += 1;
      setLoading(false);
      setResult(cachedResult);
      return;
    }

    let controller: AbortController | null = null;
    const timeoutId = window.setTimeout(() => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;
      controller = new AbortController();

      void (async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(deferredQuery)}&type=all&limit=4`, {
            signal: controller?.signal,
          });
          if (!response.ok) {
            throw new Error(`search route failed with status ${response.status}`);
          }

          const payload = await response.json() as UnifiedSearchResult;
          if (latestRequestId.current !== requestId) {
            return;
          }

          searchCacheRef.current.set(cacheKey, payload);
          setResult(payload);
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }

          if (latestRequestId.current === requestId) {
            reportClientError(error, 'Search preview request failed');
            setResult(createEmptySearchState(deferredQuery));
          }
        } finally {
          if (latestRequestId.current === requestId) {
            setLoading(false);
          }
        }
      })();
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [deferredQuery]);

  const onSelect = React.useCallback((href: string) => {
    setSearchOpen(false);
    setQuery('');
    setResult(createEmptySearchState(''));
    setLoading(false);
    latestRequestId.current += 1;
    router.push(href);
  }, [router, setSearchOpen]);

  return (
    <ModalRoot open={isSearchOpen} onOpenChange={setSearchOpen}>
      <ModalContent className="w-full max-w-3xl p-[var(--space-md)] animate-in zoom-in-95 duration-300" overlayClassName="z-[200] bg-surface-1/50 backdrop-blur-2xl animate-in fade-in duration-300">
        <ModalTitle className="sr-only">Cari konten</ModalTitle>
        <Paper glassy padded={false} className="overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-elevated shadow-[0_34px_90px_-48px_var(--shadow-color-strong)]">
          <div className="flex items-center border-b border-border-subtle bg-surface-1 px-[var(--space-xl)] py-6">
            <Search className="mr-4 h-6 w-6 text-muted-foreground" />
            <Input
              id={inputId}
              variant="search"
              autoFocus
              placeholder="Cari judul nonton atau baca..."
              aria-label="Cari konten"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  openSearchResults();
                }
              }}
              className="h-auto flex-1 border-0 px-0 py-0 text-lg font-black uppercase tracking-[var(--type-tracking-normal)] text-foreground shadow-none focus-visible:ring-0 md:text-2xl"
            />
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(false)}
                aria-label="Tutup pencarian"
                className="h-[calc(var(--size-control-md)-var(--space-2xs))] w-[calc(var(--size-control-md)-var(--space-2xs))] rounded-full text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 p-[var(--space-xl)]">
              {result.topMatch ? (
                <Paper asChild tone="muted" shadow="sm" interactive className="overflow-hidden p-0">
                  <button type="button" onClick={() => onSelect(result.topMatch!.href)} className="grid w-full gap-0 text-left sm:grid-cols-[7rem_minmax(0,1fr)]">
                    <div className="relative aspect-[4/3] overflow-hidden border-b border-border-subtle sm:aspect-auto sm:border-b-0 sm:border-r">
                      <Image
                        src={result.topMatch.image || '/favicon.ico'}
                        alt={result.topMatch.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(9,10,14,0.52)_100%)]" />
                    </div>
                    <div className="space-y-3 p-[var(--space-md)]">
                      <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
                        <Badge variant={result.topMatch.theme}>Paling cocok</Badge>
                        {result.topMatch.badgeText ? <Badge variant="outline">{result.topMatch.badgeText}</Badge> : null}
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-[var(--font-heading)] text-xl font-bold tracking-[-0.04em] text-foreground">
                          {result.topMatch.title}
                        </h3>
                        {result.topMatch.subtitle ? (
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{result.topMatch.subtitle}</p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </Paper>
              ) : null}

              {previewItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2">
                  {previewItems.map((item) => {
                    const Icon = RESULT_ICON[item.routeType];
                    return (
                      <Paper
                        key={item.id}
                        asChild
                        tone="muted"
                        padded={false}
                        className="group relative overflow-hidden transition-all hover:border-border-strong hover:bg-surface-elevated hover:-translate-y-0.5"
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(item.href)}
                          className="flex w-full items-center gap-[var(--space-md)] p-[var(--space-sm)] text-left"
                        >
                          <div className="relative h-20 w-[calc(var(--size-control-lg)+var(--space-xs))] shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 refractive-border">
                            <Image
                              src={item.image || '/favicon.ico'}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-[var(--space-xs)]">
                              <Icon className={cn('h-3.5 w-3.5', RESULT_ICON_CLASS[item.routeType])} />
                              {item.badgeText ? (
                                <Badge variant={item.theme} className="px-[var(--space-xs)] py-0.5 text-[var(--type-size-xs)] tracking-[var(--type-tracking-kicker)]">
                                  {item.badgeText}
                                </Badge>
                              ) : null}
                            </div>
                            <h3 className="line-clamp-2 font-[var(--font-heading)] text-lg font-bold tracking-[-0.04em] text-foreground">
                              {item.title}
                            </h3>
                            {item.subtitle ? (
                              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.subtitle}</p>
                            ) : null}
                          </div>
                        </button>
                      </Paper>
                    );
                  })}
                </div>
              ) : query.length >= 2 && !loading ? (
                <Paper tone="muted" className="space-y-3 text-center">
                  <p className="font-[var(--font-heading)] text-xl font-bold tracking-[-0.04em] text-foreground">Belum ada hasil</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Coba judul lain atau tekan Enter untuk mencari di semua kategori.
                  </p>
                </Paper>
              ) : (
                <div className="space-y-3">
                  <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Cari cepat</p>
                  <div className="flex flex-wrap gap-[var(--space-xs)]">
                    {['One Piece', 'Solo Leveling', 'Avengers', 'Naruto'].map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery(suggestion)}
                        className="rounded-full"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border-subtle pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-[var(--space-xs)]">
                  <Command className="h-4 w-4" />
                  <span>Tekan Enter untuk lihat semua hasil</span>
                </div>
                <Kbd>Enter</Kbd>
              </div>
            </div>
          </ScrollArea>
        </Paper>
      </ModalContent>
    </ModalRoot>
  );
}
