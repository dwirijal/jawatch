'use client';

import * as React from 'react';
import Image from 'next/image';
import { Typography } from '@/components/atoms/Typography';
import { cn, ThemeType } from '@/lib/utils';

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

interface MediaTitleProps {
  title: string;
  subtitle?: string;
  theme: ThemeType;
  eyebrow?: string;
  logoSrc?: string;
  logoAlt?: string;
  className?: string;
}

export function MediaTitle({
  title,
  subtitle,
  theme,
  eyebrow,
  logoSrc,
  logoAlt,
  className,
}: MediaTitleProps) {
  const eyebrowRef = React.useRef<HTMLParagraphElement>(null);
  const titleRef = React.useRef<HTMLElement>(null);
  const logoBlockRef = React.useRef<HTMLDivElement>(null);
  const subtitleRef = React.useRef<HTMLParagraphElement>(null);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const displayLogo = logoSrc?.trim() && !logoFailed ? logoSrc.trim() : '';

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoSrc]);

  React.useEffect(() => {
    const titleTarget = displayLogo ? logoBlockRef.current : titleRef.current;
    const targets = [eyebrowRef.current, titleTarget, subtitleRef.current].filter(isDefined);
    if (targets.length === 0) return;

    const animations = targets.map((target, index) =>
      target.animate(
        [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          delay: index * 100,
          duration: 900,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        }
      )
    );

    return () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };
  }, [displayLogo, eyebrow, subtitle, title]);

  return (
    <div className={cn('space-y-3', className)}>
      {eyebrow ? (
        <p ref={eyebrowRef} className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      {displayLogo ? (
        <div ref={logoBlockRef} className="space-y-2">
          <Typography as="h1" size="5xl" variant={theme} className="sr-only text-[var(--accent-contrast)] leading-none">
            {title}
          </Typography>
          <Image
            src={displayLogo}
            alt={logoAlt || title}
            width={1200}
            height={480}
            sizes="(max-width: 767px) 72vw, (max-width: 1279px) 34rem, 40rem"
            className="h-auto max-h-[5rem] w-auto max-w-[min(74vw,30rem)] object-contain drop-shadow-[0_22px_36px_rgba(0,0,0,0.34)] md:max-h-[6rem] md:max-w-[36rem] lg:max-h-[7rem] lg:max-w-[42rem]"
            unoptimized
            onError={() => setLogoFailed(true)}
          />
        </div>
      ) : (
        <Typography ref={titleRef} as="h1" size="5xl" variant={theme} className="text-[var(--accent-contrast)] leading-none">
          {title}
        </Typography>
      )}
      {subtitle ? (
        <p ref={subtitleRef} className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
