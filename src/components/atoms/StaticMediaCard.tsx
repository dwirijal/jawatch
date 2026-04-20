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
    anime: ['rgba(59,130,246,0.24)', 'rgba(96,165,250,0.18)'],
    manga: ['rgba(234,88,12,0.22)', 'rgba(251,146,60,0.18)'],
    donghua: ['rgba(239,68,68,0.22)', 'rgba(248,113,113,0.18)'],
    movie: ['rgba(99,102,241,0.22)', 'rgba(129,140,248,0.18)'],
    drama: ['rgba(244,63,94,0.22)', 'rgba(251,113,133,0.18)'],
    novel: ['rgba(180,83,9,0.24)', 'rgba(245,158,11,0.18)'],
    default: ['rgba(168,85,247,0.24)', 'rgba(56,189,248,0.22)', 'rgba(251,191,36,0.18)'],
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
      className="refractive-border glass-noise relative h-full overflow-hidden rounded-[var(--radius-2xl)] bg-[#0a0a0f] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
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
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_52%),linear-gradient(160deg,rgba(32,36,52,0.98),rgba(12,14,21,1))] p-4 text-center text-muted-foreground">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] leading-tight text-zinc-300">Poster Missing</span>
            <span className="mt-2 line-clamp-3 text-[11px] font-bold leading-relaxed tracking-tight text-zinc-500">{title}</span>
          </div>
        )}

        {!isNovelCard ? <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,4,8,0.96)_0%,rgba(4,4,8,0.62)_26%,rgba(4,4,8,0.18)_48%,rgba(4,4,8,0.2)_100%)]" /> : null}
        <div
          className={cn('absolute inset-0', isNovelCard ? 'opacity-35' : 'opacity-78')}
          style={{ background: `linear-gradient(180deg, ${accent} 0%, transparent 40%)` }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />

        <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
          <div className="rounded-full border border-white/16 bg-black/50 px-2.5 py-1 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{typeLabel}</span>
          </div>
          {showAuxiliaryBadge ? (
            <div className="rounded-full border border-white/16 bg-white/10 px-2.5 py-1 backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/82">{auxiliaryBadge}</span>
            </div>
          ) : null}
        </div>

        {!isNovelCard ? (
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className={cn('max-w-[82%] sm:max-w-[78%]', compactCopy && 'sm:max-w-[84%]')}>
              <h3
                className={cn(
                  'line-clamp-2 text-balance font-extrabold tracking-[-0.026em] text-white/95 drop-shadow-[0_4px_18px_rgba(0,0,0,0.42)] transition-colors duration-500 ease-out group-hover:text-white',
                  compactCopy ? 'text-[20px] leading-[1.06] sm:text-[24px]' : 'text-[22px] leading-[1.03] sm:text-[27px]'
                )}
              >
                {displayTitle}
              </h3>

              {effectiveSubtitle ? (
                <p className="mt-2 max-w-[33ch] line-clamp-2 text-[12px] leading-[1.54] text-white/58 transition-colors duration-500 ease-out group-hover:text-white/68 sm:text-[13px]">
                  {effectiveSubtitle}
                </p>
              ) : (
                <p className="mt-2 select-none text-[12px] leading-[1.54] text-transparent sm:text-[13px]">{'\u00A0'}</p>
              )}

              {metaLine ? (
                <p className="mt-2 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42 transition-colors duration-500 ease-out group-hover:text-white/60">
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
