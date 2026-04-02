'use client';

import { BadgeAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Link } from '@/components/atoms/Link';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { cn } from '@/lib/utils';
import { AuthNavEntry } from './AuthNavEntry';

export function NavbarAuthControls() {
  const pathname = usePathname() || '/';
  const session = useAuthSession();

  return (
    <>
      {session.authenticated && session.user ? (
        <Link
          href="/nsfw"
          className={cn(
            'focus-tv relative flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all',
            pathname === '/nsfw'
              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          )}
        >
          <BadgeAlert className={cn('h-3.5 w-3.5', pathname === '/nsfw' ? 'text-black' : 'text-zinc-500')} />
          NSFW
        </Link>
      ) : null}
      <AuthNavEntry />
    </>
  );
}
