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
        'relative h-[calc(var(--size-switch-thumb)+var(--space-2xs))] w-[var(--size-switch-track)] rounded-full transition-all',
        checked ? 'bg-accent' : 'bg-surface-2',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'absolute left-[calc(var(--space-2xs)/2)] top-[calc(var(--space-2xs)/2)] h-[var(--size-switch-thumb)] w-[var(--size-switch-thumb)] rounded-full bg-[var(--accent-contrast)] transition-all',
          checked ? 'translate-x-[calc(var(--size-switch-track)-var(--size-switch-thumb)-var(--space-2xs))]' : 'translate-x-0'
        )}
      />
    </button>
  );
}
