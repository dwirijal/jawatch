import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconName?: string;
  leading?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionHeader({
  title,
  subtitle,
  leading,
  action,
  className,
  contentClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6',
        className
      )}
    >
      <div className={cn('min-w-0 flex-1 space-y-2', contentClassName)}>
        <div className="flex flex-col gap-1.5">
          {subtitle && (
            <span className="type-kicker">
              {subtitle}
            </span>
          )}
          <div className="flex min-w-0 items-center gap-4">
            {leading}
            <h2 className="type-section-title min-w-0 text-balance text-foreground">
              {title}
            </h2>
          </div>
        </div>
      </div>

      {action ? <div className="shrink-0 self-start md:self-end">{action}</div> : null}
    </div>
  );
}
