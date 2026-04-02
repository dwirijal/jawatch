'use client';

import { LoaderCircle } from 'lucide-react';
import { useLinkStatus } from 'next/link';
import { cn } from '@/lib/utils';

interface PendingLinkHintProps {
  label?: string;
  variant?: 'inline' | 'badge';
  className?: string;
}

export function PendingLinkHint({
  label = 'Halaman sedang dimuat.',
  variant = 'inline',
  className,
}: PendingLinkHintProps) {
  const { pending } = useLinkStatus();

  if (variant === 'badge') {
    return (
      <>
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-background/80 text-zinc-100 opacity-0 transition-opacity duration-150 [transition-delay:120ms]',
            pending && 'opacity-100',
            className
          )}
        >
          <LoaderCircle className={cn('h-3 w-3', pending && 'animate-spin')} />
        </span>
        {pending ? (
          <span role="status" aria-live="polite" className="sr-only">
            {label}
          </span>
        ) : null}
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden
        className={cn(
          'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-current opacity-0 transition-opacity duration-150 [transition-delay:120ms]',
          pending && 'opacity-70',
          className
        )}
      >
        <LoaderCircle className={cn('h-3.5 w-3.5', pending && 'animate-spin')} />
      </span>
      {pending ? (
        <span role="status" aria-live="polite" className="sr-only">
          {label}
        </span>
      ) : null}
    </>
  );
}
