import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type PaperTone = 'solid' | 'muted' | 'outline';
type PaperShadow = 'none' | 'sm' | 'md';

interface PaperProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  asChild?: boolean;
  tone?: PaperTone;
  shadow?: PaperShadow;
  padded?: boolean;
  interactive?: boolean;
  glassy?: boolean;
}

const TONE_CLASS: Record<PaperTone, string> = {
  solid: 'bg-surface-2 border-border-subtle',
  muted: 'bg-surface-1 border-border-subtle',
  outline: 'bg-transparent border-border-subtle',
};

const SHADOW_CLASS: Record<PaperShadow, string> = {
  none: '',
  sm: 'hard-shadow-sm',
  md: 'hard-shadow-md',
};

export function Paper({
  as = 'article',
  asChild = false,
  tone = 'solid',
  shadow = 'none',
  padded = true,
  interactive = false,
  glassy = false,
  className,
  ...props
}: PaperProps) {
  const Comp = asChild ? Slot : as;

  return (
    <Comp
      className={cn(
        'rounded-[var(--radius-sm)] border text-foreground relative',
        TONE_CLASS[tone],
        SHADOW_CLASS[shadow],
        glassy && 'refractive-border glass-noise border-none',
        padded && 'p-4 md:p-5',
        interactive && 'transition-all duration-300 hover:-translate-y-1 hover:border-white/20',
        className
      )}
      {...props}
    />
  );
}
