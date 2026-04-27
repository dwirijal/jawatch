import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-[var(--size-control-sm)] rounded-[var(--radius-md)] border border-border-subtle bg-surface-1/70 px-[var(--space-sm)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground outline-none transition-all focus:border-[color:var(--accent-strong)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
