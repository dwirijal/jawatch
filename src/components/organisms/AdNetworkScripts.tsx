'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8868090753979495';
const ADULT_ZONE_IDS = [
  process.env.NEXT_PUBLIC_EXOCLICK_ZONE_HORIZONTAL,
  process.env.NEXT_PUBLIC_EXOCLICK_ZONE_VERTICAL,
  process.env.NEXT_PUBLIC_EXOCLICK_ZONE_SQUARE,
].filter(Boolean);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    __dwizzyAutoAdsStarted?: boolean;
  }
}

function removeScript(id: string) {
  document.getElementById(id)?.remove();
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

export function AdNetworkScripts() {
  const pathname = usePathname() || '/';
  const isNsfwRoute = pathname === '/nsfw' || pathname.startsWith('/nsfw/');
  const previousBoundaryRef = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    const reloadMarker = '__dwizzy_ad_boundary_reload__';
    const targetBoundary = isNsfwRoute ? 'nsfw' : 'sfw';

    if (previousBoundaryRef.current !== null && previousBoundaryRef.current !== isNsfwRoute) {
      if (window.sessionStorage.getItem(reloadMarker) !== targetBoundary) {
        window.sessionStorage.setItem(reloadMarker, targetBoundary);
        window.location.replace(window.location.href);
        return;
      }
    }

    previousBoundaryRef.current = isNsfwRoute;
    window.sessionStorage.removeItem(reloadMarker);
  }, [isNsfwRoute]);

  React.useEffect(() => {
    if (isNsfwRoute) {
      removeScript('dwizzy-adsense-script');

      if (ADULT_ZONE_IDS.length === 0) {
        return;
      }

      appendScript({
        id: 'dwizzy-exoclick-script',
        src: 'https://a.magsrv.com/ad-provider.js',
        onLoad: () => {
          window.dispatchEvent(new Event('dwizzy:adult-ads-ready'));
        },
      });
      return;
    }

    removeScript('dwizzy-exoclick-script');

    if (!ADSENSE_CLIENT) {
      return;
    }

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
  }, [isNsfwRoute]);

  return null;
}
