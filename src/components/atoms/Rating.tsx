'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function Rating({ value, max = 5, onChange, className }: RatingProps) {
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, index) => {
        const score = index + 1;
        const active = score <= value;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange?.(score)}
            disabled={!onChange}
            aria-label={`Rate ${score} of ${max}`}
          >
            <Star className={cn('h-4 w-4', active ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700')} />
          </button>
        );
      })}
    </div>
  );
}
