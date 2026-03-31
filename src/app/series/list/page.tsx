import { Grid3X3 } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

export default async function SeriesListPage() {
  const results = await loadSeriesBrowsePageData('list', null);

  return buildSeriesBrowsePage({
    title: 'Series List',
    description: 'All canonical episodic titles in one browse surface.',
    icon: Grid3X3,
    theme: 'drama',
    results,
  });
}
