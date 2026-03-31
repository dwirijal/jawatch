import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderLucideIcon } from '@/lib/lucide-icons';

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
  icon: Icon,
  iconName,
  leading,
  action,
  className,
  contentClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border-subtle pb-3 md:flex-row md:items-end md:justify-between md:gap-4 md:pb-4',
        className
      )}
    >
      <div className={cn('min-w-0 flex-1 space-y-1.5', contentClassName)}>
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          {Icon ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-subtle bg-surface-1 text-accent md:h-9 md:w-9">
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          ) : iconName ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-subtle bg-surface-1 text-accent md:h-9 md:w-9">
              {renderLucideIcon(iconName, 'h-4 w-4 md:h-5 md:w-5')}
            </div>
          ) : null}
          <h2 className="min-w-0 text-balance text-xl font-black tracking-[-0.03em] text-white md:text-2xl">
            {title}
          </h2>
        </div>

        {subtitle ? (
          <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0 self-start md:self-end">{action}</div> : null}
    </div>
  );
}
