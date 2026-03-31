import { CalendarDays } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

interface PageProps {
  params: Promise<{ year: string }>;
}

export default async function SeriesYearPage({ params }: PageProps) {
  const { year } = await params;
  const results = await loadSeriesBrowsePageData('year', year);

  return buildSeriesBrowsePage({
    title: `Series Year: ${year}`,
    description: 'Browse canonical series by release year.',
    icon: CalendarDays,
    theme: 'drama',
    results,
  });
}
