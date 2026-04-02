'use client';

import * as React from 'react';
import { Typography } from '@/components/atoms/Typography';
import { cn, ThemeType } from '@/lib/utils';

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

interface TitleBlockProps {
  title: string;
  subtitle?: string;
  theme: ThemeType;
  eyebrow?: string;
  className?: string;
}

export function TitleBlock({
  title,
  subtitle,
  theme,
  eyebrow,
  className,
}: TitleBlockProps) {
  const eyebrowRef = React.useRef<HTMLParagraphElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const subtitleRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    const targets = [eyebrowRef.current, titleRef.current, subtitleRef.current].filter(isDefined);
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
  }, [title, subtitle, eyebrow]);

  return (
    <div className={cn('space-y-3', className)}>
      {eyebrow ? (
        <p ref={eyebrowRef} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          {eyebrow}
        </p>
      ) : null}
      <Typography ref={titleRef} as="h1" size="5xl" variant={theme} className="text-white leading-none">
        {title}
      </Typography>
      {subtitle ? (
        <p ref={subtitleRef} className="max-w-2xl text-sm font-medium leading-relaxed text-zinc-400 md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
