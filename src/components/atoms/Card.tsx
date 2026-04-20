'use client';

import * as React from 'react';
import Image from 'next/image';
import { BookCoverArt } from '@/components/atoms/BookCoverArt';
import { Link } from '@/components/atoms/Link';
import { Typography } from '@/components/atoms/Typography';
import { getHDThumbnail } from '@/lib/adapters/comic';
import { cn, getCardAspectClass, getMediaKindLabel, type CardAspectRatio, type ThemeType } from '@/lib/utils';

export interface MediaCardProps {
  href?: string;
  image: string;
  title: string;
  subtitle?: string;
  metaLine?: string;
  badgeText?: string;
  contentLabel?: string;
  theme?: ThemeType;
  aspectRatio?: CardAspectRatio;
  displayVariant?: 'default' | 'shelf';
  className?: string;
  prefetch?: boolean;
}

export interface CastItem {
  id: string | number;
  name: string;
  role?: string;
  image?: string;
  secondary?: string;
  secondaryLabel?: string;
}

export interface CastCardProps {
  item: CastItem;
  theme: Extract<ThemeType, 'anime' | 'movie'>;
  layout?: 'grid' | 'scroll';
}

const MEDIA_CARD_ACCENT: Record<ThemeType, { glow: string; labelBg: string; labelText: string }> = {
  anime: {
    glow: 'rgba(200, 137, 170, 0.22)',
    labelBg: 'var(--theme-anime-surface)',
    labelText: 'var(--theme-anime-text)',
  },
  manga: {
    glow: 'rgba(199, 154, 99, 0.22)',
    labelBg: 'var(--theme-manga-surface)',
    labelText: 'var(--theme-manga-text)',
  },
  donghua: {
    glow: 'rgba(205, 139, 115, 0.22)',
    labelBg: 'var(--theme-donghua-surface)',
    labelText: 'var(--theme-donghua-text)',
  },
  movie: {
    glow: 'rgba(209, 168, 111, 0.24)',
    labelBg: 'var(--theme-movie-surface)',
    labelText: 'var(--theme-movie-text)',
  },
  drama: {
    glow: 'rgba(184, 138, 168, 0.24)',
    labelBg: 'var(--theme-drama-surface)',
    labelText: 'var(--theme-drama-text)',
  },
  novel: {
    glow: 'rgba(178, 154, 121, 0.22)',
    labelBg: 'var(--theme-novel-surface)',
    labelText: 'var(--theme-novel-text)',
  },
  default: {
    glow: 'rgba(31, 27, 23, 0.18)',
    labelBg: 'var(--theme-default-surface)',
    labelText: 'var(--theme-default-text)',
  },
};

function normalizeCardImage(image: string, theme: ThemeType): string {
  const trimmed = image.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (theme === 'movie') {
    return trimmed;
  }

  return getHDThumbnail(trimmed);
}

