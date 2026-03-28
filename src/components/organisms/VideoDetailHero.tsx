'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, Clapperboard, Play, Settings2 } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { ModalContent, ModalDescription, ModalRoot, ModalTitle } from '@/components/atoms/Modal';
import { Paper } from '@/components/atoms/Paper';
import { SplitLayout } from '@/components/atoms/SplitLayout';
import { TitleBlock } from '@/components/atoms/TitleBlock';
import { getMediaPosterAspectClass, ThemeType, cn } from '@/lib/utils';
import { getVideoTrailerPreference, setVideoTrailerPreference } from '@/lib/store';

interface VideoHeroMetaItem {
  label: string;
  value: string;
}

interface VideoDetailHeroProps {
  theme: Extract<ThemeType, 'anime' | 'donghua' | 'movie'>;
  backHref: string;
  backLabel: string;
  poster: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badges: string[];
  metadata: VideoHeroMetaItem[];
  controls?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  trailerUrl?: string | null;
  galleryVariant?: 'default' | 'compact';
}

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
    }

    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return null;
  }
}

export function VideoDetailHero({
  theme,
  backHref,
  backLabel,
  poster,
  title,
  subtitle,
  eyebrow,
  badges,
  metadata,
  controls,
  primaryAction,
  secondaryAction,
  trailerUrl,
  galleryVariant = 'default',
}: VideoDetailHeroProps) {
  const [trailerPreference, setTrailerPreferenceState] = React.useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const embedUrl = React.useMemo(() => getYouTubeEmbedUrl(trailerUrl), [trailerUrl]);
  const canPlayTrailer = Boolean(embedUrl);

  React.useEffect(() => {
    const preference = getVideoTrailerPreference();
    setTrailerPreferenceState(preference);
    if (preference === null && canPlayTrailer) {
      setDialogOpen(true);
    }
  }, [canPlayTrailer]);

  const shouldPlayTrailer = Boolean(canPlayTrailer && trailerPreference);
  const isCompactGallery = galleryVariant === 'compact';
  const posterAspectClass = getMediaPosterAspectClass(theme);

  const savePreference = (value: boolean) => {
    setVideoTrailerPreference(value);
    setTrailerPreferenceState(value);
    setDialogOpen(false);
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md">
        <div className="absolute inset-0 overflow-hidden">
          {shouldPlayTrailer && embedUrl ? (
            <div className="pointer-events-none absolute inset-0 scale-[1.25] opacity-35">
              <iframe
                src={embedUrl}
                title={`${title} trailer`}
                allow="autoplay; encrypted-media; picture-in-picture"
                className="h-full w-full"
              />
            </div>
          ) : (
            <Image
              src={poster || '/favicon.ico'}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-20"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/68" />
        </div>

        <div className="relative z-10 px-5 py-5 md:px-7 md:py-7">
          <nav className="mb-6">
            <Button variant="outline" size="sm" asChild className="rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 hover:bg-surface-elevated">
              <Link href={backHref}>
                <ChevronLeft className="h-4 w-4" /> {backLabel}
              </Link>
            </Button>
          </nav>

          <SplitLayout
            mobileGoldenRows
            breakpoint="lg"
            className="items-end gap-6"
            stage={
              <div className="space-y-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <Badge key={badge} variant={theme}>
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canPlayTrailer ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => savePreference(!(trailerPreference ?? false))}
                        className={cn('rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 text-[10px] uppercase tracking-[0.24em] text-zinc-300 hover:bg-surface-elevated hover:text-white')}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Trailer {trailerPreference ? 'On' : 'Off'}
                      </Button>
                    ) : null}
                    {controls}
                  </div>
                </div>

                <TitleBlock
                  title={title}
                  subtitle={subtitle}
                  eyebrow={eyebrow}
                  theme={theme}
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  {primaryAction}
                  {secondaryAction}
                </div>
              </div>
            }
            gallery={
              <div className={cn('space-y-3.5', isCompactGallery && 'space-y-3')}>
                <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
                  <div className={cn('relative mx-auto w-40 md:w-48', posterAspectClass, isCompactGallery && 'w-36 md:w-40')}>
                    <Image
                      src={poster || '/favicon.ico'}
                      alt={title}
                      fill
                      sizes="208px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </Paper>
                <div className={cn('grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1', isCompactGallery && 'lg:grid-cols-2')}>
                  {metadata.map((item) => (
                    <Paper
                      key={item.label}
                      tone="muted"
                      shadow="sm"
                      className={cn('px-3.5 py-3', isCompactGallery && 'rounded-[var(--radius-md)] px-3 py-2.5')}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                      <p className={cn('mt-1.5 text-sm font-bold text-zinc-100', isCompactGallery && 'mt-1 text-[13px] leading-5')}>
                        {item.value}
                      </p>
                    </Paper>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      </section>

      <ModalRoot open={dialogOpen} onOpenChange={setDialogOpen}>
          <ModalContent className="z-[221] w-[calc(100vw-2rem)] max-w-lg rounded-[var(--radius-2xl)] border border-border-subtle bg-background p-6 shadow-2xl md:p-7" overlayClassName="z-[220]">
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-surface-1">
                  <Clapperboard className="h-6 w-6 text-zinc-200" />
                </div>
                <ModalTitle className="text-xl font-black uppercase tracking-tight text-white md:text-2xl">
                  Trailer Hero Preference
                </ModalTitle>
                <ModalDescription className="text-sm leading-relaxed text-zinc-400">
                  Kalau trailer tersedia, hero bisa langsung pakai background trailer. Pilihan ini disimpan sekali untuk semua halaman video.
                </ModalDescription>
              </div>

              <div className="grid gap-3">
                <Button variant={theme} className="h-12 rounded-[var(--radius-lg)]" onClick={() => savePreference(true)}>
                  Play Trailer If Available
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Button>
                <Button variant="outline" className="h-12 rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 hover:bg-surface-elevated" onClick={() => savePreference(false)}>
                  Keep Hero Static
                </Button>
              </div>
            </div>
          </ModalContent>
      </ModalRoot>
    </>
  );
}
