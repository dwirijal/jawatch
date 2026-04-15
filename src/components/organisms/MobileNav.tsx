'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { MOBILE_NAV_ITEMS } from '@/lib/navigation';
import { MobileMenuPanel } from './MobileMenuPanel';

export function MobileNav() {
  const pathname = usePathname() || '/';
  const { isSidebarOpen, setSearchOpen, setSidebarOpen } = useUIStore();
  const [menuPanelMounted, setMenuPanelMounted] = React.useState(false);

  React.useEffect(() => {
    if (isSidebarOpen) {
      setMenuPanelMounted(true);
    }
  }, [isSidebarOpen]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border-subtle bg-background/95 pb-safe backdrop-blur-xl md:hidden">
        <div className="app-container flex h-16 items-center gap-2">
          <div className="grid flex-1 grid-cols-4 items-stretch gap-1">
            {MOBILE_NAV_ITEMS.map((item) => {
            if ('action' in item && item.action === 'search') {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="focus-tv flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-zinc-500 transition-colors hover:bg-surface-1 hover:text-white"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              );
            }

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.key}
                href={item.href!}
                className={cn(
                  'focus-tv flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors',
                  isActive ? 'bg-surface-1 text-white' : 'text-zinc-500 hover:bg-surface-1 hover:text-white'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'fill-current')} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            );
            })}
          </div>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="focus-tv flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle text-zinc-500 transition-colors hover:bg-surface-1 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {menuPanelMounted ? <MobileMenuPanel /> : null}
    </>
  );
}
