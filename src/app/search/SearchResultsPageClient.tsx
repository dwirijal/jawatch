'use client';

import * as React from 'react';
import { BookOpen, Film, Search, Tv, type LucideIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Paper } from '@/components/atoms/Paper';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import type { ThemeType } from '@/lib/utils';
import type { MangaSearchResult } from '@/lib/types';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesMediaType,
} from '@/lib/series-presentation';

type SearchDomain = 'all' | 'series' | 'movies' | 'comic';

type SeriesResult = {
  title: string;
  slug: string;
  poster: string;
  type?: SeriesMediaType;
  latestEpisode?: string;
  country?: string;
  year?: string;
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
};

const DOMAIN_CONFIG: Record<Exclude<SearchDomain, 'all'>, {
  label: string;
  icon: LucideIcon;
  theme: Exclude<ThemeType, 'default'>;
}> = {
  series: { label: 'Series', icon: Tv, theme: 'drama' },
  movies: { label: 'Movies', icon: Film, theme: 'movie' },
  comic: { label: 'Comic', icon: BookOpen, theme: 'manga' },
};

const DOMAIN_ORDER: SearchDomain[] = ['all', 'series', 'movies', 'comic'];
const OVERVIEW_LIMIT = 6;
const DOMAIN_LIMIT = 24;

function getInitialState(): Record<Exclude<SearchDomain, 'all'>, DomainState> {
  return {
    series: { loading: false, error: null, items: [] },
    movies: { loading: false, error: null, items: [] },
    comic: { loading: false, error: null, items: [] },
  };
}

function normalizeSeriesResults(items: SeriesResult[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `series:${item.slug}`,
    href: `/series/${item.slug}`,
    title: item.title,
    image: item.poster,
    subtitle: formatSeriesCardSubtitle(item) || undefined,
    badgeText: getSeriesBadgeText(item.type || 'anime'),
    theme: getSeriesTheme(item.type || 'anime'),
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
    href: `/comic/${item.slug}`,
    title: item.title,
    image: item.thumbnail || item.image,
    subtitle: item.chapter || item.time_ago || undefined,
    badgeText: item.type || 'Manga',
    theme: 'manga',
  }));
}

async function fetchDomainResults(domain: Exclude<SearchDomain, 'all'>, query: string, limit: number): Promise<SearchCardItem[]> {
  const url = new URL(`/api/search/${domain}`, window.location.origin);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Search failed for ${domain}`);
  }

  if (domain === 'series') {
    return normalizeSeriesResults(await response.json() as SeriesResult[]);
  }
  if (domain === 'movies') {
    return normalizeMovieResults(await response.json() as MovieResult[]);
  }
  if (domain === 'comic') {
    return normalizeMangaResults(await response.json() as MangaSearchResult[]);
  }
  return [];
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
    const query = initialQuery.trim();
    if (query.length < 2) {
      setDomainState(getInitialState());
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const targets = activeTab === 'all'
      ? (['series', 'movies', 'comic'] as const)
      : [activeTab];

    targets.forEach((domain) => {
      setDomainState((current) => ({
        ...current,
        [domain]: { ...current[domain], loading: true, error: null, items: [] },
      }));

      void fetchDomainResults(domain, query, activeTab === 'all' ? OVERVIEW_LIMIT : DOMAIN_LIMIT)
        .then((items) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setDomainState((current) => ({
            ...current,
            [domain]: { loading: false, error: null, items },
          }));
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setDomainState((current) => ({
            ...current,
            [domain]: { loading: false, error: 'Search failed', items: [] },
          }));
        });
    });
  }, [activeTab, initialQuery]);

  const handleSearchSubmit = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', inputValue.trim());
    params.set('type', activeTab);
    router.push(`${pathname}?${params.toString()}`);
  }, [activeTab, inputValue, pathname, router, searchParams]);

  const sections = activeTab === 'all' ? (['series', 'movies', 'comic'] as const) : [activeTab];

  return (
    <main className="app-shell">
      <div className="app-container-wide mt-8 space-y-8 pb-12">
        <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search series, movies, and comics. Anime and donghua live under series."
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
            />
            <Button variant="drama" onClick={handleSearchSubmit}>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {DOMAIN_ORDER.map((domain) => (
              <Button
                key={domain}
                variant={activeTab === domain ? 'drama' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(domain)}
              >
                {domain === 'all' ? 'All' : DOMAIN_CONFIG[domain].label}
              </Button>
            ))}
          </div>
        </Paper>

        {initialQuery.trim().length < 2 ? (
          <StateInfo title="Type something to search" description="Explore results across series, movies, and comics. Anime and donghua both live under series now." />
        ) : (
          sections.map((domain) => {
            const state = domainState[domain];
            const config = DOMAIN_CONFIG[domain];
            return (
              <SectionCard
                key={domain}
                title={config.label}
                icon={config.icon}
                subtitle={state.error ? state.error : `${state.items.length} result(s)`}
                mode="grid"
                gridDensity="default"
              >
                {state.loading ? (
                  <div className="col-span-full">
                    <StateInfo title="Searching..." description={`Loading ${config.label.toLowerCase()} results`} />
                  </div>
                ) : state.items.length === 0 ? (
                  <div className="col-span-full">
                    <StateInfo title="No results" description={`No ${config.label.toLowerCase()} matches for this query`} />
                  </div>
                ) : (
                  state.items.map((item) => (
                    <MediaCard
                      key={item.id}
                      href={item.href}
                      image={item.image}
                      title={item.title}
                      subtitle={item.subtitle}
                      badgeText={item.badgeText}
                      theme={item.theme}
                    />
                  ))
                )}
              </SectionCard>
            );
          })
        )}

        {initialQuery.trim().length >= 2 ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Badge variant="outline">Search</Badge>
            <span>Query: {initialQuery}</span>
          </div>
        ) : null}
      </div>
    </main>
  );
}
