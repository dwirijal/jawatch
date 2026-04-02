'use client';

import * as React from 'react';
import { useUIStore } from '@/store/useUIStore';

export function SearchHotkeyListener() {
  const { isSearchOpen, setSearchOpen } = useUIStore();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setSearchOpen(!isSearchOpen);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  return null;
}
