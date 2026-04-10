'use client';

import * as React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { MediaCard } from '@/components/atoms/Card';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SectionCard } from '@/components/organisms/SectionCard';
import { getNovelsByGenre } from '@/lib/adapters/novel';
import type { GenericMediaItem, NovelGenre, NovelListItem } from '@/lib/types';

interface NovelPageClientProps {
  initialFeatured: NovelListItem[];
  initialLatest: NovelListItem[];
  genres: NovelGenre[];
}

function toMediaItems(items: NovelListItem[]): GenericMediaItem[] {
  return items.map((item) => ({
    slug: item.slug,
    title: item.title,
    poster: item.poster,
    chapter: item.latestChapter,
    type: item.type,
    status: item.status,
  }));
}

export default function NovelPageClient({ initialFeatured, initialLatest, genres }: NovelPageClientProps) {
  const [results, setResults] = React.useState<GenericMediaItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null);

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setActiveGenre(genre);

    try {
      const items = await getNovelsByGenre(genre.toLowerCase());
      setResults(toMediaItems(items));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MediaHubTemplate
      title="Novel Library"
      description="Read long-form stories from a readable source with chapter detail and in-app reader flow."
      icon={FileText}
      theme="novel"
      eyebrow="Reading Desk"
      genres={genres.map((genre) => genre.name)}
      results={results}
      loading={loading}
      error={null}
      activeGenre={activeGenre}
      resultHrefBuilder={(item) => `/novel/${item.slug}`}
      onGenreClick={handleGenreClick}
      onClearResults={() => {
        setResults(null);
        setActiveGenre(null);
      }}
    >
      <div className="app-section-stack">
        <SectionCard title="Featured Novels" subtitle="Fresh shelves from SakuraNovel" mode="rail" railVariant="default">
          {initialFeatured.length === 0
            ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={`featured-novel-${index}`} />)
            : initialFeatured.map((item) => (
              <MediaCard
                key={item.slug}
                href={`/novel/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={item.type}
                badgeText={item.rating ? `★ ${item.rating}` : item.type}
                theme="novel"
              />
            ))}
        </SectionCard>

        <SectionCard title="Latest Chapters" subtitle="Newest updates ready to read" icon={Sparkles} gridDensity="default">
          {initialLatest.length === 0
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-novel-${index}`} />)
            : initialLatest.map((item) => (
              <MediaCard
                key={item.slug}
                href={`/novel/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={item.latestChapter}
                badgeText={item.type}
                theme="novel"
              />
            ))}
        </SectionCard>
      </div>
    </MediaHubTemplate>
  );
}
