import type { CSSProperties } from 'react';
import Image from 'next/image';
import { normalizeComicImageUrl } from '@/lib/comic-media';
import { cn, getCardAspectClass, getMediaKindLabel, type CardAspectRatio, ThemeType } from '@/lib/utils';
import { Link } from './Link';

export interface StaticMediaCardProps {
  href?: string;
  image: string;
  title: string;
  subtitle?: string;
  metaLine?: string;
  badgeText?: string;
  contentLabel?: string;
  theme?: ThemeType;
  aspectRatio?: CardAspectRatio;
  className?: string;
  prefetch?: boolean;
}

function normalizeCardImage(image: string, theme: ThemeType): string {
  const trimmed = image.trim();
  if (!trimmed) {
    return '';
  }

  return theme === 'movie' ? trimmed : normalizeComicImageUrl(trimmed);
}

function shouldUseCompactCopy(title: string): boolean {
  const normalized = title.trim();
  if (!normalized) {
    return false;
  }

  return normalized.length > 28 || normalized.split(/\s+/).length > 5;
}

function splitCardTitle(title: string): { title: string; derivedSubtitle?: string } {
  const normalized = title.trim();
  const separatorIndex = normalized.indexOf(':');

  if (separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    return { title: normalized };
  }

  const primary = normalized.slice(0, separatorIndex).trim();
  const secondary = normalized.slice(separatorIndex + 1).trim();

  if (!primary || !secondary || secondary.length > 60) {
    return { title: normalized };
  }

  return {
    title: primary,
    derivedSubtitle: secondary,
  };
}

function getAccent(href: string | undefined, title: string, theme: ThemeType): string {
  const palettes: Record<ThemeType, string[]> = {
    anime: ['color-mix(in srgb, var(--theme-anime-shadow) 24%, transparent)', 'color-mix(in srgb, var(--theme-anime-fill) 18%, transparent)'],
    manga: ['color-mix(in srgb, var(--theme-manga-shadow) 22%, transparent)', 'color-mix(in srgb, var(--theme-manga-fill) 18%, transparent)'],
    donghua: ['color-mix(in srgb, var(--theme-donghua-shadow) 22%, transparent)', 'color-mix(in srgb, var(--theme-donghua-fill) 18%, transparent)'],
    movie: ['color-mix(in srgb, var(--theme-movie-shadow) 22%, transparent)', 'color-mix(in srgb, var(--theme-movie-fill) 18%, transparent)'],
    drama: ['color-mix(in srgb, var(--theme-drama-shadow) 22%, transparent)', 'color-mix(in srgb, var(--theme-drama-fill) 18%, transparent)'],
    novel: ['color-mix(in srgb, var(--theme-novel-shadow) 24%, transparent)', 'color-mix(in srgb, var(--theme-novel-fill) 18%, transparent)'],
    default: ['color-mix(in srgb, var(--theme-default-shadow) 24%, transparent)', 'color-mix(in srgb, var(--accent) 22%, transparent)', 'color-mix(in srgb, var(--signal-warning) 18%, transparent)'],
  };

  const pool = palettes[theme] ?? palettes.default;
  const seed = `${href ?? ''}:${title}`.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return pool[seed % pool.length] ?? pool[0];
}

