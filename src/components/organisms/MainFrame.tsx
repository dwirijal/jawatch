'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isChromelessPath } from '@/lib/route-chrome';
import { useUIStore } from '@/store/useUIStore';

interface MainFrameProps {
  children: ReactNode;
}

export function MainFrame({ children }: MainFrameProps) {
  const pathname = usePathname();
  const isNavbarHidden = useUIStore((state) => state.isNavbarHidden);
  const isFooterHidden = useUIStore((state) => state.isFooterHidden);
  const chromeless = isChromelessPath(pathname);

  return (
    <main
      className={cn(
        'min-h-screen flex-1',
        chromeless || isNavbarHidden ? 'pt-0' : 'pt-3 md:pt-24',
        chromeless || isFooterHidden ? 'pb-0' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'
      )}
    >
      {children}
    </main>
  );
}
