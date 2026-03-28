'use client';

import { useEffect, useState, use } from 'react';
import { incrementInterest } from '@/lib/store';
import { Play, Calendar, Monitor, Globe, Clock4, BookOpen } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDonghuaDetail(slug);
        if (!data) {
          setError('This title is unavailable or the slug is no longer valid.');
          return;
        }
        setDonghua(data);
        incrementInterest('donghua');
      } catch {
        setError('The provider could not load this donghua right now.');
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
          title="Donghua temporarily unavailable"
          description={error || 'This title could not be loaded right now.'}
          actionLabel="Back to Donghua"
          onAction={() => window.location.assign('/donghua')}
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  const watchHref = donghua.episodes[0] ? `/donghua/episode/${donghua.episodes[0].slug}` : '';
  const quickLinks = [
    { href: '#episodes', label: 'Episode Guide' },
    { href: '#overview', label: 'Overview' },
  ];

  return (
    <HorizontalMediaDetailPage
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
          secondaryAction={
            <Button variant="outline" size="lg" className="h-12 rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 px-6 hover:bg-surface-elevated" asChild>
              <Link href="#episodes">
                Episode Guide
                <BookOpen className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
          galleryVariant="compact"
        />
      }
      sidebar={
        <>
          <DetailActionCard
            theme="donghua"
            title="Ready to watch"
            description="Masuk langsung ke episode terbaru dan lanjutkan streaming dari jalur video yang sama."
            actions={[
              ...(watchHref ? [{ href: watchHref, label: 'Start Watching' }] : []),
              { href: '#episodes', label: 'Open Episode Guide', icon: BookOpen, variant: 'outline' },
            ]}
          />

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Jump Around</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((item) => (
                <Button
                  key={item.href}
                  variant="outline"
                  size="sm"
                  className="h-11 justify-center rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-3 text-[11px] font-black tracking-[0.16em] hover:bg-surface-elevated"
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </Paper>

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">At A Glance</p>
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
      <section id="episodes" className="space-y-8">
        <DetailSectionHeading
          title="Episode Guide"
          theme="donghua"
          aside={
            <div className="flex items-center gap-2">
              <Badge variant="outline">{donghua.episodes.length} Available</Badge>
              {watchHref ? (
                <Button variant="outline" size="sm" className="h-10 rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-4 hover:bg-surface-elevated" asChild>
                  <Link href={watchHref}>Start Watching</Link>
                </Button>
              ) : null}
            </div>
          }
        />

        <Paper tone="muted" shadow="sm" className="space-y-4 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-zinc-400">
              Episode guide stays compact so you can jump straight into the next watch session without digging through the full page.
            </p>
            <Badge variant="outline">Latest First</Badge>
          </div>

          <div className="max-h-[760px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {donghua.episodes.map((ep) => (
                <Link
                  key={ep.slug}
                  href={`/donghua/episode/${ep.slug}`}
                  className="group block"
                >
                  <Paper tone="muted" padded={false} interactive className="overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface-1 p-4 transition-colors group-hover:bg-surface-elevated">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-red-600/10 transition-colors group-hover:bg-red-600">
                        <Play className="h-4 w-4 fill-red-400 text-red-500 group-hover:fill-white group-hover:text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block line-clamp-2 text-sm font-bold tracking-tight text-zinc-200 transition-colors group-hover:text-red-400">
                          {ep.title}
                        </span>
                        <span className="mt-1.5 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{ep.date}</span>
                      </div>
                    </div>
                  </Paper>
                </Link>
              ))}
            </div>
          </div>
        </Paper>
      </section>

      <section id="overview" className="space-y-8">
        <DetailSectionHeading title="Overview" theme="donghua" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">
            {donghua.synopsis || 'No synopsis available for this donghua.'}
          </p>
        </Paper>
      </section>
    </HorizontalMediaDetailPage>
  );
}
