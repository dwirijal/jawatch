'use client';

import * as React from 'react';
import { Clapperboard, Flame, Sparkles, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { MediaCard } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { Button } from '@/components/atoms/Button';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { VerticalShortsPager, type ShortDrama } from '@/components/organisms/VerticalShortsPager';
import { getDrachinHome, getDramaboxHome, getDrachinEpisodeBySlug, type DrachinHomeData, type DramaboxHomeData } from '@/lib/adapters/drama';
import { getShortsDetailHref } from '@/lib/shorts-paths';
import { useUIStore } from '@/store/useUIStore';

const EMPTY_HOME: DrachinHomeData = {
  featured: [],
  latest: [],
  popular: [],
};

const EMPTY_DRAMABOX_HOME: DramaboxHomeData = {
  latest: [],
  trending: [],
};

interface DrachinPageClientProps {
  entry?: 'drachin' | 'dramabox';
}

export default function DrachinPageClient({ entry = 'drachin' }: DrachinPageClientProps) {
  const [drachinData, setDrachinData] = React.useState<DrachinHomeData>(EMPTY_HOME);
  const [dramaboxData, setDramaboxData] = React.useState<DramaboxHomeData>(EMPTY_DRAMABOX_HOME);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'hub' | 'shorts'>('hub');
  const [shortsData, setShortsData] = React.useState<ShortDrama[]>([]);
  const [loadingShorts, setLoadingShorts] = React.useState(false);
  const { setNavbarHidden, setFooterHidden } = useUIStore();

  React.useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getDrachinHome(), getDramaboxHome()])
      .then(([drachinResult, dramaboxResult]) => {
        if (cancelled) {
          return;
        }

        if (drachinResult.status === 'fulfilled') {
          setDrachinData(drachinResult.value);
        }

        if (dramaboxResult.status === 'fulfilled') {
          setDramaboxData(dramaboxResult.value);
        }

        if (drachinResult.status === 'rejected' && dramaboxResult.status === 'rejected') {
          setError('Katalog short-drama belum bisa dibuka sekarang. Coba lagi sebentar.');
          return;
        }

        if (drachinResult.status === 'rejected' || dramaboxResult.status === 'rejected') {
          setError('Sebagian rak short-drama sedang bermasalah, tapi rak lainnya masih bisa dibuka.');
          return;
        }

        setError(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enterShortsMode = async () => {
    setLoadingShorts(true);
    setViewMode('shorts');
    setNavbarHidden(true);
    setFooterHidden(true);
    
    // Fetch first episode for each featured drama
    const featured = drachinData.featured.slice(0, 12);
    const shorts = await Promise.all(
      featured.map(async (item): Promise<ShortDrama | null> => {
        try {
          const ep = await getDrachinEpisodeBySlug(item.slug, 1);
          if (ep) {
            return {
              slug: item.slug,
              title: item.title,
              image: item.image,
              subtitle: item.subtitle,
              mirrors: ep.mirrors,
              defaultUrl: ep.defaultUrl,
            };
          }
        } catch (e) {
          console.error(`Failed to fetch mirrors for ${item.slug}`, e);
        }
        return null;
      })
    );
    
    const validShorts = shorts.filter((s): s is ShortDrama => s !== null);
    setShortsData(validShorts);
    setLoadingShorts(false);
  };

  const exitShortsMode = () => {
    setViewMode('hub');
    setNavbarHidden(false);
    setFooterHidden(false);
  };

  if (viewMode === 'shorts') {
    return (
      <div className="fixed inset-0 z-[500] bg-black">
        <button 
          onClick={exitShortsMode}
          className="absolute top-6 left-6 z-[600] h-12 w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {loadingShorts ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">Menyiapkan feed vertikal...</p>
          </div>
        ) : (
          <VerticalShortsPager shorts={shortsData} />
        )}
      </div>
    );
  }

  const description =
    entry === 'dramabox'
      ? 'Rute cepat untuk katalog shorts.'
      : 'Rak shorts di halaman nonton, lengkap dengan halaman judul, episode cepat, dan feed vertikal.';

  const introCopy =
    'Pilih cerita pendek dari sini. Kalau mau mode vertikal, buka feed dan lanjutkan episode tanpa pindah konteks.';
  const hasAnyShortLane =
    drachinData.featured.length > 0 ||
    drachinData.latest.length > 0 ||
    drachinData.popular.length > 0 ||
    dramaboxData.latest.length > 0 ||
    dramaboxData.trending.length > 0;
  const buildDramaboxDetailHref = (item: DramaboxHomeData['latest'][number]) => {
    return getShortsDetailHref(item.slug);
  };

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="Short Series"
        description={description}
        icon={Clapperboard}
        theme="drama"
        containerClassName="app-container-wide"
        footer={(
          <div className="flex flex-wrap gap-2">
            {['Pilihan', 'Terbaru', 'Populer', 'Trending'].map((label) => (
              <span
                key={label}
                className="rounded-full border border-border-subtle bg-surface-1 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="drama">Short vertikal</Badge>
          <Button 
            variant="drama" 
            size="sm" 
            className="h-8 rounded-full px-4 text-[10px] font-black uppercase tracking-widest"
            onClick={enterShortsMode}
            disabled={loading || drachinData.featured.length === 0}
          >
            <Play className="mr-2 h-3 w-3 fill-current" />
            Feed vertikal
          </Button>
        </div>
      </MediaHubHeader>

      <main className="app-container-wide mt-5 space-y-8 sm:mt-6 md:space-y-10">
        <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
          <p className="text-sm leading-6 text-zinc-400">{introCopy}</p>
        </Paper>

        <AdSection />

        {error && !loading ? (
          <StateInfo
            type="empty"
            title="Sebagian katalog short-drama belum bisa dibuka"
            description={error}
          />
        ) : null}

        <div className="app-section-stack">
          {!loading && !hasAnyShortLane ? (
            <StateInfo
              type="empty"
              title="Katalog shorts sedang disiapkan"
              description="Sumber data aktif, tapi belum ada cerita pilihan, terbaru, atau populer yang siap tampil sekarang."
            />
          ) : null}

          {loading || drachinData.featured.length > 0 ? (
            <SectionCard title="Cerita pilihan" subtitle="Short-drama pilihan yang siap kamu cek dulu." icon={Sparkles} mode="rail" railVariant="compact">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`featured-${index}`} />)
                : drachinData.featured.map((item) => (
                  <MediaCard
                    key={`featured-${item.slug}`}
                    href={getShortsDetailHref(item.slug)}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                    aspectRatio="feature"
                  />
                ))}
            </SectionCard>
          ) : null}

          {loading || drachinData.latest.length > 0 ? (
            <SectionCard title="Episode terbaru" subtitle="Update terbaru dari rak Drachin." icon={Clapperboard} gridDensity="default">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`latest-${index}`} />)
                : drachinData.latest.map((item) => (
                  <MediaCard
                    key={`latest-${item.slug}`}
                    href={getShortsDetailHref(item.slug)}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
            </SectionCard>
          ) : null}

          {loading || dramaboxData.latest.length > 0 ? (
            <SectionCard title="DramaBox terbaru" subtitle="Update terbaru dari rak DramaBox." icon={Clapperboard} gridDensity="default">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`dramabox-latest-${index}`} />)
                : dramaboxData.latest.map((item) => (
                  <MediaCard
                    key={`dramabox-latest-${item.slug}`}
                    href={buildDramaboxDetailHref(item)}
                    image={item.image}
                    title={item.title}
                    subtitle={item.subtitle}
                    theme="drama"
                  />
                ))}
            </SectionCard>
          ) : null}

          {loading || drachinData.popular.length > 0 ? (
            <SectionCard title="Cerita populer" subtitle="Short-drama yang paling sering dibuka." icon={Flame} gridDensity="default">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`popular-${index}`} />)
                : drachinData.popular.map((item) => (
                    <MediaCard
                      key={`popular-${item.slug}`}
                      href={getShortsDetailHref(item.slug)}
                      image={item.image}
                      title={item.title}
                      subtitle={item.subtitle}
                      theme="drama"
                    />
                  ))}
            </SectionCard>
          ) : null}

          {loading || dramaboxData.trending.length > 0 ? (
            <SectionCard title="DramaBox trending" subtitle="Judul DramaBox yang lagi ramai." icon={Flame} gridDensity="default">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`dramabox-trending-${index}`} />)
                : dramaboxData.trending.map((item) => (
                    <MediaCard
                      key={`dramabox-trending-${item.slug}`}
                      href={buildDramaboxDetailHref(item)}
                      image={item.image}
                      title={item.title}
                      subtitle={item.subtitle}
                      theme="drama"
                    />
                  ))}
            </SectionCard>
          ) : null}
        </div>
      </main>
    </div>
  );
}
