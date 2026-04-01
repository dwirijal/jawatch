import type { Metadata } from 'next';
import { Globe2 } from 'lucide-react';
import {
  buildSeriesBrowsePage,
  formatSeriesBrowseLabel,
} from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const label = formatSeriesBrowseLabel(country);
  return buildMetadata({
    title: `Series dari ${label}`,
    description: `Browse series subtitle Indonesia berdasarkan negara rilis ${label}.`,
    path: `/series/country/${country}`,
  });
}

export default async function SeriesCountryPage({ params }: PageProps) {
  const { country } = await params;
  const results = await loadSeriesBrowsePageData('country', country);

  return buildSeriesBrowsePage({
    title: `Series Country: ${formatSeriesBrowseLabel(country)}`,
    description: `Browse series subtitle Indonesia berdasarkan negara rilis ${formatSeriesBrowseLabel(country)}.`,
    path: `/series/country/${country}`,
    icon: Globe2,
    theme: 'drama',
    results,
  });
}
