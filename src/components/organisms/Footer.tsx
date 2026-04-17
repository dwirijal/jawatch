'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isChromelessPath } from '@/lib/route-chrome';
import { useUIStore } from '@/store/useUIStore';

interface FooterProps {
  children: ReactNode;
}

export function Footer({ children }: FooterProps) {
  const pathname = usePathname();
  const isFooterHidden = useUIStore((state) => state.isFooterHidden);

  if (isChromelessPath(pathname) || isFooterHidden) {
    return null;
  }

  return <>{children}</>;
}
