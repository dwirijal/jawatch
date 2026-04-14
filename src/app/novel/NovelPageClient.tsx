'use client';

import * as React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { MediaCard } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { SectionCard } from '@/components/organisms/SectionCard';
import { getNovelsByGenre } from '@/lib/adapters/novel';
import { formatNovelCardSubtitle, getNovelCardBadgeText } from '@/lib/card-presentation';
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
        {initialFeatured.length === 0 && initialLatest.length === 0 ? (
          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <Badge variant="outline">Novel Beta</Badge>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Novel catalog is being filled.</h2>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                The reading route is staying online, but the main shelves are still light. Comic and series already have fuller catalogs while novel data is being prepared.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/comic" className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-black text-black transition-colors hover:bg-zinc-200">
                Browse Comic
              </Link>
              <Link href="/series" className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-black text-zinc-200 transition-colors hover:bg-surface-elevated hover:text-white">
                Browse Series
              </Link>
            </div>
          </Paper>
        ) : null}

        <SectionCard title="Featured Novels" subtitle="Fresh shelves from SakuraNovel" mode="rail" railVariant="default">
          {initialFeatured.length === 0
            ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={`featured-novel-${index}`} />)
            : initialFeatured.map((item) => (
              <MediaCard
                key={item.slug}
                href={`/novel/${item.slug}`}
                image={item.poster}
                title={item.title}
                subtitle={formatNovelCardSubtitle(item)}
                badgeText={getNovelCardBadgeText()}
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
                subtitle={formatNovelCardSubtitle(item)}
                badgeText={getNovelCardBadgeText()}
                theme="novel"
              />
            ))}
        </SectionCard>
      </div>
    </MediaHubTemplate>
  );
}
