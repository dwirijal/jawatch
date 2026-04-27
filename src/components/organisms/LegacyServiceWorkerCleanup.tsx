'use client';

import * as React from 'react';
import { reportClientWarning } from '@/lib/client-log';

const LEGACY_CACHE_MATCHERS = [
  'apis',
  'cross-origin',
  'google-fonts-stylesheets',
  'google-fonts-webfonts',
  'next-data',
  'next-image',
  'next-static-js-assets',
  'pages',
  'pages-rsc',
  'pages-rsc-prefetch',
  'start-url',
  'static-audio-assets',
  'static-data-assets',
  'static-font-assets',
  'static-image-assets',
  'static-js-assets',
  'static-style-assets',
  'static-video-assets',
] as const;

function isLegacyServiceWorkerScript(scriptUrl: string): boolean {
  try {
    const parsed = new URL(scriptUrl, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname === '/sw.js';
  } catch {
    return false;
  }
}

function isLegacyNextPwaCache(cacheName: string): boolean {
  return cacheName.startsWith('workbox-') || LEGACY_CACHE_MATCHERS.some((matcher) => cacheName === matcher);
}

export function LegacyServiceWorkerCleanup() {
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    void (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(async (registration) => {
              const scriptUrl =
                registration.active?.scriptURL ||
                registration.waiting?.scriptURL ||
                registration.installing?.scriptURL ||
                '';

              if (!isLegacyServiceWorkerScript(scriptUrl)) {
                return;
              }

              await registration.unregister();
            }),
          );
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter(isLegacyNextPwaCache)
              .map((cacheName) => caches.delete(cacheName)),
          );
        }
      } catch (error) {
        reportClientWarning(error, '[pwa-cleanup] failed to clear legacy service worker state');
      }
    })();
  }, []);

  return null;
}
