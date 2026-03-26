import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[9px] font-black text-zinc-600',
        className
      )}
      {...props}
    />
  );
}
