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
