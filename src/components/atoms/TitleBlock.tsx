'use client';

import * as React from 'react';
import { animate } from 'animejs';
import { Typography } from '@/components/atoms/Typography';
import { cn, ThemeType } from '@/lib/utils';

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
    const targets = [eyebrowRef.current, titleRef.current, subtitleRef.current].filter(Boolean);
    if (targets.length === 0) return;

    animate(targets, {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: (_, index) => index * 100,
      duration: 900,
      easing: 'outExpo',
    });
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
