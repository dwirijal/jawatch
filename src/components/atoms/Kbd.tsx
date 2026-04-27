import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'rounded border border-border-subtle bg-surface-2 px-[calc(var(--space-2xs)*1.5)] py-[calc(var(--space-2xs)*0.5)] text-[var(--type-size-xs)] font-black text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
