import { Zap } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

export default async function SeriesDonghuaPage() {
  const results = await loadSeriesBrowsePageData('type', 'donghua');

  return buildSeriesBrowsePage({
    title: 'Series: Donghua',
    description: 'Donghua titles living under the canonical series surface.',
    icon: Zap,
    theme: 'donghua',
    results,
  });
}
