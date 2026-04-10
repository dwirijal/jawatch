'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import { DESKTOP_NAV_ITEMS } from '@/lib/navigation';
import { DesktopNavGroup } from './DesktopNavGroup';
import { useUIStore } from '@/store/useUIStore';
import { SearchHotkeyListener } from './SearchHotkeyListener';
import { SearchLauncher } from './SearchLauncher';

const SearchModal = dynamic(
  () => import('./SearchModal').then((mod) => mod.SearchModal),
  { ssr: false }
);

const NavbarAuthControls = dynamic(
  () => import('./NavbarAuthControls').then((mod) => mod.NavbarAuthControls),
  {
    ssr: false,
    loading: () => <div className="h-10 w-32 animate-pulse rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1" />,
  }
);

export function Navbar() {
  const pathname = usePathname() || '/';
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const [isSolid, setIsSolid] = React.useState(false);
  const [searchModalMounted, setSearchModalMounted] = React.useState(false);
  const [authControlsMounted, setAuthControlsMounted] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setIsSolid(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (isSearchOpen) {
      setSearchModalMounted(true);
    }
  }, [isSearchOpen]);

  React.useEffect(() => {
    if (authControlsMounted) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    const requestIdle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback.bind(window)
        : null;
    const cancelIdle =
      typeof window !== 'undefined' && 'cancelIdleCallback' in window
        ? window.cancelIdleCallback.bind(window)
        : null;

    const mountAuthControls = () => {
      if (cancelled) {
        return;
      }

      if (requestIdle) {
        idleId = requestIdle(() => {
          if (!cancelled) {
            setAuthControlsMounted(true);
          }
        }, { timeout: 1500 });
        return;
      }

      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setAuthControlsMounted(true);
        }
      }, 900);
    };

    if (document.readyState === 'complete') {
      mountAuthControls();
    } else {
      window.addEventListener('load', mountAuthControls, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', mountAuthControls);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (idleId !== null && cancelIdle) {
        cancelIdle(idleId);
      }
    };
  }, [authControlsMounted]);

  return (
    <>
      <SearchHotkeyListener />
      {searchModalMounted ? <SearchModal /> : null}
      <nav
        data-scrolled={isSolid ? 'true' : 'false'}
        className={cn(
          'sticky top-0 z-[160] hidden w-full border-b transition-all duration-500 ease-in-out md:block',
          isSolid
            ? 'border-border-subtle bg-background/80 py-0 backdrop-blur-2xl'
            : 'border-transparent bg-transparent py-2'
        )}
      >
        <div className="app-container-wide flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
          <div className="flex min-w-0 items-center gap-6 xl:gap-10">
            <Link href="/" className="focus-tv group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-white/10 bg-surface-1 glass-noise refractive-border transition-transform group-hover:scale-105 active:scale-95">
                <span className="text-xl font-black italic text-white">D</span>
              </div>
              <span className="hidden text-xl font-black uppercase tracking-[-0.04em] text-white sm:block lg:text-2xl">
                dwizzy<span className="text-zinc-500">WEEB</span>
              </span>
            </Link>

            <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-white/5 bg-black/20 p-1 backdrop-blur-md">
              {DESKTOP_NAV_ITEMS.map((item) =>
                item.type === 'group' ? (
                  <DesktopNavGroup key={item.key} group={item.group} active={item.match(pathname)} pathname={pathname} />
                ) : (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'focus-tv relative flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all',
                      item.match(pathname)
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <item.icon className={cn('h-3.5 w-3.5', item.match(pathname) ? 'text-black' : 'text-zinc-500')} />
                    {item.label}
                  </Link>
                )
              )}
              {authControlsMounted ? (
                <NavbarAuthControls />
              ) : (
                <div className="h-10 w-32 animate-pulse rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden xl:block">
              <SearchLauncher />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => useUIStore.getState().setSearchOpen(true)}
              className="focus-tv rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 text-zinc-400 hover:bg-surface-elevated hover:text-white xl:hidden"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
