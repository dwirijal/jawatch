'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { buildLoginUrl, buildLogoutRequest } from '@/lib/auth-gateway';
import { cn } from '@/lib/utils';

function compactDisplayName(displayName: string) {
  const token = displayName.trim().split(/\s+/)[0] ?? displayName.trim();
  return token.length > 12 ? `${token.slice(0, 11)}…` : token;
}

function getAvatarBackgroundImage(avatarUrl?: string) {
  const candidate = avatarUrl?.trim();
  if (!candidate) {
    return undefined;
  }

  if (candidate.startsWith('/')) {
    return `url("${candidate}")`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return `url("${url.toString()}")`;
    }
  } catch {}

  return undefined;
}

function Avatar({
  displayName,
  avatarUrl,
  className,
}: {
  displayName: string;
  avatarUrl?: string;
  className?: string;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || 'D';
  const backgroundImage = getAvatarBackgroundImage(avatarUrl);

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 text-sm font-black uppercase text-white',
        className
      )}
    >
      {backgroundImage ? (
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage }}
        />
      ) : null}
      <span className="relative z-10">{initial}</span>
    </span>
  );
}

export function AuthNavEntry() {
  const pathname = usePathname() || '/';
  const session = useAuthSession();

  if (session.loading) {
    return <div className="h-10 w-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />;
  }

  if (!session.authenticated || !session.user) {
    return (
      <Link
        href={buildLoginUrl(pathname)}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-black uppercase tracking-[0.24em] text-zinc-100 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
      >
        Login
      </Link>
    );
  }

  const logoutRequest = buildLogoutRequest(pathname);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-2 py-2">
      <Avatar displayName={session.user.displayName} avatarUrl={session.user.avatarUrl} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-white">
          {compactDisplayName(session.user.displayName)}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Signed in</p>
      </div>
      <form action={logoutRequest.url} method={logoutRequest.method}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
