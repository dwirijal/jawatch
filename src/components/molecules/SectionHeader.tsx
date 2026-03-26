import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  leading?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  leading,
  action,
  className,
  contentClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3 border-b border-border-subtle pb-3.5 md:pb-4', className)}>
      <div className={cn('min-w-0', contentClassName)}>
        <div className="flex min-w-0 items-center gap-2.5">
          {leading}
          {Icon ? <Icon className="h-4 w-4 text-accent md:h-5 md:w-5" /> : null}
          <h2 className="type-section-title text-white">{title}</h2>
        </div>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
