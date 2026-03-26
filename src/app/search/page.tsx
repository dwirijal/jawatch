import SearchResultsPageClient from './SearchResultsPageClient';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

function normalizeType(value?: string): 'all' | 'anime' | 'movies' | 'manga' | 'donghua' {
  if (value === 'anime' || value === 'movies' || value === 'manga' || value === 'donghua') {
    return value;
  }
  return 'all';
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const type = normalizeType(params.type);

  return <SearchResultsPageClient initialQuery={query} initialType={type} />;
}
