'use client';

import * as React from 'react';
import Image from 'next/image';
import { BookOpen, Film, Search, Sparkles, Tv, type LucideIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import {
  getSearchGroupLabel,
  type SearchDomain,
  type SearchResultGroup,
  type UnifiedSearchResult,
} from '@/lib/search/search-contract';

const DOMAIN_ORDER: SearchDomain[] = ['all', 'series', 'movies', 'comic'];

const DOMAIN_ICON: Record<Exclude<SearchDomain, 'all'>, LucideIcon> = {
  series: Tv,
  movies: Film,
  comic: BookOpen,
};

export default function SearchResultsPageClient({
  initialSearch,
}: {
  initialSearch: UnifiedSearchResult;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = React.useState(initialSearch.query);
  const [activeTab, setActiveTab] = React.useState<SearchDomain>(initialSearch.domain);

  React.useEffect(() => {
    setInputValue(initialSearch.query);
    setActiveTab(initialSearch.domain);
  }, [initialSearch.domain, initialSearch.query]);

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

  const groups = initialSearch.groups;
  const totalResults = initialSearch.total;
  const hasQuery = initialSearch.query.trim().length >= 2;
  const headerDescription = hasQuery
    ? 'Grouped title search across watch and read. Global search stays title-first, while episode and chapter search remain inside title pages.'
    : 'Use the canonical search hub for titles across series, movies, and comics. Header search stays available, but this page is the focused search surface.';

  return (
    <main className="app-shell" data-theme="drama" data-view-mode="compact">
      <div className="app-container-wide mt-5 space-y-8 pb-12 sm:mt-6 md:space-y-10">
        <MediaHubHeader
          title="Search Hub"
          description={headerDescription}
          icon={Search}
          theme="drama"
          eyebrow="Canonical Search"
          layoutVariant="editorial"
          footer={(
            <>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_ORDER.map((domain) => (
                  <Button
                    key={domain}
                    type="button"
                    variant={activeTab === domain ? 'drama' : 'outline'}
                    size="sm"
                    onClick={() => handleTabChange(domain)}
                    className="rounded-full"
                  >
                    {domain === 'all' ? 'All' : getSearchGroupLabel(domain)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                <Badge variant="outline">{totalResults} Result</Badge>
                {hasQuery ? <span>Query: {initialSearch.query}</span> : <span>Title-first discovery</span>}
              </div>
            </>
          )}
        >
          <Badge variant="drama">Grouped Results</Badge>
          {initialSearch.topMatch ? <Badge variant="outline">Top Match Ready</Badge> : null}
        </MediaHubHeader>

        <Paper tone="muted" shadow="sm" className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search titles across series, movies, and comics"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              className="md:flex-1"
            />
            <Button variant="drama" onClick={handleSearchSubmit} className="md:min-w-[10rem]">
              <Search className="mr-2 h-4 w-4" /> Search Titles
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">IA</Badge>
            <span>Top Match stays inside the normal result flow, not a separate hero.</span>
          </div>
        </Paper>

        {!hasQuery ? (
          <StateInfo
            title="Type something to search"
            description="Search stays title-level at the global layer. Open a title page when you want episode or chapter-level navigation."
          />
        ) : totalResults === 0 ? (
          <StateInfo
            title="No results found"
            description="Try a shorter title, broader keyword, or switch back to All."
          />
        ) : (
          <>
            {initialSearch.topMatch ? (
              <Paper asChild tone="muted" shadow="sm" interactive className="overflow-hidden p-0">
                <Link href={initialSearch.topMatch.href} className="grid gap-0 md:grid-cols-[10rem_minmax(0,1fr)]">
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-border-subtle md:aspect-auto md:border-b-0 md:border-r">
                    <Image
                      src={initialSearch.topMatch.image || '/favicon.ico'}
                      alt={initialSearch.topMatch.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 160px"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(9,10,14,0.62)_100%)] md:bg-[linear-gradient(90deg,transparent_0%,rgba(9,10,14,0.28)_100%)]" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-4 p-4 md:justify-center md:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={initialSearch.topMatch.theme}>Top Match</Badge>
                      <Badge variant="outline">{getSearchGroupLabel(initialSearch.topMatch.routeType)}</Badge>
                      {initialSearch.topMatch.badgeText ? (
                        <Badge variant="outline">{initialSearch.topMatch.badgeText}</Badge>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-foreground">
                        {initialSearch.topMatch.title}
                      </h2>
                      {initialSearch.topMatch.subtitle ? (
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                          {initialSearch.topMatch.subtitle}
                        </p>
                      ) : null}
                      {initialSearch.topMatch.metaLine ? (
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                          {initialSearch.topMatch.metaLine}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-[var(--accent-strong)]" />
                      <span>Open title page to continue into episodes or chapters.</span>
                    </div>
                  </div>
                </Link>
              </Paper>
            ) : null}

            <div className="app-section-stack">
              {groups.map((group) => (
                <SearchResultSection key={group.key} group={group} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SearchResultSection({ group }: { group: SearchResultGroup }) {
  const Icon = DOMAIN_ICON[group.key];

  return (
    <SectionCard
      title={group.label}
      subtitle={`${group.total} title match${group.total === 1 ? '' : 'es'}`}
      icon={Icon}
      mode="grid"
      gridDensity="default"
    >
      {group.items.map((item) => (
        <MediaCard
          key={item.id}
          href={item.href}
          image={item.image}
          title={item.title}
          subtitle={item.subtitle}
          metaLine={item.metaLine}
          badgeText={item.badgeText}
          theme={item.theme}
        />
      ))}
    </SectionCard>
  );
}
