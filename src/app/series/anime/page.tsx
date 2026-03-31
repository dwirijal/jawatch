import { Tv } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

export default async function SeriesAnimePage() {
  const results = await loadSeriesBrowsePageData('type', 'anime');

  return buildSeriesBrowsePage({
    title: 'Series: Anime',
    description: 'Anime titles living under the canonical series surface.',
    icon: Tv,
    theme: 'anime',
    results,
  });
}
