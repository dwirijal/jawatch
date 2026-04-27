'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
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
  actionLabel = 'Masuk',
  compact = false,
  className,
}: AuthGateNoticeProps) {
  return (
    <Paper
      tone="muted"
      shadow="sm"
      className={cn(
        'text-foreground',
        compact ? 'flex items-start gap-[var(--space-sm)] px-[var(--space-sm)] py-[var(--space-sm)]' : 'flex flex-col gap-[var(--space-md)] px-[var(--space-lg)] py-5 md:px-6 md:py-6',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-elevated text-muted-foreground',
          compact ? 'mt-0.5 h-[var(--size-control-sm)] w-9' : 'h-[var(--size-control-md)] w-[var(--size-control-md)]'
        )}
      >
        <Lock className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>

      <div className={cn('min-w-0', compact ? 'flex-1' : 'space-y-2')}>
        <p className={cn('font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground', compact ? 'text-[var(--type-size-xs)]' : 'text-sm')}>
          {title}
        </p>
        <p className={cn('text-muted-foreground', compact ? 'mt-1 text-xs leading-5' : 'text-sm leading-6')}>
          {description}
        </p>
      </div>

      <Button
        asChild
        size={compact ? 'sm' : 'default'}
        className={cn(
          'shrink-0 border-border-subtle bg-foreground text-background hover:brightness-95',
          compact ? 'self-center px-[var(--space-sm)]' : 'self-start'
        )}
      >
        <Link href={loginHref}>{actionLabel}</Link>
      </Button>
    </Paper>
  );
}
