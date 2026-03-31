import { Clapperboard } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

export default async function SeriesDramaPage() {
  const results = await loadSeriesBrowsePageData('type', 'drama');

  return buildSeriesBrowsePage({
    title: 'Series: Drama',
    description: 'Drama titles living under the canonical series surface.',
    icon: Clapperboard,
    theme: 'drama',
    results,
  });
}
