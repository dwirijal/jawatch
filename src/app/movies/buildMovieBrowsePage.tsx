import { JsonLd } from '@/components/atoms/JsonLd';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { buildCollectionPageJsonLd } from '@/lib/seo';
import type { GenericMediaItem } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

interface BuildMovieBrowsePageProps {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  eyebrow?: string;
  results: GenericMediaItem[];
}

export function buildMovieBrowsePage({
  title,
  description,
  path,
  icon,
  eyebrow,
  results,
}: BuildMovieBrowsePageProps) {
  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title,
          description,
          path,
          items: results.map((item) => ({
            name: item.title,
            url: `/movies/${item.slug}`,
            image: item.poster || item.image || item.thumbnail || item.thumb || null,
          })),
        })}
      />
      <MediaHubTemplate
        title={title}
        description={description}
        iconName={icon.name}
        theme="movie"
        eyebrow={eyebrow}
        results={results}
        loading={false}
        error={null}
        resultHrefPrefix="/movies"
      />
    </>
  );
}
