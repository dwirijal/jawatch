import type { Metadata } from 'next';
import { Tag } from 'lucide-react';
import {
  buildSeriesBrowsePage,
  formatSeriesBrowseLabel,
} from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';
import { buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ genre: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre } = await params;
  const label = formatSeriesBrowseLabel(genre);
  return buildMetadata({
    title: `Series Genre ${label}`,
    description: `Browse series subtitle Indonesia untuk genre ${label}.`,
    path: `/series/genre/${genre}`,
  });
}

export default async function SeriesGenrePage({ params }: PageProps) {
  const { genre } = await params;
  const results = await loadSeriesBrowsePageData('genre', genre);

  return buildSeriesBrowsePage({
    title: `Series Genre: ${formatSeriesBrowseLabel(genre)}`,
    description: `Browse series subtitle Indonesia untuk genre ${formatSeriesBrowseLabel(genre)}.`,
    path: `/series/genre/${genre}`,
    icon: Tag,
    theme: 'drama',
    results,
  });
}
