'use client';

import * as React from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { Avatar } from '@/components/atoms/Avatar';
import { Link } from '@/components/atoms/Link';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';
import { buildLoginUrl, buildLogoutRequest } from '@/lib/auth-gateway';
import { cn } from '@/lib/utils';

function compactDisplayName(displayName: string) {
  const token = displayName.trim().split(/\s+/)[0] ?? displayName.trim();
  return token.length > 8 ? `${token.slice(0, 7)}…` : token;
}

export function AuthMobileEntry() {
  const session = useAuthSession();
  const redirectTarget = useRedirectTarget();

  if (session.loading) {
    return <div className="h-11 w-14 animate-pulse rounded-[var(--radius-sm)] bg-surface-1/80" />;
  }

  if (!session.authenticated || !session.user) {
    return (
      <Link
        href={buildLoginUrl(redirectTarget)}
        className="focus-tv flex min-w-[3.75rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-zinc-500 transition-colors hover:bg-surface-1 hover:text-white"
      >
        <UserRound className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">Masuk</span>
      </Link>
    );
  }

  const logoutRequest = buildLogoutRequest(redirectTarget);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';

  return (
    <form action={logoutRequest.url} method={logoutRequest.method}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        className={cn(
          'focus-tv flex min-w-[3.75rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors',
          'text-zinc-500 hover:bg-surface-1 hover:text-white'
        )}
        aria-label={`Keluar dari ${session.user.displayName}`}
      >
        <div className="relative">
          <Avatar name={session.user.displayName} size="sm" className="border-border-subtle bg-surface-2" />
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-zinc-950">
            <LogOut className="h-2.5 w-2.5" />
          </span>
        </div>
        <span className="max-w-16 truncate text-[10px] font-black uppercase tracking-widest">
          {compactDisplayName(session.user.displayName)}
        </span>
      </button>
    </form>
  );
}
