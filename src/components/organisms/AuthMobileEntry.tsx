'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, UserRound } from 'lucide-react';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { buildLoginUrl, buildLogoutRequest } from '@/lib/auth-gateway';
import { cn } from '@/lib/utils';

function compactDisplayName(displayName: string) {
  const token = displayName.trim().split(/\s+/)[0] ?? displayName.trim();
  return token.length > 8 ? `${token.slice(0, 7)}…` : token;
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

function MobileAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || 'D';
  const backgroundImage = getAvatarBackgroundImage(avatarUrl);

  return (
    <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 text-[10px] font-black uppercase text-white">
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

export function AuthMobileEntry() {
  const pathname = usePathname() || '/';
  const session = useAuthSession();

  if (session.loading) {
    return <div className="h-11 w-14 animate-pulse rounded-2xl bg-zinc-900/70" />;
  }

  if (!session.authenticated || !session.user) {
    return (
      <Link
        href={buildLoginUrl(pathname)}
        className="flex flex-col items-center justify-center gap-1 text-zinc-500 transition-all hover:text-white"
      >
        <UserRound className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">Login</span>
      </Link>
    );
  }

  const logoutRequest = buildLogoutRequest(pathname);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';

  return (
    <form action={logoutRequest.url} method={logoutRequest.method}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        className={cn(
          'flex flex-col items-center justify-center gap-1 transition-all',
          'text-zinc-500 hover:text-white'
        )}
        aria-label={`Log out ${session.user.displayName}`}
      >
        <div className="relative">
          <MobileAvatar displayName={session.user.displayName} avatarUrl={session.user.avatarUrl} />
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
