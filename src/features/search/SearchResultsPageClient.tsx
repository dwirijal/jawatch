'use client';

import * as React from 'react';
import Image from 'next/image';
import { BookOpen, Film, Loader2, Search, Sparkles, Tv, type LucideIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { reportClientError } from '@/lib/client-log';
import {
  getSearchGroupLabel,
  normalizeSearchDomain,
  type SearchDomain,
  type SearchResultGroup,
  type UnifiedSearchResult,
} from '@/domains/search/contracts/search-contract';

const DOMAIN_ORDER: SearchDomain[] = ['all', 'series', 'movies', 'comic'];
const SEARCH_LIMIT_BY_DOMAIN: Record<SearchDomain, number> = {
  all: 6,
  series: 18,
  movies: 18,
  comic: 18,
};

const DOMAIN_ICON: Record<Exclude<SearchDomain, 'all'>, LucideIcon> = {
  series: Tv,
  movies: Film,
  comic: BookOpen,
};

function createEmptySearchState(query: string, domain: SearchDomain): UnifiedSearchResult {
  return {
    query,
    domain,
    source: 'empty',
    total: 0,
    topMatch: null,
    groups: [],
  };
}

function removeTopMatchFromGroups(
  groups: SearchResultGroup[],
  topMatchId: string | null | undefined,
): SearchResultGroup[] {
  if (!topMatchId) {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id !== topMatchId),
    }))
    .filter((group) => group.items.length > 0);
}

export default function SearchResultsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryFromUrl = (searchParams.get('q') || '').trim();
  const domainFromUrl = normalizeSearchDomain(searchParams.get('type') || undefined);
  const [inputValue, setInputValue] = React.useState(queryFromUrl);
  const [activeTab, setActiveTab] = React.useState<SearchDomain>(domainFromUrl);
  const [result, setResult] = React.useState<UnifiedSearchResult>(() => createEmptySearchState(queryFromUrl, domainFromUrl));
  const [loading, setLoading] = React.useState(queryFromUrl.length >= 2);
  const latestRequestId = React.useRef(0);

  React.useEffect(() => {
    setInputValue(queryFromUrl);
    setActiveTab(domainFromUrl);

    if (queryFromUrl.length < 2) {
      latestRequestId.current += 1;
      setLoading(false);
      setResult(createEmptySearchState(queryFromUrl, domainFromUrl));
      return;
    }

    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setLoading(true);

    void (async () => {
      try {
        const params = new URLSearchParams({
          q: queryFromUrl,
          type: domainFromUrl,
          limit: String(SEARCH_LIMIT_BY_DOMAIN[domainFromUrl]),
        });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
          credentials: 'same-origin',
        });
        if (!response.ok) {
          throw new Error(`search route failed with status ${response.status}`);
        }

        const payload = await response.json() as UnifiedSearchResult;
        if (latestRequestId.current !== requestId) {
          return;
        }

        setResult(payload);
      } catch (error) {
        if (controller.signal.aborted || latestRequestId.current !== requestId) {
          return;
        }
        reportClientError(error, 'Search results request failed');
        setResult(createEmptySearchState(queryFromUrl, domainFromUrl));
      } finally {
        if (latestRequestId.current === requestId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [domainFromUrl, queryFromUrl]);

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

  const groups = React.useMemo(
    () => removeTopMatchFromGroups(result.groups, result.topMatch?.id),
    [result.groups, result.topMatch?.id],
  );
  const totalResults = (result.topMatch ? 1 : 0) + groups.reduce((count, group) => count + group.items.length, 0);
  const hasQuery = result.query.trim().length >= 2;
  const headerDescription = hasQuery
    ? 'Hasil pencarian dikelompokkan untuk tontonan dan bacaan. Episode dan chapter tetap dibuka dari halaman judul.'
    : 'Cari judul series, film, dan komik dari sini. Pencarian dibuat fokus ke judul supaya hasilnya lebih cepat dipilih.';

  return (
    <main className="app-shell" data-theme="drama" data-view-mode="compact">
      <div className="app-container-wide mt-5 space-y-8 pb-12 sm:mt-6 md:space-y-10">
        <MediaHubHeader
          title="Pencarian"
          description={headerDescription}
          icon={Search}
          theme="drama"
          eyebrow="Cari judul"
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
                    {domain === 'all' ? 'Semua' : getSearchGroupLabel(domain)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                <Badge variant="outline">{totalResults} hasil</Badge>
                {loading ? <Badge variant="outline">Memuat</Badge> : null}
                {hasQuery ? <span>Kata kunci: {result.query}</span> : <span>Cari berdasarkan judul</span>}
              </div>
            </>
          )}
        >
          <Badge variant="drama">Hasil dikelompokkan</Badge>
          {result.topMatch ? <Badge variant="outline">Pilihan cocok siap</Badge> : null}
        </MediaHubHeader>

        <Paper tone="muted" shadow="sm" className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Cari judul series, film, atau komik"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              className="md:flex-1"
            />
            <Button variant="drama" onClick={handleSearchSubmit} className="md:min-w-[10rem]">
              <Search className="mr-2 h-4 w-4" /> Cari judul
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">IA</Badge>
            <span>Judul paling cocok ditonjolkan sekali di bagian atas.</span>
          </div>
        </Paper>

        {!hasQuery ? (
          <StateInfo
            title="Ketik judul dulu"
            description="Pencarian global fokus ke judul. Buka halaman judul untuk memilih episode atau chapter."
          />
        ) : loading && totalResults === 0 ? (
          <StateInfo
            title="Mencari judul"
            description="Mengambil hasil dari series, film, dan komik."
            icon={Loader2}
          />
        ) : totalResults === 0 ? (
          <StateInfo
            title="Belum ada hasil"
            description="Coba judul yang lebih pendek, kata kunci lebih umum, atau kembali ke Semua."
          />
        ) : (
          <>
            {result.topMatch ? (
              <Paper asChild tone="muted" shadow="sm" interactive className="overflow-hidden p-0">
                <Link href={result.topMatch.href} className="grid gap-0 md:grid-cols-[10rem_minmax(0,1fr)]">
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-border-subtle md:aspect-auto md:border-b-0 md:border-r">
                    <Image
                      src={result.topMatch.image || '/favicon.ico'}
                      alt={result.topMatch.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 160px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(9,10,14,0.62)_100%)] md:bg-[linear-gradient(90deg,transparent_0%,rgba(9,10,14,0.28)_100%)]" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-4 p-4 md:justify-center md:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={result.topMatch.theme}>Paling cocok</Badge>
                      <Badge variant="outline">{getSearchGroupLabel(result.topMatch.routeType)}</Badge>
                      {result.topMatch.badgeText ? (
                        <Badge variant="outline">{result.topMatch.badgeText}</Badge>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-foreground">
                        {result.topMatch.title}
                      </h2>
                      {result.topMatch.subtitle ? (
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                          {result.topMatch.subtitle}
                        </p>
                      ) : null}
                      {result.topMatch.metaLine ? (
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                          {result.topMatch.metaLine}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-[var(--accent-strong)]" />
                      <span>Buka halaman judul untuk lanjut ke episode atau chapter.</span>
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
      subtitle={`${group.total} judul cocok`}
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
