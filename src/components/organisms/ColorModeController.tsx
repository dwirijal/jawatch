'use client';

import * as React from 'react';
import { subscribeToMediaQuery } from '@/lib/media-query';
import { useColorModeStore } from '@/store/useColorModeStore';

export function ColorModeController() {
  const syncFromDocument = useColorModeStore((state) => state.syncFromDocument);

  React.useEffect(() => {
    syncFromDocument();

    const onDocumentChange = () => {
      syncFromDocument();
    };

    const unsubscribeMediaQuery = subscribeToMediaQuery('(prefers-color-scheme: dark)', () => {
      if ((document.documentElement.dataset.colorPreference || 'system') === 'system') {
        syncFromDocument();
      }
    });

    window.addEventListener('jawatch:color-mode-change', onDocumentChange as EventListener);

    return () => {
      window.removeEventListener('jawatch:color-mode-change', onDocumentChange as EventListener);
      unsubscribeMediaQuery();
    };
  }, [syncFromDocument]);

  return null;
}
