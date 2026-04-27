'use client';

import * as React from 'react';
import Image from 'next/image';
import { Grid3X3, type LucideIcon } from 'lucide-react';
import { renderLucideIcon } from '@/lib/lucide-icons';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

export interface MediaPageFeature {
  label?: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
  logo?: string;
  logoAlt?: string;
  useLogo?: boolean;
  badges?: string[];
  actions?: React.ReactNode;
}

interface MediaPageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
  theme: ThemeType;
  eyebrow?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  containerClassName?: string;
  layoutVariant?: 'default' | 'editorial';
  featuredItem?: MediaPageFeature;
  featuredPriority?: boolean;
}

export function MediaPageHeader({
  title,
  description,
  icon: Icon,
  iconName,
  theme,
  eyebrow,
  children,
  footer,
  containerClassName = 'app-container',
  layoutVariant = 'default',
  featuredItem,
  featuredPriority = false,
}: MediaPageHeaderProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;
  const titleClassName = cn(
    'max-w-4xl text-balance font-[var(--font-heading)] font-bold tracking-[-0.06em] text-foreground',
    layoutVariant === 'editorial'
      ? 'text-[clamp(2.8rem,6vw,4.85rem)] leading-[0.94]'
      : 'text-[clamp(2.35rem,5vw,4rem)] leading-[0.96]'
  );
  const iconWrapperClassName = cn(
    'mt-1 flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border-subtle shadow-[0_18px_44px_-30px_var(--shadow-color)]',
    layoutVariant === 'editorial' ? 'h-[var(--size-control-lg)] w-[var(--size-control-lg)] md:h-14 md:w-14' : 'h-[var(--size-control-md)] w-[var(--size-control-md)] md:h-12 md:w-12',
    config.primary
  );
  const iconClassName = cn(layoutVariant === 'editorial' ? 'h-6 w-6 md:h-7 md:w-7' : 'h-5 w-5 md:h-6 md:w-6', config.contrast);
  const featuredBadges = featuredItem?.badges?.map((badge) => badge.trim()).filter(Boolean) ?? [];
  const [imageFailed, setImageFailed] = React.useState(false);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const featuredImage = imageFailed || !featuredItem?.image?.trim() ? '' : featuredItem.image.trim();
  const featuredLogo = featuredItem?.useLogo === false || logoFailed || !featuredItem?.logo?.trim() ? '' : featuredItem.logo.trim();

  React.useEffect(() => {
    setImageFailed(false);
  }, [featuredItem?.image]);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [featuredItem?.logo]);

  if (layoutVariant === 'editorial' && featuredItem) {
    return (
      <header className="relative isolate overflow-hidden border-b border-border-subtle/70">
        {featuredImage ? (
          <Image
            src={featuredImage}
            alt={featuredItem.imageAlt || title}
            fill
            priority={featuredPriority}
            className="object-cover"
            sizes="100vw"
            quality={82}
            unoptimized
            onError={() => setImageFailed(true)}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,10,0.74)_0%,rgba(6,7,10,0.38)_44%,rgba(6,7,10,0.62)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.18)_0%,rgba(8,10,14,0.34)_24%,rgba(8,10,14,0.94)_100%)]" />

        <div className={cn(containerClassName, 'relative z-10 flex min-h-[11.5rem] items-end py-[var(--space-md)] sm:min-h-[12.5rem] sm:py-5 md:min-h-[18rem] md:py-6 lg:min-h-[21rem] lg:py-8 xl:min-h-[23rem]')}>
          <div className="w-full space-y-4 md:space-y-5">
            <div className="max-w-3xl space-y-3 md:space-y-4">
              <div className="flex flex-wrap items-center gap-[calc(var(--space-xs)+var(--space-2xs))]">
                {eyebrow ? (
                  <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-white/82">
                    {eyebrow}
                  </span>
                ) : null}

                {featuredItem.label ? (
                  <span className="rounded-full border border-white/14 bg-black/24 px-[var(--space-sm)] py-[var(--space-2xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-white/92 backdrop-blur-sm">
                    {featuredItem.label}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2.5 md:space-y-3">
                {featuredLogo ? (
                  <div className="space-y-2">
                    <h1 className="sr-only">{title}</h1>
                    <Image
                      src={featuredLogo}
                      alt={featuredItem?.logoAlt || title}
                      width={960}
                      height={384}
                      sizes="(max-width: 767px) 70vw, (max-width: 1279px) 34rem, 40rem"
                      className="h-auto max-h-[3.25rem] w-auto max-w-[min(64vw,22rem)] object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.38)] sm:max-h-[4rem] md:max-h-[4.5rem] md:max-w-[28rem] lg:max-h-[5rem] lg:max-w-[32rem]"
                      unoptimized
                      onError={() => setLogoFailed(true)}
                    />
                  </div>
                ) : (
                  <h1 className="line-clamp-2 max-w-3xl text-balance font-[var(--font-heading)] text-[clamp(1.85rem,7vw,4.5rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
                    {title}
                  </h1>
                )}
                <p className="max-w-2xl text-xs leading-5 text-white/84 sm:text-sm sm:leading-6 md:text-base md:leading-7">
                  {description}
                </p>
                {featuredItem.meta ? (
                  <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-white/70 md:text-xs">
                    {featuredItem.meta}
                  </p>
                ) : null}
              </div>

              {featuredBadges.length > 0 ? (
                <div className="flex flex-wrap gap-[var(--space-xs)]">
                  {featuredBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/12 bg-black/24 px-[var(--space-sm)] py-1.5 text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-white backdrop-blur-sm"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              {featuredItem.actions || children ? (
                <div className="w-fit max-w-full rounded-[var(--radius-xl)] border border-white/10 bg-black/26 p-2.5 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.72)] backdrop-blur-md sm:p-3">
                  <div className="flex flex-wrap items-center gap-[calc(var(--space-xs)+var(--space-2xs))] sm:gap-3">
                    {featuredItem.actions}
                    {children}
                  </div>
                </div>
              ) : null}
            </div>

            {footer ? (
              <div className="border-t border-white/10 pt-3 md:pt-4">
                <div className="flex min-h-[3rem] flex-col gap-[var(--space-sm)] md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4">
                  {footer}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  if (layoutVariant === 'editorial') {
    return (
      <header className="surface-panel-elevated relative overflow-hidden px-[var(--space-md)] py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
        <div className={cn('pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full opacity-[0.2] blur-3xl', config.primary)} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_72%)]" />
        <div className={cn(containerClassName, 'relative z-10 space-y-4 md:space-y-5')}>
          <div className={cn('grid gap-[var(--space-lg)] lg:gap-6', children ? 'xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] xl:items-end' : undefined)}>
            <div className="space-y-3.5 md:space-y-4">
              {eyebrow ? (
                <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">{eyebrow}</p>
              ) : null}

              <div className="max-w-3xl space-y-3 md:space-y-4">
                <div className="flex items-start gap-[var(--space-sm)] md:gap-4">
                  <div className={iconWrapperClassName}>
                    {Icon ? (
                      <Icon className={iconClassName} />
                    ) : iconName ? (
                      renderLucideIcon(iconName, iconClassName)
                    ) : (
                      <Grid3X3 className={iconClassName} />
                    )}
                  </div>

                  <div className="min-w-0 space-y-2.5">
                    <h1 className="max-w-3xl text-balance font-[var(--font-heading)] text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[0.96] tracking-[-0.055em] text-foreground">
                      {title}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {children ? (
              <div className="flex min-h-[3rem] flex-wrap items-center gap-[calc(var(--space-xs)+var(--space-2xs))] rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_92%,white_8%)_0%,var(--surface-1)_100%)] p-[var(--space-sm)] md:gap-3 md:p-4 xl:justify-end">
                <div className="flex flex-wrap items-center gap-[calc(var(--space-xs)+var(--space-2xs))] md:gap-3">
                  {children}
                </div>
              </div>
            ) : null}
          </div>

          {footer ? (
            <div className="flex min-h-[3.5rem] flex-col gap-[var(--space-sm)] border-t border-border-subtle pt-4 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4">
              {footer}
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="surface-panel-elevated relative overflow-hidden px-[var(--space-md)] py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
      <div className={cn('pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-[0.18] blur-3xl', config.primary)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_72%)]" />
      <div className={cn(containerClassName, 'relative z-10 space-y-5 md:space-y-6')}>
        <div className={cn('grid gap-[var(--space-lg)] lg:gap-6', children ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end' : undefined)}>
          <div className="space-y-4 md:space-y-5">
            {eyebrow ? (
              <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">{eyebrow}</p>
            ) : null}

            <div className="flex items-start gap-[var(--space-sm)] md:gap-4">
              <div className={iconWrapperClassName}>
                {Icon ? (
                  <Icon className={iconClassName} />
                ) : iconName ? (
                  renderLucideIcon(iconName, iconClassName)
                ) : (
                  <Grid3X3 className={iconClassName} />
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <h1 className={titleClassName}>{title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[1.02rem] md:leading-7">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {children ? (
            <div className="flex flex-wrap items-center gap-[calc(var(--space-xs)+var(--space-2xs))] rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_92%,white_8%)_0%,var(--surface-1)_100%)] p-[var(--space-sm)] md:gap-3 md:p-4 lg:justify-end">
              {children}
            </div>
          ) : null}
        </div>

        {footer ? (
          <div className="flex flex-col gap-[var(--space-sm)] border-t border-border-subtle pt-4 md:flex-row md:items-center md:justify-between md:gap-4">
            {footer}
          </div>
        ) : null}
      </div>
    </header>
  );
}
