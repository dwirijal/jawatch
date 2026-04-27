'use client';

import * as React from 'react';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';
import { buildLoginUrl, buildLogoutRequest } from '@/lib/auth-gateway';

function compactDisplayName(displayName: string) {
  const token = displayName.trim().split(/\s+/)[0] ?? displayName.trim();
  return token.length > 12 ? `${token.slice(0, 11)}…` : token;
}

export function AuthNavEntry() {
  const session = useAuthSession();
  const redirectTarget = useRedirectTarget();

  if (session.loading) {
    return <div className="h-[calc(var(--size-control-md)-var(--space-2xs))] w-32 animate-pulse rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1" />;
  }

  if (!session.authenticated || !session.user) {
    return (
      <Link
        href={buildLoginUrl(redirectTarget)}
        className="focus-tv rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-[var(--space-md)] py-[calc(var(--space-xs)+var(--space-2xs))] text-sm font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground transition-colors hover:bg-surface-elevated"
      >
        Masuk
      </Link>
    );
  }

  const logoutRequest = buildLogoutRequest(redirectTarget);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';

  return (
    <div className="flex items-center gap-[var(--space-sm)] rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-[var(--space-xs)] py-[var(--space-xs)]">
      <Avatar name={session.user.displayName} className="border-border-subtle bg-surface-2" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground">
          {compactDisplayName(session.user.displayName)}
        </p>
        <p className="text-[var(--type-size-xs)] font-bold uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Sudah masuk</p>
      </div>
      <form action={logoutRequest.url} method={logoutRequest.method}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          className="rounded-[var(--radius-sm)] border-border-subtle bg-surface-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          aria-label="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
