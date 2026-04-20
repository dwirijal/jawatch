'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, Sparkles } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { MOBILE_NAV_ITEMS } from '@/lib/navigation';

const MobileMenuPanel = dynamic(() => import('./MobileMenuPanel').then((mod) => mod.MobileMenuPanel), {
  ssr: false,
});

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
      <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe md:hidden">
        <div className="app-container pb-2">
          <div className="surface-panel-elevated flex h-16 items-center gap-2 px-2">
          <Link
            href="/"
            className="focus-tv flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-[linear-gradient(135deg,var(--accent-soft)_0%,transparent_100%)] text-[var(--accent-strong)] transition-colors hover:bg-surface-elevated"
            aria-label="Beranda"
          >
            <Sparkles className="h-5 w-5" />
          </Link>
          <div className="grid flex-1 grid-cols-4 items-stretch gap-1">
            {MOBILE_NAV_ITEMS.map((item) => {
            if ('action' in item && item.action === 'search') {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="focus-tv flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
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
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-surface-1 hover:text-foreground'
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
            aria-label="Buka menu"
            onClick={() => setSidebarOpen(true)}
            className="focus-tv flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        </div>
      </div>
      {menuPanelMounted ? <MobileMenuPanel /> : null}
    </>
  );
}
