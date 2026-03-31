import SearchResultsPageClient from './SearchResultsPageClient';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

function normalizeType(value?: string): 'all' | 'series' | 'movies' | 'comic' {
  if (value === 'series' || value === 'movies' || value === 'comic') {
    return value;
  }
  if (value === 'manga') {
    return 'comic';
  }
  return 'all';
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const type = normalizeType(params.type);

  return <SearchResultsPageClient initialQuery={query} initialType={type} />;
}
