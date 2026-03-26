import * as React from 'react';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  theme?: ThemeType;
  selected?: boolean;
}

export function Chip({ theme = 'default', selected = false, className, ...props }: ChipProps) {
  const config = THEME_CONFIG[theme];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-all',
        selected ? [config.bg, config.text, config.border] : 'border-zinc-800 bg-zinc-900 text-zinc-400',
        className
      )}
      {...props}
    />
  );
}
