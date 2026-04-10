import { JsonLd } from '@/components/atoms/JsonLd';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { buildCollectionPageJsonLd } from '@/lib/seo';
import type { GenericMediaItem } from '@/lib/types';
import type { ThemeType } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BuildSeriesBrowsePageProps {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  theme: ThemeType;
  eyebrow?: string;
  results: GenericMediaItem[];
}

export function buildSeriesBrowsePage({
  title,
  description,
  path,
  icon,
  theme,
  eyebrow,
  results,
}: BuildSeriesBrowsePageProps) {
  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title,
          description,
          path,
          items: results.map((item) => ({
            name: item.title,
            url: `/series/${item.slug}`,
            image: item.poster || item.image || item.thumbnail || item.thumb || null,
          })),
        })}
      />
      <MediaHubTemplate
        title={title}
        description={description}
        iconName={icon.name}
        theme={theme}
        eyebrow={eyebrow}
        results={results}
        loading={false}
        error={null}
        resultHrefPrefix="/series"
      />
    </>
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
