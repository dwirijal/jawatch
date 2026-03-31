'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { buildLoginUrl, buildLogoutRequest } from '@/lib/auth-gateway';

function compactDisplayName(displayName: string) {
  const token = displayName.trim().split(/\s+/)[0] ?? displayName.trim();
  return token.length > 12 ? `${token.slice(0, 11)}…` : token;
}

export function AuthNavEntry() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const session = useAuthSession();
  const redirectTarget = React.useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  if (session.loading) {
    return <div className="h-10 w-32 animate-pulse rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1" />;
  }

  if (!session.authenticated || !session.user) {
    return (
      <Link
        href={buildLoginUrl(redirectTarget)}
        className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2.5 text-sm font-black uppercase tracking-[0.24em] text-zinc-100 transition-colors hover:bg-surface-elevated hover:text-white"
      >
        Login
      </Link>
    );
  }

  const logoutRequest = buildLogoutRequest(redirectTarget);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';
  const origin = logoutRequest.body.get('origin') ?? '';

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-2 py-2">
      <Avatar name={session.user.displayName} className="border-border-subtle bg-surface-2" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-white">
          {compactDisplayName(session.user.displayName)}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Signed in</p>
      </div>
      <form action={logoutRequest.url} method={logoutRequest.method}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="origin" value={origin} />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          className="rounded-[var(--radius-sm)] border-border-subtle bg-surface-2 text-zinc-400 hover:bg-surface-elevated hover:text-white"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
