import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-9 rounded-[var(--radius-md)] border border-border-subtle bg-surface-1/70 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-foreground outline-none transition-all focus:border-[color:var(--accent-strong)]',
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
