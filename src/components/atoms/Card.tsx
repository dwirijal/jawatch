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
    glow: 'color-mix(in srgb, var(--theme-anime-shadow) 22%, transparent)',
    labelBg: 'var(--theme-anime-surface)',
    labelText: 'var(--theme-anime-text)',
  },
  manga: {
    glow: 'color-mix(in srgb, var(--theme-manga-shadow) 22%, transparent)',
    labelBg: 'var(--theme-manga-surface)',
    labelText: 'var(--theme-manga-text)',
  },
  donghua: {
    glow: 'color-mix(in srgb, var(--theme-donghua-shadow) 22%, transparent)',
    labelBg: 'var(--theme-donghua-surface)',
    labelText: 'var(--theme-donghua-text)',
  },
  movie: {
    glow: 'color-mix(in srgb, var(--theme-movie-shadow) 24%, transparent)',
    labelBg: 'var(--theme-movie-surface)',
    labelText: 'var(--theme-movie-text)',
  },
  drama: {
    glow: 'color-mix(in srgb, var(--theme-drama-shadow) 24%, transparent)',
    labelBg: 'var(--theme-drama-surface)',
    labelText: 'var(--theme-drama-text)',
  },
  novel: {
    glow: 'color-mix(in srgb, var(--theme-novel-shadow) 22%, transparent)',
    labelBg: 'var(--theme-novel-surface)',
    labelText: 'var(--theme-novel-text)',
  },
  default: {
    glow: 'color-mix(in srgb, var(--theme-default-shadow) 18%, transparent)',
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

      <div className="absolute left-[var(--space-sm)] top-[var(--space-sm)] flex max-w-[calc(100%-var(--space-xl))] flex-wrap gap-[var(--space-2xs)] sm:left-[var(--space-md)] sm:top-[var(--space-md)]">
        <div className="rounded-full border border-white/16 bg-surface-1/42 px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] backdrop-blur-md">
          <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--accent-contrast)]">
            {typeLabel}
          </span>
        </div>
        {showAuxiliaryBadge ? (
          <div className="rounded-full border border-white/16 bg-[var(--card-badge-bg)] px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] backdrop-blur-md">
            <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--card-badge-text)]">
              {auxiliaryBadge}
            </span>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-[var(--space-md)] sm:p-[var(--space-lg)]">
        <div className="max-w-[85%] space-y-[var(--space-xs)] sm:max-w-[78%]">
          <Typography
            as="h3"
            className={cn(
              'line-clamp-2 text-[var(--accent-contrast)] transition-colors duration-200 group-hover:text-[var(--accent-contrast)]/95',
              compactCopy ? 'text-[var(--type-size-base)] leading-[var(--type-line-heading)] sm:text-[var(--type-size-lg)]' : 'text-[var(--type-size-lg)] leading-[var(--type-line-heading)] sm:text-[var(--type-size-xl)]',
            )}
          >
            {displayTitle}
          </Typography>

          {effectiveSubtitle ? (
            <p className="line-clamp-2 text-[var(--type-size-xs)] leading-[var(--type-line-body)] text-[var(--accent-contrast)]/78 sm:text-[var(--type-size-sm)]">
              {effectiveSubtitle}
            </p>
          ) : null}

          <div className="flex items-center gap-[var(--space-xs)] pt-[var(--space-2xs)] text-[var(--accent-contrast)]/72">
            {displayMetaLine ? (
              <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--accent-contrast)]/78">
                {displayMetaLine}
              </p>
            ) : null}
            <span className="inline-flex h-[calc(var(--size-icon-lg)+var(--space-2xs))] w-[calc(var(--size-icon-lg)+var(--space-2xs))] items-center justify-center rounded-full border border-white/14 bg-surface-1/22 transition-transform duration-200 group-hover:translate-x-1">
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

        <div className="absolute left-[var(--space-sm)] top-[var(--space-sm)] flex max-w-[calc(100%-var(--space-xl))] flex-wrap gap-[var(--space-2xs)]">
          <div className="rounded-full border border-white/18 bg-surface-1/55 px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] backdrop-blur-md">
            <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--accent-contrast)]">
              {typeLabel}
            </span>
          </div>
          {showAuxiliaryBadge ? (
            <div className="rounded-full border border-white/18 bg-[var(--card-badge-bg)] px-[calc(var(--space-xs)+var(--space-2xs))] py-[var(--space-2xs)] backdrop-blur-md">
              <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--card-badge-text)]">
                {auxiliaryBadge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-col gap-[var(--space-sm)] border-t border-white/8 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_94%,white_6%)_0%,var(--surface-elevated)_100%)] p-[var(--space-md)]">
        <div className="space-y-[var(--space-xs)]">
          <Typography
            as="h3"
            className={cn(
              'line-clamp-2 text-foreground transition-colors duration-200 group-hover:text-[var(--accent-strong)]',
              compactCopy ? 'text-[var(--type-size-base)] leading-[var(--type-line-heading)] sm:text-[var(--type-size-lg)]' : 'text-[var(--type-size-lg)] leading-[var(--type-line-heading)] sm:text-[var(--type-size-xl)]',
            )}
          >
            {displayTitle}
          </Typography>

          {effectiveSubtitle ? (
            <p className="line-clamp-2 text-[var(--type-size-xs)] leading-[var(--type-line-body)] text-muted-foreground sm:text-[var(--type-size-sm)]">
              {effectiveSubtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-[var(--space-sm)] pt-[var(--space-2xs)]">
          {displayMetaLine ? (
            <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
              {displayMetaLine}
            </p>
          ) : null}
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground">
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
      <article className="group relative w-[calc(var(--size-panel-sm)/2)] shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-elevated shadow-[0_20px_48px_-38px_var(--shadow-color)] transition-all duration-300 hover:-translate-y-1 hover:border-border-strong">
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
              <span className="text-xl font-medium uppercase tracking-[var(--type-tracking-normal)] text-muted-foreground">
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-[var(--space-xs)] p-[var(--space-md)]">
          <Typography as="h3" className="line-clamp-1 text-[var(--type-size-sm)] font-bold tracking-[var(--type-tracking-normal)] text-foreground">
            {item.name}
          </Typography>

          {item.role ? (
            <p className="text-[var(--type-size-xs)] font-bold uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
              {item.role}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex items-center gap-[var(--space-md)] rounded-[var(--radius-lg)] border border-border-subtle bg-surface-elevated p-[var(--space-md)] shadow-[0_20px_48px_-38px_var(--shadow-color)] transition-all duration-300 hover:border-border-strong">
      <div className="relative flex h-[calc(var(--size-avatar-lg)+var(--space-xs))] w-[calc(var(--size-avatar-lg)+var(--space-xs))] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-2">
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
          <span className="text-[var(--type-size-sm)] font-medium uppercase tracking-[var(--type-tracking-normal)] text-muted-foreground">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Typography as="h3" className="line-clamp-1 text-[var(--type-size-base)] font-bold tracking-[var(--type-tracking-normal)] text-foreground">
          {item.name}
        </Typography>

        {item.role ? (
          <p className="text-[var(--type-size-xs)] font-bold uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
            {item.role}
          </p>
        ) : null}

        {item.secondary ? (
          <p className="mt-[var(--space-2xs)] line-clamp-1 text-[var(--type-size-xs)] text-muted-foreground">
            {item.secondaryLabel ? `${item.secondaryLabel}: ` : null}
            {item.secondary}
          </p>
        ) : null}
      </div>
    </article>
  );
}
