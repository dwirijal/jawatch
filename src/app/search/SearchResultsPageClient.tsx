'use client';

import * as React from 'react';
import { BookOpen, Film, Play, Search, type LucideIcon, Zap } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AdSection } from '@/components/organisms/AdSection';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Paper } from '@/components/atoms/Paper';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { Badge } from '@/components/atoms/Badge';
import type { ThemeType } from '@/lib/utils';
import type { AnichinDonghua, MangaSearchResult } from '@/lib/api';

type SearchDomain = 'all' | 'anime' | 'movies' | 'manga' | 'donghua';

type AnimeResult = {
  title: string;
  slug: string;
  thumb: string;
  type?: string;
  status?: string;
  episode?: string;
};

type MovieResult = {
  title: string;
  slug: string;
  poster: string;
  year?: string;
  type?: string;
  rating?: string;
};

type SearchCardItem = {
  id: string;
  href: string;
  title: string;
  image: string;
  subtitle?: string;
  badgeText?: string;
  theme: Exclude<ThemeType, 'default'>;
};

type DomainState = {
  loading: boolean;
  error: string | null;
  items: SearchCardItem[];
  page: number;
  hasMore: boolean;
};

const DOMAIN_CONFIG: Record<Exclude<SearchDomain, 'all'>, {
  label: string;
  icon: LucideIcon;
  theme: Exclude<ThemeType, 'default'>;
}> = {
  anime: { label: 'Anime', icon: Play, theme: 'anime' },
  movies: { label: 'Movies', icon: Film, theme: 'movie' },
  manga: { label: 'Manga', icon: BookOpen, theme: 'manga' },
  donghua: { label: 'Donghua', icon: Zap, theme: 'donghua' },
};

const DOMAIN_ORDER: SearchDomain[] = ['all', 'anime', 'movies', 'manga', 'donghua'];
const OVERVIEW_LIMIT = 6;
const DOMAIN_LIMIT = 24;
const REAL_PAGINATION_DOMAINS: ReadonlySet<Exclude<SearchDomain, 'all'>> = new Set(['manga']);

function getInitialState(): Record<Exclude<SearchDomain, 'all'>, DomainState> {
  return {
    anime: { loading: false, error: null, items: [], page: 1, hasMore: false },
    movies: { loading: false, error: null, items: [], page: 1, hasMore: false },
    manga: { loading: false, error: null, items: [], page: 1, hasMore: false },
    donghua: { loading: false, error: null, items: [], page: 1, hasMore: false },
  };
}

function mergeUniqueItems(currentItems: SearchCardItem[], nextItems: SearchCardItem[]) {
  const seen = new Set(currentItems.map((item) => item.id));
  const merged = [...currentItems];

  for (const item of nextItems) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

function normalizeAnimeResults(items: AnimeResult[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `anime:${item.slug}`,
    href: `/anime/${item.slug}`,
    title: item.title,
    image: item.thumb,
    subtitle: [item.status, item.episode].filter(Boolean).join(' • ') || undefined,
    badgeText: item.type || 'Anime',
    theme: 'anime',
  }));
}

function normalizeMovieResults(items: MovieResult[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `movies:${item.slug}`,
    href: `/movies/${item.slug}`,
    title: item.title,
    image: item.poster,
    subtitle: [item.year, item.type?.toUpperCase()].filter(Boolean).join(' • ') || undefined,
    badgeText: item.rating ? `★ ${item.rating}` : item.type?.toUpperCase(),
    theme: 'movie',
  }));
}

function normalizeMangaResults(items: MangaSearchResult[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `manga:${item.slug}`,
    href: `/manga/${item.slug}`,
    title: item.title,
    image: item.thumbnail || item.image,
    subtitle: item.chapter || item.time_ago || undefined,
    badgeText: item.type || 'Manga',
    theme: 'manga',
  }));
}

function normalizeDonghuaResults(items: AnichinDonghua[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `donghua:${item.slug}`,
    href: `/donghua/${item.slug}`,
    title: item.title,
    image: item.thumb || item.image || '',
    subtitle: item.episode || item.status || undefined,
    badgeText: item.type || 'Donghua',
    theme: 'donghua',
  }));
}

