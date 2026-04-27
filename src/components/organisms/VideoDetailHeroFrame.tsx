import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { PosterImageWithFallback } from '@/components/atoms/PosterImageWithFallback';
import { TitleBlock } from '@/components/atoms/TitleBlock';
import { DEFAULT_MEDIA_BACKGROUND, ThemeType, cn } from '@/lib/utils';

interface VideoHeroMetaItem {
  label: string;
  value: string;
}

export interface VideoDetailHeroFrameProps {
  theme: Extract<ThemeType, 'anime' | 'donghua' | 'movie' | 'drama'>;
  backHref: string;
  backLabel: string;
  poster: string;
  backgroundImage?: string;
  logoSrc?: string;
  logoAlt?: string;
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
  backgroundImage,
  logoSrc,
  logoAlt,
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
  const heroBackground = backgroundImage || poster || DEFAULT_MEDIA_BACKGROUND;

  return (
    <section className="relative min-h-[42rem] overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md lg:aspect-video lg:min-h-0">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={heroBackground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20"
          unoptimized
        />
        {backgroundLayer}
        <div className="absolute inset-0 bg-black/68" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-[var(--space-lg)] py-5 md:px-7 md:py-7">
        <nav className="mb-4 shrink-0 md:mb-6">
          <Button
            variant="outline"
            asChild
            className="h-[var(--size-control-md)] rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 px-[var(--space-md)] text-[var(--type-size-xs)] uppercase tracking-[var(--type-tracking-kicker)] hover:bg-surface-elevated"
          >
            <Link href={backHref}>
              <ChevronLeft className="h-4 w-4" /> {backLabel}
            </Link>
          </Button>
        </nav>

        <div className="grid min-h-0 flex-1 gap-[var(--space-md)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-5">
          <div className="flex min-h-0 flex-col-reverse gap-[var(--space-lg)] lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-6">
            <div className="min-w-0 self-start space-y-4 lg:self-end lg:space-y-5">
              <div className="flex flex-col gap-[var(--space-sm)] xl:flex-row xl:items-start xl:justify-between">
                <div className="flex flex-wrap gap-[var(--space-xs)]">
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
                logoSrc={logoSrc}
                logoAlt={logoAlt}
                className="max-w-3xl space-y-2.5 md:space-y-3"
              />

              <div className="flex flex-wrap items-center gap-[calc(var(--space-xs)+var(--space-2xs))]">
                {primaryAction}
                {secondaryAction}
                {controls}
              </div>
            </div>

            <Paper
              tone="muted"
              shadow="sm"
              padded={false}
              className="relative mx-auto aspect-[2/3] w-[55%] max-w-[200px] overflow-hidden bg-surface-1 premium-shadow lg:mx-0 lg:h-full lg:w-auto lg:max-w-none lg:justify-self-end"
            >
              <div className="relative h-full w-full lg:w-auto">
                <PosterImageWithFallback
                  src={poster}
                  title={title}
                  sizes="(max-width: 640px) 55vw, (max-width: 1024px) 26vw, 24vw"
                  priority
                  unoptimized
                  imageClassName="object-cover lg:object-contain"
                />
              </div>
            </Paper>
          </div>

          <div className={cn('scrollbars-hidden flex snap-x snap-mandatory scroll-p-2 gap-[calc(var(--space-xs)+var(--space-2xs))] overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-6 lg:overflow-visible lg:pb-0', isCompactGallery && 'xl:grid-cols-3')}>
            {metadata.map((item) => (
              <Paper
                key={item.label}
                tone="muted"
                shadow="sm"
                className={cn('glass-morphism min-w-[130px] shrink-0 snap-start px-[calc(var(--space-sm)+var(--space-2xs))] py-[var(--space-sm)] sm:min-w-0 sm:shrink', isCompactGallery && 'rounded-[var(--radius-md)] px-[var(--space-sm)] py-[calc(var(--space-xs)+var(--space-2xs))]')}
              >
                <p className="type-metadata">{item.label}</p>
                <p className={cn('mt-1.5 text-sm font-bold text-foreground', isCompactGallery && 'mt-1 text-[var(--type-size-sm)] leading-5')}>
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