function shouldUseCompactCopy(title: string): boolean {
  const normalized = title.trim();
  if (!normalized) {
    return false;
  }

  const wordCount = normalized.split(/\s+/).length;
  return normalized.length > 28 || wordCount > 5;
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function MediaCard({
  href,
  image,
  title,
  subtitle,
  metaLine,
  badgeText,
  contentLabel,
  theme = 'default',
  aspectRatio = 'default',
  displayVariant = 'default',
  className,
  prefetch,
}: MediaCardProps) {
  const [displayImage, setDisplayImage] = React.useState(normalizeCardImage(image, theme));
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);
  const splitTitle = React.useMemo(() => splitCardTitle(title), [title]);
  const displayTitle = splitTitle.title || title;
  const effectiveSubtitle = subtitle || splitTitle.derivedSubtitle;
  const compactCopy = shouldUseCompactCopy(displayTitle);
  const accent = MEDIA_CARD_ACCENT[theme] ?? MEDIA_CARD_ACCENT.default;
  const typeLabel = (contentLabel?.trim() || getMediaKindLabel(theme)).toUpperCase();
  const auxiliaryBadge = badgeText?.trim() || '';
  const showAuxiliaryBadge = auxiliaryBadge && auxiliaryBadge.toUpperCase() !== typeLabel;
  const effectiveAspectRatio = displayVariant === 'shelf' && aspectRatio === 'default' ? 'landscape' : aspectRatio;
  const isShelfVariant = displayVariant === 'shelf';
  const displayMetaLine = metaLine?.trim();

  React.useEffect(() => {
    setDisplayImage(normalizeCardImage(image, theme));
    setImageLoadFailed(false);
  }, [image, theme]);

  const posterSurface = theme === 'novel' ? (
    <BookCoverArt
      src={displayImage}
      title={title}
      subtitle={effectiveSubtitle}
      sizes={isShelfVariant ? '(max-width: 767px) 88vw, (max-width: 1279px) 48vw, 34vw' : '(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 18vw'}
      imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
    />
  ) : displayImage && !imageLoadFailed ? (
    <Image
      src={displayImage}
      alt={title}
      fill
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      sizes={isShelfVariant ? '(max-width: 767px) 88vw, (max-width: 1279px) 48vw, 34vw' : '(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 18vw'}
      quality={isShelfVariant ? 82 : 78}
      unoptimized
      onError={() => setImageLoadFailed(true)}
    />
  ) : (
    <div className="jawatch-poster-missing flex h-full w-full items-end bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--surface-1)_100%)]" />
  );

  const cardBody = isShelfVariant ? (
    <div
      className="group relative h-full overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,white_18%)_0%,var(--surface-1)_100%)] shadow-[0_28px_72px_-48px_var(--shadow-color-strong)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-white/18 hover:shadow-[0_38px_100px_-58px_var(--shadow-color-strong)]"
      style={
        {
          '--card-glow': accent.glow,
          '--card-badge-bg': accent.labelBg,
          '--card-badge-text': accent.labelText,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0">
        {posterSurface}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--card-glow),transparent_56%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,11,0.08)_0%,rgba(7,8,11,0.18)_38%,rgba(7,8,11,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,11,0.42)_0%,rgba(7,8,11,0.08)_45%,rgba(7,8,11,0.42)_100%)]" />

      <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 sm:left-4 sm:top-4">
        <div className="rounded-full border border-white/16 bg-black/42 px-2.5 py-1 backdrop-blur-md">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {typeLabel}
          </span>
        </div>
        {showAuxiliaryBadge ? (
          <div className="rounded-full border border-white/16 bg-[var(--card-badge-bg)] px-2.5 py-1 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--card-badge-text)]">
              {auxiliaryBadge}
            </span>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="max-w-[85%] space-y-2 sm:max-w-[78%]">
          <Typography
            as="h3"
            className={cn(
              'line-clamp-2 text-white transition-colors duration-200 group-hover:text-white/95',
              compactCopy ? 'text-base leading-5 sm:text-lg' : 'text-lg leading-5 sm:text-[1.35rem] sm:leading-6',
            )}
          >
            {displayTitle}
          </Typography>

          {effectiveSubtitle ? (
            <p className="line-clamp-2 text-[11px] leading-5 text-white/78 sm:text-sm sm:leading-5">
              {effectiveSubtitle}
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-1 text-white/72">
            {displayMetaLine ? (
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/78">
                {displayMetaLine}
              </p>
            ) : null}
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-black/22 transition-transform duration-200 group-hover:translate-x-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_90%,white_10%)_0%,var(--surface-1)_100%)] shadow-[0_24px_60px_-42px_var(--shadow-color)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_36px_90px_-56px_var(--shadow-color-strong)]"
      style={
        {
          '--card-glow': accent.glow,
          '--card-badge-bg': accent.labelBg,
          '--card-badge-text': accent.labelText,
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,var(--card-glow),transparent_72%)] opacity-90" />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {posterSurface}
        {(displayImage && !imageLoadFailed) || theme === 'novel' ? (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(7,8,11,0.08)_40%,rgba(7,8,11,0.72)_100%)]" />
        ) : null}

        <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
          <div className="rounded-full border border-white/18 bg-black/55 px-2.5 py-1 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {typeLabel}
            </span>
          </div>
          {showAuxiliaryBadge ? (
            <div className="rounded-full border border-white/18 bg-[var(--card-badge-bg)] px-2.5 py-1 backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--card-badge-text)]">
                {auxiliaryBadge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-col gap-3 border-t border-white/8 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_94%,white_6%)_0%,var(--surface-elevated)_100%)] p-4">
        <div className="space-y-2">
          <Typography
            as="h3"
            className={cn(
              'line-clamp-2 text-foreground transition-colors duration-200 group-hover:text-[var(--accent-strong)]',
              compactCopy ? 'text-base leading-5 sm:text-lg' : 'text-lg leading-5 sm:text-xl',
            )}
          >
            {displayTitle}
          </Typography>

          {effectiveSubtitle ? (
            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-[13px]">
              {effectiveSubtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-1">
          {displayMetaLine ? (
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {displayMetaLine}
            </p>
          ) : null}
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
            Open
          </span>
          <span className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );

  const wrapperClassName = cn(
    href ? 'focus-tv' : 'cursor-default',
    'relative block',
    getCardAspectClass(effectiveAspectRatio, theme),
    isShelfVariant && 'mx-auto w-full max-w-[356px] md:max-w-none',
    className,
  );

  if (!href) {
    return <div className={wrapperClassName}>{cardBody}</div>;
  }

  return (
    <Link href={href} prefetch={prefetch} className={wrapperClassName}>
      {cardBody}
    </Link>
  );
}

export function CastCard({ item, layout = 'grid' }: CastCardProps) {
  const initials = getInitials(item.name);

  if (layout === 'scroll') {
    return (
      <article className="group relative w-[160px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-elevated shadow-[0_20px_48px_-38px_var(--shadow-color)] transition-all duration-300 hover:-translate-y-1 hover:border-border-strong">
        <div className="relative aspect-[4/5] overflow-hidden">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="160px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-2">
              <span className="text-xl font-medium uppercase tracking-tighter text-muted-foreground">
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 p-4">
          <Typography as="h3" className="line-clamp-1 text-[14px] font-bold tracking-tight text-foreground">
            {item.name}
          </Typography>

          {item.role ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {item.role}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-elevated p-4 shadow-[0_20px_48px_-38px_var(--shadow-color)] transition-all duration-300 hover:border-border-strong">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-2">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="56px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <span className="text-sm font-medium uppercase tracking-tighter text-muted-foreground">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Typography as="h3" className="line-clamp-1 text-[15px] font-bold tracking-tight text-foreground">
          {item.name}
        </Typography>

        {item.role ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {item.role}
          </p>
        ) : null}

        {item.secondary ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {item.secondaryLabel ? `${item.secondaryLabel}: ` : null}
            {item.secondary}
          </p>
        ) : null}
      </div>
    </article>
  );
}
