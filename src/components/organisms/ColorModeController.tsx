'use client';

import * as React from 'react';
import { useColorModeStore } from '@/store/useColorModeStore';

export function ColorModeController() {
  const syncFromDocument = useColorModeStore((state) => state.syncFromDocument);

  React.useEffect(() => {
    syncFromDocument();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    const onDocumentChange = () => {
      syncFromDocument();
    };

    const onMediaChange = () => {
      if ((document.documentElement.dataset.colorPreference || 'system') === 'system') {
        syncFromDocument();
      }
    };

    window.addEventListener('jawatch:color-mode-change', onDocumentChange as EventListener);
    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', onMediaChange);
    } else {
      legacyMediaQuery.addListener?.(onMediaChange);
    }

    return () => {
      window.removeEventListener('jawatch:color-mode-change', onDocumentChange as EventListener);
      if ('removeEventListener' in mediaQuery) {
        mediaQuery.removeEventListener('change', onMediaChange);
      } else {
        legacyMediaQuery.removeListener?.(onMediaChange);
      }
    };
  }, [syncFromDocument]);

  return null;
}