export function StaticMediaCard({
  href,
  image,
  title,
  subtitle,
  metaLine,
  badgeText,
  contentLabel,
  theme = 'default',
  aspectRatio = 'default',
  className,
  prefetch = false,
}: StaticMediaCardProps) {
  const displayImage = normalizeCardImage(image, theme);
  const splitTitle = splitCardTitle(title);
  const displayTitle = splitTitle.title || title;
  const effectiveSubtitle = subtitle || splitTitle.derivedSubtitle;
  const compactCopy = shouldUseCompactCopy(displayTitle);
  const accent = getAccent(href, title, theme);
  const isNovelCard = theme === 'novel';
  const typeLabel = (contentLabel?.trim() || getMediaKindLabel(theme)).toUpperCase();
  const auxiliaryBadge = badgeText?.trim() || '';
  const showAuxiliaryBadge = auxiliaryBadge && auxiliaryBadge.toUpperCase() !== typeLabel;

  const cardBody = (
    <div
      className="refractive-border glass-noise relative h-full overflow-hidden rounded-[var(--radius-2xl)] bg-surface-1 shadow-[0_10px_28px_color-mix(in_srgb,var(--shadow-color)_58%,transparent)] transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_color-mix(in_srgb,var(--shadow-color-strong)_64%,transparent)]"
      style={{ '--hover-glow': accent } as CSSProperties}
    >
      <div className="absolute -inset-2 bg-[var(--hover-glow)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-15" />

      <div className="relative h-full overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={title}
            fill
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.028]"
            sizes="(max-width: 500px) 48vw, (max-width: 768px) 33vw, (max-width: 1200px) 20vw, 12vw"
            quality={68}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--surface-2)_70%,white_30%),transparent_52%),linear-gradient(160deg,var(--surface-2),var(--surface-1))] p-[var(--space-md)] text-center text-muted-foreground">
            <span className="text-[var(--type-size-xs)] font-black uppercase leading-[var(--type-line-tight)] tracking-[var(--type-tracking-kicker)] text-muted-foreground">Poster Missing</span>
            <span className="mt-[var(--space-xs)] line-clamp-3 text-[var(--type-size-xs)] font-bold leading-[var(--type-line-body)] tracking-[var(--type-tracking-normal)] text-muted-foreground">{title}</span>
          </div>
        )}

        {!isNovelCard ? <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,4,8,0.96)_0%,rgba(4,4,8,0.62)_26%,rgba(4,4,8,0.18)_48%,rgba(4,4,8,0.2)_100%)]" /> : null}
        <div
          className={cn('absolute inset-0', isNovelCard ? 'opacity-35' : 'opacity-78')}
          style={{ background: `linear-gradient(180deg, ${accent} 0%, transparent 40%)` }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />

        <div className="absolute left-[var(--space-md)] top-[var(--space-md)] flex max-w-[calc(100%-calc(var(--space-md)*2))] flex-wrap items-center gap-[var(--space-xs)]">
          <div className="rounded-full border border-white/16 bg-surface-1/50 px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] backdrop-blur-md">
            <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--accent-contrast)]">{typeLabel}</span>
          </div>
          {showAuxiliaryBadge ? (
            <div className="rounded-full border border-white/16 bg-white/10 px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] backdrop-blur-md">
              <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--accent-contrast)]/82">{auxiliaryBadge}</span>
            </div>
          ) : null}
        </div>

        {!isNovelCard ? (
          <div className="absolute inset-x-0 bottom-0 p-[var(--space-md)] sm:p-[var(--space-lg)]">
            <div className={cn('max-w-[82%] sm:max-w-[78%]', compactCopy && 'sm:max-w-[84%]')}>
              <h3
                className={cn(
                  'line-clamp-2 text-balance font-extrabold tracking-[var(--type-tracking-normal)] text-[var(--accent-contrast)]/95 drop-shadow-[0_4px_18px_rgba(0,0,0,0.42)] transition-colors duration-500 ease-out group-hover:text-[var(--accent-contrast)]',
                  compactCopy ? 'text-[var(--type-size-xl)] leading-[var(--type-line-heading)] sm:text-[var(--type-size-2xl)]' : 'text-[var(--type-size-2xl)] leading-[var(--type-line-heading)] sm:text-[var(--type-size-3xl)]'
                )}
              >
                {displayTitle}
              </h3>

              {effectiveSubtitle ? (
                <p className="mt-[var(--space-xs)] max-w-[33ch] line-clamp-2 text-[var(--type-size-xs)] leading-[var(--type-line-body)] text-[var(--accent-contrast)]/58 transition-colors duration-500 ease-out group-hover:text-[var(--accent-contrast)]/68 sm:text-[var(--type-size-sm)]">
                  {effectiveSubtitle}
                </p>
              ) : (
                <p className="mt-[var(--space-xs)] select-none text-[var(--type-size-xs)] leading-[var(--type-line-body)] text-transparent sm:text-[var(--type-size-sm)]">{'\u00A0'}</p>
              )}

              {metaLine ? (
                <p className="mt-[var(--space-xs)] line-clamp-1 text-[var(--type-size-xs)] font-semibold uppercase tracking-[var(--type-tracking-kicker)] text-[var(--accent-contrast)]/42 transition-colors duration-500 ease-out group-hover:text-[var(--accent-contrast)]/60">
                  {metaLine}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const wrapperClassName = cn(href ? 'focus-tv' : 'cursor-default', 'group relative block', getCardAspectClass(aspectRatio, theme), className);

  if (!href) {
    return <div className={wrapperClassName}>{cardBody}</div>;
  }

  return (
    <Link href={href} prefetch={prefetch} className={wrapperClassName}>
      {cardBody}
    </Link>
  );
}
