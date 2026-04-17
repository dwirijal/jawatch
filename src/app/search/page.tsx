import type { Metadata } from 'next';
import SearchResultsPageClient from './SearchResultsPageClient';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { searchUnifiedTitles } from '@/lib/search/search-service';
import { normalizeSearchDomain, type SearchDomain, type UnifiedSearchResult } from '@/lib/search/search-contract';
import { buildMetadata } from '@/lib/seo';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

export const metadata: Metadata = buildMetadata({
  title: 'Pencarian',
  description: 'Cari anime, film, komik, dan series di jawatch.',
  path: '/search',
  noIndex: true,
});

function createEmptySearchResult(query: string, domain: SearchDomain): UnifiedSearchResult {
  return {
    query,
    domain,
    source: 'empty',
    total: 0,
    topMatch: null,
    groups: [],
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const type = normalizeSearchDomain(params.type);

  const initialSearch = query.length >= 2
    ? await searchUnifiedTitles(query, {
        domain: type,
        limit: type === 'all' ? 6 : 18,
        includeNsfw: await resolveViewerNsfwAccess(),
      }).catch(() => createEmptySearchResult(query, type))
    : createEmptySearchResult(query, type);

  return <SearchResultsPageClient initialSearch={initialSearch} />;
}
