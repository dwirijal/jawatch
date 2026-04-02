import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { TitleBlock } from '@/components/atoms/TitleBlock';
import { ThemeType, cn } from '@/lib/utils';

interface VideoHeroMetaItem {
  label: string;
  value: string;
}

export interface VideoDetailHeroFrameProps {
  theme: Extract<ThemeType, 'anime' | 'donghua' | 'movie' | 'drama'>;
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
  galleryVariant?: 'default' | 'compact';
  backgroundLayer?: React.ReactNode;
  headerAside?: React.ReactNode;
}

export function VideoDetailHeroFrame({
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
  galleryVariant = 'default',
  backgroundLayer,
  headerAside,
}: VideoDetailHeroFrameProps) {
  const isCompactGallery = galleryVariant === 'compact';

  return (
    <section className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md lg:aspect-video">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={poster || '/favicon.ico'}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20"
        />
        {backgroundLayer}
        <div className="absolute inset-0 bg-black/68" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 py-5 md:px-7 md:py-7">
        <nav className="mb-4 shrink-0 md:mb-6">
          <Button variant="outline" size="sm" asChild className="rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 hover:bg-surface-elevated">
            <Link href={backHref}>
              <ChevronLeft className="h-4 w-4" /> {backLabel}
            </Link>
          </Button>
        </nav>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-4 lg:gap-5">
          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-4 lg:gap-6">
            <div className="min-w-0 self-end space-y-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <Badge key={badge} variant={theme}>
                      {badge}
                    </Badge>
                  ))}
                </div>

                {headerAside}
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
                {controls}
              </div>
            </div>

            <Paper tone="muted" shadow="sm" padded={false} className="min-h-[12rem] justify-self-end overflow-hidden bg-[#06070b] lg:min-h-0 lg:h-full">
              <div className="relative h-full w-auto">
                <Image
                  src={poster || '/favicon.ico'}
                  alt={title}
                  width={800}
                  height={1200}
                  sizes="(max-width: 640px) 32vw, (max-width: 1024px) 26vw, 24vw"
                  priority
                  className="h-full w-auto max-w-none object-contain"
                />
              </div>
            </Paper>
          </div>

          <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6', isCompactGallery && 'xl:grid-cols-3')}>
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
      </div>
    </section>
  );
}