async function fetchDomainResults(
  domain: Exclude<SearchDomain, 'all'>,
  query: string,
  page: number,
  limit: number,
): Promise<SearchCardItem[]> {
  const url = new URL(`/api/search/${domain}`, window.location.origin);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Search failed for ${domain}`);
  }

  if (domain === 'anime') {
    return normalizeAnimeResults(await response.json() as AnimeResult[]);
  }
  if (domain === 'movies') {
    return normalizeMovieResults(await response.json() as MovieResult[]);
  }
  if (domain === 'manga') {
    return normalizeMangaResults(await response.json() as MangaSearchResult[]);
  }
  return normalizeDonghuaResults(await response.json() as AnichinDonghua[]);
}

export default function SearchResultsPageClient({
  initialQuery,
  initialType = 'all',
}: {
  initialQuery: string;
  initialType?: SearchDomain;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = React.useState(initialQuery);
  const [activeTab, setActiveTab] = React.useState<SearchDomain>(initialType);
  const [domainState, setDomainState] = React.useState<Record<Exclude<SearchDomain, 'all'>, DomainState>>(getInitialState);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    setInputValue(initialQuery);
  }, [initialQuery]);

  React.useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  React.useEffect(() => {
    const query = initialQuery.trim();
    if (query.length < 2) {
      setDomainState(getInitialState());
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const targets = activeTab === 'all'
      ? (['anime', 'movies', 'manga', 'donghua'] as const)
      : [activeTab];

    targets.forEach((domain) => {
      setDomainState((current) => ({
        ...current,
        [domain]: {
          ...current[domain],
          loading: true,
          error: null,
          page: 1,
        },
      }));

      void fetchDomainResults(domain, query, 1, activeTab === 'all' ? OVERVIEW_LIMIT : DOMAIN_LIMIT)
        .then((items) => {
          if (requestIdRef.current !== requestId) {
            return;
          }
          setDomainState((current) => ({
            ...current,
            [domain]: {
              loading: false,
              error: null,
              items,
              page: 1,
              hasMore: activeTab !== 'all' && REAL_PAGINATION_DOMAINS.has(domain) && items.length === DOMAIN_LIMIT,
            },
          }));
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) {
            return;
          }
          setDomainState((current) => ({
            ...current,
            [domain]: {
              ...current[domain],
              loading: false,
              error: 'Failed to load results.',
              page: 1,
              hasMore: false,
            },
          }));
        });
    });
  }, [activeTab, initialQuery]);

  const submitSearch = React.useCallback((nextQuery: string, nextTab: SearchDomain = activeTab) => {
    const trimmed = nextQuery.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    params.set('type', nextTab);
    router.push(`${pathname}?${params.toString()}`);
  }, [activeTab, pathname, router, searchParams]);

  const activeLoading = activeTab === 'all'
    ? Object.values(domainState).some((state) => state.loading)
    : domainState[activeTab].loading;

  const loadMore = React.useCallback(() => {
    if (activeTab === 'all') {
      return;
    }

    const query = initialQuery.trim();
    if (query.length < 2) {
      return;
    }

    const nextPage = domainState[activeTab].page + 1;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setDomainState((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        loading: true,
        error: null,
      },
    }));

    void fetchDomainResults(activeTab, query, nextPage, DOMAIN_LIMIT)
      .then((items) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setDomainState((current) => ({
          ...current,
          [activeTab]: {
            loading: false,
            error: null,
            items: mergeUniqueItems(current[activeTab].items, items),
            page: nextPage,
            hasMore: items.length === DOMAIN_LIMIT,
          },
        }));
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setDomainState((current) => ({
          ...current,
          [activeTab]: {
            ...current[activeTab],
            loading: false,
            error: 'Failed to load more results.',
          },
        }));
      });
  }, [activeTab, domainState, initialQuery]);

  return (
    <div className="app-shell">
      <main className="app-container-wide app-section-stack pt-6 sm:pt-8 md:pt-10">
        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Search Results</p>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              Explore results across anime, movies, manga, and donghua.
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Search stays light in the modal. Full browsing happens here, with cached results per domain and only the active tab loading full cards.
            </p>
          </div>

          <Paper tone="muted" className="space-y-4">
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch(inputValue);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Search titles..."
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {DOMAIN_ORDER.map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === 'all' ? 'All Results' : DOMAIN_CONFIG[tab].label;
                return (
                  <Button
                    key={tab}
                    type="button"
                    variant={isActive ? 'outline' : 'ghost'}
                    size="sm"
                    className={isActive ? 'text-white' : undefined}
                    onClick={() => {
                      submitSearch(inputValue, tab);
                    }}
                  >
                    {label}
                    {tab !== 'all' && domainState[tab].items.length > 0 ? (
                      <Badge variant={DOMAIN_CONFIG[tab].theme} className="px-1.5 py-0.5 text-[9px] tracking-[0.12em]">
                        {domainState[tab].items.length}
                      </Badge>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          </Paper>
        </section>

        <AdSection />

        {initialQuery.trim().length < 2 ? (
          <StateInfo title="Start a search" description="Use at least 2 characters to search across all supported media domains." />
        ) : activeTab === 'all' ? (
          <div className="space-y-10">
            {(Object.keys(DOMAIN_CONFIG) as Array<Exclude<SearchDomain, 'all'>>).map((domain) => (
              <SectionCard
                key={domain}
                title={DOMAIN_CONFIG[domain].label}
                subtitle={`Top cached matches for “${initialQuery}”`}
                icon={DOMAIN_CONFIG[domain].icon}
                viewAllHref={`/search?q=${encodeURIComponent(initialQuery)}&type=${domain}`}
              >
                {domainState[domain].loading ? (
                  Array.from({ length: OVERVIEW_LIMIT }).map((_, index) => (
                    <Paper key={`${domain}-skeleton-${index}`} tone="muted" className="aspect-[3/4] animate-pulse bg-surface-2" />
                  ))
                ) : domainState[domain].error ? (
                  <StateInfo className="col-span-full" type="error" title="Search failed" description={domainState[domain].error} />
                ) : domainState[domain].items.length > 0 ? (
                  domainState[domain].items.map((item) => (
                    <Card
                      key={item.id}
                      href={item.href}
                      image={item.image}
                      title={item.title}
                      subtitle={item.subtitle}
                      badgeText={item.badgeText}
                      theme={item.theme}
                    />
                  ))
                ) : (
                  <StateInfo className="col-span-full" title={`No ${DOMAIN_CONFIG[domain].label.toLowerCase()} matches`} description={`Try another query or switch domain.`} />
                )}
              </SectionCard>
            ))}
          </div>
        ) : (
          <SectionCard
            title={`${DOMAIN_CONFIG[activeTab].label} Results`}
            subtitle={`Showing cached matches for “${initialQuery}” in pages of ${DOMAIN_LIMIT}`}
            icon={DOMAIN_CONFIG[activeTab].icon}
          >
            {domainState[activeTab].loading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <Paper key={`${activeTab}-skeleton-${index}`} tone="muted" className="aspect-[3/4] animate-pulse bg-surface-2" />
              ))
            ) : domainState[activeTab].error ? (
              <StateInfo className="col-span-full" type="error" title="Search failed" description={domainState[activeTab].error} />
            ) : domainState[activeTab].items.length > 0 ? (
              domainState[activeTab].items.map((item) => (
                <Card
                  key={item.id}
                  href={item.href}
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  badgeText={item.badgeText}
                  theme={item.theme}
                />
              ))
            ) : (
              <StateInfo className="col-span-full" title="No matches found" description={`No ${DOMAIN_CONFIG[activeTab].label.toLowerCase()} results matched “${initialQuery}”.`} />
            )}
          </SectionCard>
        )}

        {activeTab !== 'all' && REAL_PAGINATION_DOMAINS.has(activeTab) && domainState[activeTab].items.length > 0 ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={loadMore}
              disabled={activeLoading || !domainState[activeTab].hasMore}
            >
              {activeLoading ? 'Loading…' : domainState[activeTab].hasMore ? 'Load more' : 'No more results'}
            </Button>
          </div>
        ) : null}

        {activeLoading ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Loading cached results…</p>
        ) : null}
      </main>
    </div>
  );
}
