import { Globe2 } from 'lucide-react';
import {
  buildSeriesBrowsePage,
  formatSeriesBrowseLabel,
} from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

interface PageProps {
  params: Promise<{ country: string }>;
}

export default async function SeriesCountryPage({ params }: PageProps) {
  const { country } = await params;
  const results = await loadSeriesBrowsePageData('country', country);

  return buildSeriesBrowsePage({
    title: `Series Country: ${formatSeriesBrowseLabel(country)}`,
    description: 'Browse canonical series by release country.',
    icon: Globe2,
    theme: 'drama',
    results,
  });
}
