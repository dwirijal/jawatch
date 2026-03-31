import { Tag } from 'lucide-react';
import {
  buildSeriesBrowsePage,
  formatSeriesBrowseLabel,
} from '@/app/series/buildSeriesBrowsePage';
import { loadSeriesBrowsePageData } from '@/app/series/loadSeriesBrowsePageData';

interface PageProps {
  params: Promise<{ genre: string }>;
}

export default async function SeriesGenrePage({ params }: PageProps) {
  const { genre } = await params;
  const results = await loadSeriesBrowsePageData('genre', genre);

  return buildSeriesBrowsePage({
    title: `Series Genre: ${formatSeriesBrowseLabel(genre)}`,
    description: 'Browse canonical series by genre.',
    icon: Tag,
    theme: 'drama',
    results,
  });
}
