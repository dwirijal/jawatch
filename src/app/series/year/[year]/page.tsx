import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { buildSeriesBrowsePage } from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return buildMetadata({
    title: `Series Tahun ${year}`,
    description: `Browse series subtitle Indonesia yang rilis pada tahun ${year}.`,
    path: `/series/year/${year}`,
  });
}

export default async function SeriesYearPage({ params }: PageProps) {
  const { year } = await params;
  const results = await loadSeriesBrowsePageData('year', year);

  return buildSeriesBrowsePage({
    title: `Series Year: ${year}`,
    description: `Browse series subtitle Indonesia yang rilis pada tahun ${year}.`,
    path: `/series/year/${year}`,
    icon: CalendarDays,
    theme: 'drama',
    results,
  });
}
