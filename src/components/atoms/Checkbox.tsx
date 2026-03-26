'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
}

export function Checkbox({ checked, className, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-white transition-all',
        checked ? 'border-zinc-700 bg-zinc-100 text-zinc-950' : 'hover:border-zinc-700',
        className
      )}
      {...props}
    >
      {checked ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  );
}
