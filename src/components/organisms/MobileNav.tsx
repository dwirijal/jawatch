'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { MOBILE_NAV_ITEMS } from '@/lib/navigation';

const MobileMenuPanel = dynamic(
  () => import('./MobileMenuPanel').then((mod) => mod.MobileMenuPanel),
  {
    ssr: false,
    loading: () => null,
  }
);

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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle/30 bg-background/90 pb-safe backdrop-blur-2xl md:hidden">
        <div className="app-container flex h-16 items-center justify-around gap-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            if ('action' in item && item.action === 'search') {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="focus-tv flex min-w-[3.75rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-muted-foreground transition-colors hover:text-accent"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              );
            }

            if ('action' in item && item.action === 'menu') {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="focus-tv flex min-w-[3.75rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-muted-foreground transition-colors hover:text-accent"
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
                  'focus-tv flex min-w-[3.75rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors',
                  isActive ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'fill-current')} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {menuPanelMounted ? <MobileMenuPanel /> : null}
    </>
  );
}
