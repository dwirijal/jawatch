'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import { SearchModal } from './SearchModal';
import { useUIStore } from '@/store/useUIStore';
import { AuthNavEntry } from './AuthNavEntry';
import { DESKTOP_NAV_ITEMS } from '@/lib/navigation';
import { DesktopNavGroup } from './DesktopNavGroup';

export function Navbar() {
  const pathname = usePathname() || '/';
  const { device } = useUIStore();
  const [isSolid, setIsSolid] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setIsSolid(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (device === 'mobile') return null;

  return (
    <nav
      data-scrolled={isSolid ? 'true' : 'false'}
      className={cn(
        'sticky top-0 z-[100] w-full border-b transition-colors duration-200',
        isSolid ? 'border-border-subtle bg-surface-1/95 backdrop-blur-xl' : 'border-transparent bg-transparent'
      )}
    >
      <div className="app-container-wide flex h-16 items-center justify-between gap-6 lg:h-[4.25rem]">
        <div className="flex min-w-0 items-center gap-6 xl:gap-8">
          <Link href="/" className="focus-tv group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 transition-colors group-hover:bg-surface-elevated">
              <span className="text-lg font-black text-white">D</span>
            </div>
            <span className="text-lg font-black tracking-tight uppercase text-white">dwizzyWEEB</span>
          </Link>

          <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/80 p-1">
            {DESKTOP_NAV_ITEMS.map((item) =>
              item.type === 'group' ? (
                <DesktopNavGroup key={item.key} group={item.group} active={item.match(pathname)} pathname={pathname} />
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'focus-tv flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold tracking-[0.02em] transition-all',
                    item.match(pathname)
                      ? 'border border-border-subtle bg-surface-elevated text-white hard-shadow-sm'
                      : 'text-zinc-500 hover:bg-surface-2 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:block">
            <SearchModal />
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
          <AuthNavEntry />
        </div>
      </div>
    </nav>
  );
}
