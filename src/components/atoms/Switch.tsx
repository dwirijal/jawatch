'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
}

export function Switch({ checked, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative h-4 w-8 rounded-full transition-all',
        checked ? 'bg-orange-600' : 'bg-zinc-800',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
          checked ? 'left-4.5' : 'left-0.5'
        )}
      />
    </button>
  );
}
