'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import { DESKTOP_NAV_ITEMS } from '@/lib/navigation';
import { useUIStore } from '@/store/useUIStore';
import { DesktopNavGroup } from './DesktopNavGroup';
import { SearchHotkeyListener } from './SearchHotkeyListener';
import { SearchModal } from './SearchModal';
import { NavbarAuthControls } from './NavbarAuthControls';

export function Navbar() {
  const pathname = usePathname() || '/';
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const isNavbarHidden = useUIStore((state) => state.isNavbarHidden);
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

  if (isNavbarHidden) {
    return null;
  }

  return (
    <>
      <SearchHotkeyListener />
      {searchModalMounted ? <SearchModal /> : null}
      <nav
        data-scrolled={isSolid ? 'true' : 'false'}
        className={cn(
          'sticky top-0 z-[160] hidden w-full border-b transition-all duration-700 ease-in-out md:block',
          isSolid
            ? 'border-zinc-200 bg-white/80 py-0 backdrop-blur-xl'
            : 'border-transparent bg-transparent py-4'
        )}
      >
        <div className="app-container-wide flex h-20 items-center justify-between gap-10">
          <div className="flex min-w-0 items-center gap-12">
            <Link href="/" className="focus-tv group flex items-center gap-4">
              <span className="flex flex-col leading-none">
                <span className="font-[var(--font-heading)] text-3xl tracking-tight text-zinc-900 lg:text-4xl">
                  Ja<span className="italic text-zinc-400">watch</span>
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {DESKTOP_NAV_ITEMS.map((item) => {
                if (item.type === 'group') {
                  return (
                    <DesktopNavGroup
                      key={item.key}
                      active={item.match(pathname)}
                      group={item.group}
                      pathname={pathname}
                    />
                  );
                }

                const isActive = item.match(pathname);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'focus-tv relative flex items-center gap-2 rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-500',
                      isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 rounded-full bg-zinc-100 shadow-sm"
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.8 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block">
              {authControlsMounted ? (
                <NavbarAuthControls />
              ) : (
                <div className="h-10 w-24 animate-pulse rounded-full bg-zinc-100" />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => useUIStore.getState().setSearchOpen(true)}
              className="focus-tv rounded-full text-zinc-900 hover:bg-zinc-100"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
