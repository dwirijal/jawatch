'use client';

import * as React from 'react';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8868090753979495';
const ADSENSE_SLOT_IDS = [
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_HORIZONTAL || '',
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_VERTICAL || '',
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE || '',
];
const HAS_ADSENSE_INVENTORY = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT_IDS.some(Boolean));

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    __dwizzyAutoAdsStarted?: boolean;
  }
}

function appendScript({
  id,
  src,
  onLoad,
}: {
  id: string;
  src: string;
  onLoad: () => void;
}) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    onLoad();
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.type = 'application/javascript';
  script.crossOrigin = 'anonymous';
  script.onload = onLoad;
  document.head.appendChild(script);
}

function scheduleDeferredWork(task: () => void) {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleId: number | null = null;

  const run = () => {
    if (cancelled) {
      return;
    }

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        if (!cancelled) {
          task();
        }
      }, { timeout: 1500 });
      return;
    }

    timeoutId = globalThis.setTimeout(() => {
      if (!cancelled) {
        task();
      }
    }, 300);
  };

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', run);
    if (timeoutId != null) {
      globalThis.clearTimeout(timeoutId);
    }
    if (idleId != null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    }
  };
}

export function AdNetworkScripts() {
  React.useEffect(() => {
    if (!HAS_ADSENSE_INVENTORY) {
      return;
    }

    return scheduleDeferredWork(() => {
      appendScript({
        id: 'dwizzy-adsense-script',
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
        onLoad: () => {
          if (!window.__dwizzyAutoAdsStarted) {
            window.adsbygoogle = window.adsbygoogle || [];
            try {
              window.adsbygoogle.push({
                google_ad_client: ADSENSE_CLIENT,
                enable_page_level_ads: true,
              });
              window.__dwizzyAutoAdsStarted = true;
            } catch {
              // Ignore provider boot failures and keep the app functional.
            }
          }
          window.dispatchEvent(new Event('dwizzy:adsense-ready'));
        },
      });
    });
  }, []);

  return null;
}
