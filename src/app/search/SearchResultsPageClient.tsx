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
import type { SeriesMediaType } from '@/lib/series-presentation';

type SearchDomain = 'all' | 'series' | 'movies' | 'comic';

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

type SearchDomainStateMap = Record<Exclude<SearchDomain, 'all'>, DomainState>;

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

function getInitialState(): SearchDomainStateMap {
  return {
    series: { loading: false, error: null, items: [] },
    movies: { loading: false, error: null, items: [] },
    comic: { loading: false, error: null, items: [] },
  };
}

export default function SearchResultsPageClient({
  initialQuery,
  initialType = 'all',
  initialDomainState,
}: {
  initialQuery: string;
  initialType?: SearchDomain;
  initialDomainState?: SearchDomainStateMap;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = React.useState(initialQuery);
  const [activeTab, setActiveTab] = React.useState<SearchDomain>(initialType);

  React.useEffect(() => {
    setInputValue(initialQuery);
    setActiveTab(initialType);
  }, [initialQuery, initialType]);

  const buildSearchHref = React.useCallback((nextQuery: string, nextType: SearchDomain) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextQuery.trim();

    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    params.set('type', nextType);
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  const handleSearchSubmit = React.useCallback(() => {
    router.push(buildSearchHref(inputValue, activeTab));
  }, [activeTab, buildSearchHref, inputValue, router]);

  const handleTabChange = React.useCallback((domain: SearchDomain) => {
    setActiveTab(domain);
    router.push(buildSearchHref(inputValue, domain));
  }, [buildSearchHref, inputValue, router]);

  const domainState = initialDomainState ?? getInitialState();
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
                onClick={() => handleTabChange(domain)}
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

export type { SearchDomain, SearchCardItem, SearchDomainStateMap, SeriesMediaType };
