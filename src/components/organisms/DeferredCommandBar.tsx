'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useUIStore } from '@/store/useUIStore';

const CommandBar = dynamic(() => import('./CommandBar').then((mod) => mod.CommandBar), {
  ssr: false,
});

export function DeferredCommandBar() {
  const setCommandBarOpen = useUIStore((state) => state.setCommandBarOpen);
  const isCommandBarOpen = useUIStore((state) => state.isCommandBarOpen);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const mount = () => {
      if (cancelled) {
        return;
      }

      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => {
          if (!cancelled) {
            setMounted(true);
          }
        }, { timeout: 2000 });
        return;
      }

      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setMounted(true);
        }
      }, 1200);
    };

    if (document.readyState === 'complete') {
      mount();
    } else {
      window.addEventListener('load', mount, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', mount);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setMounted(true);
        setCommandBarOpen(!isCommandBarOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, setCommandBarOpen]);

  return mounted ? <CommandBar /> : null;
}
