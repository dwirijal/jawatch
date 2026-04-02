'use client';

import * as React from 'react';
import Script from 'next/script';

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8868090753979495';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    __dwizzyAutoAdsStarted?: boolean;
  }
}

interface AdNetworkBootstrapProps {
  provider: 'adsense' | 'adult';
  enabled: boolean;
}

function removeScript(id: string) {
  document.getElementById(id)?.remove();
}

export function AdNetworkBootstrap({ provider, enabled }: AdNetworkBootstrapProps) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    if (provider === 'adult') {
      removeScript('dwizzy-adsense-script');
      window.__dwizzyAutoAdsStarted = false;
      return;
    }

    removeScript('dwizzy-exoclick-script');
  }, [enabled, provider]);

  if (!enabled) {
    return null;
  }

  if (provider === 'adult') {
    return (
      <Script
        id="dwizzy-exoclick-script"
        src="https://a.magsrv.com/ad-provider.js"
        strategy="lazyOnload"
        onReady={() => {
          window.dispatchEvent(new Event('dwizzy:adult-ads-ready'));
        }}
      />
    );
  }

  return (
    <Script
      id="dwizzy-adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
      onReady={() => {
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
      }}
    />
  );
}
