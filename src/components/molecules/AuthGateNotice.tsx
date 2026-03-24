'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

interface AuthGateNoticeProps {
  loginHref: string;
  title: string;
  description: string;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
}

export function AuthGateNotice({
  loginHref,
  title,
  description,
  actionLabel = 'Login',
  compact = false,
  className,
}: AuthGateNoticeProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800 bg-zinc-950/90 text-zinc-100 shadow-xl shadow-black/20',
        compact ? 'flex items-start gap-3 px-3 py-3' : 'flex flex-col gap-4 px-5 py-5 md:px-6 md:py-6',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300',
          compact ? 'mt-0.5 h-9 w-9' : 'h-11 w-11'
        )}
      >
        <Lock className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>

      <div className={cn('min-w-0', compact ? 'flex-1' : 'space-y-2')}>
        <p className={cn('font-black uppercase tracking-[0.18em] text-white', compact ? 'text-[11px]' : 'text-sm')}>
          {title}
        </p>
        <p className={cn('text-zinc-400', compact ? 'mt-1 text-xs leading-5' : 'text-sm leading-6')}>
          {description}
        </p>
      </div>

      <Button
        asChild
        size={compact ? 'sm' : 'default'}
        className={cn(
          'shrink-0 border border-zinc-700 bg-zinc-100 text-zinc-950 hover:bg-white',
          compact ? 'self-center px-3' : 'self-start'
        )}
      >
        <Link href={loginHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
