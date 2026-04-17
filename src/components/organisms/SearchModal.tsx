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
import { cn } from '@/lib/utils';
import type { SearchResultItem, UnifiedSearchResult } from '@/lib/search/search-contract';

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

export function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [result, setResult] = React.useState<UnifiedSearchResult>(createEmptySearchState(''));
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const latestRequestId = React.useRef(0);
  const inputId = React.useId();
  const previewItems = React.useMemo(() => flattenPreviewItems(result), [result]);

  const openSearchResults = React.useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    setSearchOpen(false);
    setLoading(false);
    setResult(createEmptySearchState(''));
    latestRequestId.current += 1;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&type=all`);
  }, [query, router, setSearchOpen]);

  React.useEffect(() => {
    if (query.length < 2) {
      latestRequestId.current += 1;
      setLoading(false);
      setResult(createEmptySearchState(query));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      void (async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all&limit=4`);
          if (!response.ok) {
            throw new Error(`search route failed with status ${response.status}`);
          }

          const payload = await response.json() as UnifiedSearchResult;
          if (latestRequestId.current !== requestId) {
            return;
          }

          setResult(payload);
        } catch (error) {
          if (latestRequestId.current === requestId) {
            console.error(error);
            setResult(createEmptySearchState(query));
          }
        } finally {
          if (latestRequestId.current === requestId) {
            setLoading(false);
          }
        }
      })();
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

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
      <ModalContent className="w-full max-w-3xl p-4 animate-in zoom-in-95 duration-300" overlayClassName="z-[200] bg-black/50 backdrop-blur-2xl animate-in fade-in duration-300">
        <ModalTitle className="sr-only">Search media</ModalTitle>
        <Paper glassy padded={false} className="overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-elevated shadow-[0_34px_90px_-48px_var(--shadow-color-strong)]">
          <div className="flex items-center border-b border-border-subtle bg-surface-1 px-6 py-6">
            <Search className="mr-4 h-6 w-6 text-muted-foreground" />
            <Input
              id={inputId}
              variant="search"
              autoFocus
              placeholder="Search titles across watch and read..."
              aria-label="Search media"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  openSearchResults();
                }
              }}
              className="h-auto flex-1 border-0 px-0 py-0 text-lg font-black uppercase tracking-tight text-foreground shadow-none focus-visible:ring-0 md:text-2xl"
            />
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="h-10 w-10 rounded-full text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 p-6">
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
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(9,10,14,0.52)_100%)]" />
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={result.topMatch.theme}>Top Match</Badge>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                          className="flex w-full items-center gap-4 p-3 text-left"
                        >
                          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 refractive-border">
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
                              <Icon className={cn('h-3.5 w-3.5', RESULT_ICON_CLASS[item.routeType])} />
                              {item.badgeText ? (
                                <Badge variant={item.theme} className="px-2 py-0.5 text-[8px] tracking-[0.2em]">
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
                  <p className="font-[var(--font-heading)] text-xl font-bold tracking-[-0.04em] text-foreground">No title matches yet</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Search stays title-first here. Open the canonical search page for broader grouped results.
                  </p>
                </Paper>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Quick Keys</p>
                  <div className="flex flex-wrap gap-2">
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
                <div className="flex items-center gap-2">
                  <Command className="h-4 w-4" />
                  <span>Open canonical search for the full grouped result view</span>
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
