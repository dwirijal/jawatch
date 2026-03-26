'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getDonghuaEpisode, getDonghuaDetail, KanataEpisodeDetail, AnichinDetail } from '@/lib/api';
import { ChevronLeft, ChevronRight, Info, Zap } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { AdSection } from '@/components/organisms/AdSection';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { CircularLoader } from '@/components/atoms/CircularLoader';
import { VideoPlaybackScaffold } from '@/components/organisms/VideoPlaybackScaffold';
import { StateInfo } from '@/components/molecules/StateInfo';
import { saveHistory } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ episodeSlug: string }>;
}

export default function DonghuaEpisodePage({ params }: PageProps) {
  const { episodeSlug } = use(params);
  const router = useRouter();
  const [episode, setEpisode] = useState<KanataEpisodeDetail | null>(null);
  const [donghua, setDonghua] = useState<AnichinDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const epData = await getDonghuaEpisode(episodeSlug);
        if (!epData) throw new Error("Episode data not found");
        
        setEpisode(epData);
        
        if (epData.navigation?.anime_info) {
          const detailData = await getDonghuaDetail(epData.navigation.anime_info);
          setDonghua(detailData);
          
          saveHistory({
            id: epData.navigation.anime_info,
            type: 'donghua',
            title: detailData?.title || epData.title,
            image: detailData?.thumb || '',
            lastChapterOrEpisode: epData.title,
            lastLink: `/donghua/episode/${episodeSlug}`,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    window.scrollTo(0, 0);
  }, [episodeSlug]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background text-white">
        <CircularLoader theme="donghua" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background p-8 text-white">
        <StateInfo
          type="error"
          title="Episode not found"
          description="This donghua episode could not be loaded."
          actionLabel="Back to Donghua"
          onAction={() => router.push('/donghua')}
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <VideoPlaybackScaffold
      backHref={`/donghua/${episode.navigation?.anime_info || ''}`}
      eyebrow="Now Watching"
      title={episode.title}
      subtitle={
        <>
          <Badge variant="donghua" className="px-2 py-0.5 text-[10px]">Playback Ready</Badge>
          <span className="inline-flex items-center gap-1 uppercase font-black tracking-widest text-[9px]">
            <Zap className="h-2 w-2 text-red-500" /> Queue synced
          </span>
        </>
      }
      headerActions={
        <>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={!episode.navigation?.prev}
            asChild={!!episode.navigation?.prev}
            className="rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 hover:bg-surface-elevated"
          >
            {episode.navigation?.prev ? (
              <Link href={`/donghua/episode/${episode.navigation.prev}`}><ChevronLeft className="w-5 h-5" /></Link>
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
          <Button 
            variant="donghua" 
            size="icon" 
            disabled={!episode.navigation?.next}
            asChild={!!episode.navigation?.next}
            className="rounded-xl"
          >
            {episode.navigation?.next ? (
              <Link href={`/donghua/episode/${episode.navigation.next}`}><ChevronRight className="w-5 h-5" /></Link>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </>
      }
      stage={
        <VideoPlayer 
          mirrors={episode.mirrors} 
          defaultUrl={episode.default_embed} 
          title={episode.title}
          theme="donghua"
          hasNext={!!episode.navigation?.next}
          onNext={() => episode.navigation?.next && router.push(`/donghua/episode/${episode.navigation.next}`)}
        />
      }
      sidebar={
        donghua ? (
          <Paper tone="muted" shadow="sm" className="space-y-6 p-4 md:p-5">
              <div className="flex gap-4">
                <div className="aspect-[2/3] w-[4.5rem] flex-shrink-0 overflow-hidden rounded-2xl border border-border-subtle shadow-xl md:w-20">
                  <Image
                    src={donghua.thumb}
                    alt={donghua.title}
                    width={160}
                    height={240}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  <h3 className="mb-1.5 line-clamp-2 text-xs font-black leading-tight uppercase">{donghua.title}</h3>
                  <Button variant="outline" size="sm" asChild className="h-8 w-full justify-start rounded-full border-border-subtle bg-surface-1 text-[9px] hover:bg-surface-elevated">
                    <Link href={`/donghua/${episode.navigation?.anime_info || ''}`}>
                      <Info className="w-3 h-3 mr-2 text-red-500" /> View Details
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-3.5 border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Queue</h4>
                  <span className="text-[9px] font-bold text-zinc-600">{donghua.episodes.length} EPISODES</span>
                </div>
                
                <ScrollArea className="w-full h-[400px]">
                  <div className="flex flex-col gap-2 pr-4">
                    {donghua.episodes.map((ep) => (
                      <Link
                        key={ep.slug}
                        href={`/donghua/episode/${ep.slug}`}
                        className={cn(
                          "group flex items-center justify-between rounded-2xl border p-3.5 text-[10px] font-black uppercase tracking-widest transition-all",
                          episodeSlug === ep.slug 
                            ? "bg-red-600/10 border-red-600/50 text-red-400 shadow-lg shadow-red-600/5" 
                            : "border-border-subtle bg-surface-1 text-zinc-500 hover:bg-surface-elevated hover:text-zinc-200"
                        )}
                      >
                        <span className="line-clamp-1">{ep.title}</span>
                        {episodeSlug === ep.slug && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                      </Link>
                    ))}
                  </div>
                  <ScrollBar />
                </ScrollArea>
              </div>
          </Paper>
        ) : null
      }
    >
      {donghua ? (
        <section className="space-y-8">
          <DetailSectionHeading title="Overview" theme="donghua" />
          <Paper tone="muted" shadow="sm" className="space-y-3.5 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="px-2.5 py-1 text-[10px]">{donghua.meta.updated_on}</Badge>
              <Badge variant="outline" className="px-2.5 py-1 text-[10px]">{donghua.meta.status}</Badge>
              <Badge variant="outline" className="px-2.5 py-1 text-[10px]">{donghua.meta.duration}</Badge>
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              {donghua.synopsis || 'No synopsis available for this donghua.'}
            </p>
          </Paper>
        </section>
      ) : null}

      <div className="pb-2">
        <AdSection />
      </div>

      {donghua ? <CommunityCTA mediaId={episode.navigation?.anime_info || episodeSlug} title={donghua.title} type="donghua" theme="donghua" /> : null}
    </VideoPlaybackScaffold>
  );
}
