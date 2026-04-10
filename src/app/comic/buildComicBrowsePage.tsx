import { JsonLd } from '@/components/atoms/JsonLd';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { buildCollectionPageJsonLd } from '@/lib/seo';
import type { GenericMediaItem } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

interface BuildComicBrowsePageProps {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  eyebrow?: string;
  results: GenericMediaItem[];
  resultSubtitle?: string;
}

export function buildComicBrowsePage({
  title,
  description,
  path,
  icon,
  eyebrow,
  results,
  resultSubtitle,
}: BuildComicBrowsePageProps) {
  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title,
          description,
          path,
          items: results.map((item) => ({
            name: item.title,
            url: `/comic/${item.slug}`,
            image: item.poster || item.image || item.thumbnail || item.thumb || null,
          })),
        })}
      />
      <MediaHubTemplate
        title={title}
        description={description}
        iconName={icon.name}
        theme="manga"
        eyebrow={eyebrow}
        results={results.map((item) => (
          resultSubtitle
            ? {
                ...item,
                latestEpisode: item.latestEpisode || item.chapter || item.episode || resultSubtitle,
              }
            : item
        ))}
        loading={false}
        error={null}
        resultHrefPrefix="/comic"
      />
    </>
  );
}
