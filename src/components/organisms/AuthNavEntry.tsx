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
    return <div className="h-10 w-32 animate-pulse rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1" />;
  }

  if (!session.authenticated || !session.user) {
    return (
      <Link
        href={buildLoginUrl(redirectTarget)}
        className="focus-tv rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-surface-elevated"
      >
        Masuk
      </Link>
    );
  }

  const logoutRequest = buildLogoutRequest(redirectTarget);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-2 py-2">
      <Avatar name={session.user.displayName} className="border-border-subtle bg-surface-2" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase tracking-[0.16em] text-foreground">
          {compactDisplayName(session.user.displayName)}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Sudah masuk</p>
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
