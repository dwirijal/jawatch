'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';
import { cn } from '@/lib/utils';
import { DESKTOP_NAV_ITEMS } from '@/lib/navigation';
import { isChromelessPath } from '@/lib/route-chrome';
import { useUIStore } from '@/store/useUIStore';
import { DesktopNavGroup } from './DesktopNavGroup';
import { SearchHotkeyListener } from './SearchHotkeyListener';

const SearchModal = dynamic(() => import('./SearchModal').then((mod) => mod.SearchModal), {
  ssr: false,
});

export function Navbar() {
  const pathname = usePathname() || '/';
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const isNavbarHidden = useUIStore((state) => state.isNavbarHidden);
  const chromeless = isChromelessPath(pathname);
  const [isSolid, setIsSolid] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [searchModalMounted, setSearchModalMounted] = React.useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setIsSolid(currentScrollY > 20);

      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
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

  if (chromeless || isNavbarHidden) {
    return null;
  }

  return (
    <>
      <SearchHotkeyListener />
      {searchModalMounted ? <SearchModal /> : null}
      <nav
        data-scrolled={isSolid ? 'true' : 'false'}
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-[160] hidden transition-all duration-500 ease-in-out md:block',
          isSolid ? 'mt-3' : 'mt-0',
          !isVisible && '-translate-y-full opacity-0'
        )}
      >
        <div className="app-container-wide">
          <div
            className={cn(
              'pointer-events-auto surface-panel-elevated flex h-[4.5rem] items-center justify-between gap-6 px-4 lg:px-5',
              isSolid ? 'shadow-[0_28px_70px_-40px_var(--shadow-color-strong)]' : 'shadow-[0_18px_48px_-38px_var(--shadow-color)]'
            )}
          >
            <div className="flex min-w-0 items-center gap-6 xl:gap-10">
              <Link href="/" className="focus-tv group flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-[linear-gradient(135deg,var(--accent-soft)_0%,transparent_100%)] text-[var(--accent-strong)] shadow-[0_20px_40px_-30px_var(--shadow-color)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_24px_50px_-24px_var(--accent-soft)] group-active:scale-95">
                  <Sparkles className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.06em] text-foreground lg:text-[1.85rem]">
                    Ja<span className="text-[var(--accent-strong)]">watch</span>
                  </span>
                  <span className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground xl:block">
                    Nonton dan baca lebih rapi
                  </span>
                </span>
              </Link>

              <div className="flex items-center gap-1.5">
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
                        'focus-tv relative flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-300 hover:-translate-y-0.5 active:scale-95',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="relative z-10">{item.label}</span>
                      {isActive ? <span className="absolute inset-x-3 bottom-0 h-px bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle compact className="hidden lg:inline-flex" />
              <Button variant="secondary" size="sm" asChild className="hidden lg:inline-flex">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => useUIStore.getState().setSearchOpen(true)}
                className="group rounded-full border-border-subtle bg-surface-1 text-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:bg-surface-elevated hover:shadow-md active:scale-95"
                aria-label="Buka pencarian"
              >
                <Search className="h-5 w-5 transition-transform duration-300 group-hover:text-[var(--accent-strong)]" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
