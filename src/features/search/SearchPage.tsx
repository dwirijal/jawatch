import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchResultsPageClient from './SearchResultsPageClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Pencarian',
  description: 'Cari anime, film, komik, dan series di jawatch.',
  path: '/search',
  noIndex: true,
});

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="app-shell" data-theme="drama" data-view-mode="compact" />}>
      <SearchResultsPageClient />
    </Suspense>
  );
}
