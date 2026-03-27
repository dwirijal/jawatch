'use client';

import { useEffect, useState, use } from 'react';
import { incrementInterest } from '@/lib/store';
import { Play, Calendar, Monitor, Globe, Clock4 } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea } from '@/components/atoms/ScrollArea';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { DetailPageScaffold } from '@/components/organisms/DetailPageScaffold';
import { StateInfo } from '@/components/molecules/StateInfo';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { VideoDetailPageSkeleton } from '@/components/organisms/VideoDetailPageSkeleton';
import { getDonghuaDetail } from '@/lib/adapters/donghua';
import type { AnichinDetail } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DonghuaDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [donghua, setDonghua] = useState<AnichinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDonghuaDetail(slug);
        setDonghua(data);
        incrementInterest('donghua');
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return <VideoDetailPageSkeleton theme="donghua" backLabel="Back to Donghua" />;
  }

  if (error || !donghua) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background p-8 text-white">
        <StateInfo
          type="error"
          title="Donghua not found"
          description="This title could not be loaded."
          actionLabel="Back to Donghua"
          onAction={() => window.location.assign('/donghua')}
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  const watchHref = donghua.episodes[0] ? `/donghua/episode/${donghua.episodes[0].slug}` : '';

  return (
    <DetailPageScaffold
      theme="donghua"
      hero={
        <VideoDetailHero
          theme="donghua"
          backHref="/donghua"
          backLabel="Back to Donghua"
          poster={donghua.thumb}
          title={donghua.title}
          subtitle={[donghua.meta.country, donghua.meta.network].filter(Boolean).join(' • ')}
          eyebrow="Donghua Series"
          badges={donghua.genres.slice(0, 5)}
          metadata={[
            { label: 'Studio', value: donghua.meta.studio || 'Unknown' },
            { label: 'Status', value: donghua.meta.status || 'Unknown' },
            { label: 'Episodes', value: donghua.meta.episodes || 'Unknown' },
            { label: 'Season', value: donghua.meta.season || 'Unknown' },
          ]}
          controls={
            <>
              <ShareButton title={donghua.title} theme="donghua" />
              <BookmarkButton
                item={{
                  id: slug,
                  type: 'donghua',
                  title: donghua.title,
                  image: donghua.thumb,
                  timestamp: Date.now(),
                }}
                theme="donghua"
              />
            </>
          }
          primaryAction={
            watchHref ? (
              <Button variant="donghua" size="lg" className="h-12 rounded-[var(--radius-lg)] px-8" asChild>
                <Link href={watchHref}>
                  Start Watching
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Link>
              </Button>
            ) : null
          }
        />
      }
      sidebar={
        <>
          <DetailActionCard
            theme="donghua"
            title="Ready to watch"
            description="Masuk langsung ke episode terbaru dan lanjutkan streaming dari jalur video yang sama."
            actions={watchHref ? [{ href: watchHref, label: 'Start Watching' }] : []}
          />

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Quick Stats</p>
            <div className="grid gap-2.5">
              <StatCard label="Country" value={donghua.meta.country} icon={Globe} />
              <StatCard label="Network" value={donghua.meta.network} icon={Monitor} />
              <StatCard label="Duration" value={donghua.meta.duration} icon={Clock4} />
              <StatCard label="Released" value={donghua.meta.released} icon={Calendar} />
            </div>
          </Paper>
        </>
      }
      footer={<CommunityCTA mediaId={slug} title={donghua.title} type="donghua" theme="donghua" />}
    >
      <section className="space-y-8">
        <DetailSectionHeading title="Overview" theme="donghua" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">
            {donghua.synopsis || 'No synopsis available for this donghua.'}
          </p>
        </Paper>
      </section>

      <section id="episodes" className="space-y-8">
        <DetailSectionHeading
          title="Episode Guide"
          theme="donghua"
          aside={<Badge variant="outline">{donghua.episodes.length} Available</Badge>}
        />

        <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
          <ScrollArea className="h-[600px] w-full">
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              {donghua.episodes.map((ep) => (
                <Paper
                  key={ep.slug}
                  asChild
                  tone="muted"
                  padded={false}
                  className="overflow-hidden rounded-[var(--radius-sm)] border-border-subtle transition-colors"
                >
                  <Link
                    href={`/donghua/episode/${ep.slug}`}
                    className="group flex items-center gap-4 p-4 hover:bg-surface-elevated"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/10 transition-colors group-hover:bg-red-600">
                      <Play className="h-4 w-4 fill-red-400 text-red-500 group-hover:fill-white group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-bold tracking-tight text-zinc-200 transition-colors group-hover:text-red-400">
                        {ep.title}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{ep.date}</span>
                    </div>
                  </Link>
                </Paper>
              ))}
            </div>
          </ScrollArea>
        </Paper>
      </section>
    </DetailPageScaffold>
  );
}
