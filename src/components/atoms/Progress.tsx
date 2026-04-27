import * as React from 'react';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  theme?: ThemeType;
  indicatorClassName?: string;
}

export function Progress({
  value,
  max = 100,
  theme = 'default',
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const config = THEME_CONFIG[theme];
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('h-1.5 w-full overflow-hidden bg-surface-2', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-1000', config.primary, config.shadow, indicatorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
