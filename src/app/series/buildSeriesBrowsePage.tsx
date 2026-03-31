import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import type { GenericMediaItem } from '@/lib/types';
import type { ThemeType } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BuildSeriesBrowsePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  theme: ThemeType;
  results: GenericMediaItem[];
}

export function buildSeriesBrowsePage({
  title,
  description,
  icon,
  theme,
  results,
}: BuildSeriesBrowsePageProps) {
  return (
    <MediaHubTemplate
      title={title}
      description={description}
      icon={icon}
      theme={theme}
      results={results}
      loading={false}
      error={null}
      resultHrefBuilder={(item) => `/series/${item.slug}`}
    />
  );
}

export function formatSeriesBrowseLabel(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

