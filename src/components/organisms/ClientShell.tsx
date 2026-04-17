'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { DeviceListener } from '@/components/atoms/DeviceListener';
import { DeferredAnalytics } from '@/components/organisms/DeferredAnalytics';
import { ColorModeController } from '@/components/organisms/ColorModeController';
import { isChromelessPath, isImmersivePlaybackPath } from '@/lib/route-chrome';

const MobileNav = dynamic(() => import('@/components/organisms/MobileNav').then((mod) => mod.MobileNav), {
  ssr: false,
  loading: () => null,
});

const PWAInstallPrompt = dynamic(() => import('@/components/molecules/PWAInstallPrompt').then((mod) => mod.PWAInstallPrompt), {
  ssr: false,
  loading: () => null,
});

function scheduleDeferredMount(task: () => void) {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleId: number | null = null;
  const requestIdle =
    'requestIdleCallback' in window ? window.requestIdleCallback.bind(window) : null;
  const cancelIdle =
    'cancelIdleCallback' in window ? window.cancelIdleCallback.bind(window) : null;

  const run = () => {
    if (cancelled) {
      return;
    }

    if (requestIdle) {
      idleId = requestIdle(() => {
        if (!cancelled) {
          task();
        }
      }, { timeout: 1500 });
      return;
    }

    timeoutId = setTimeout(() => {
      if (!cancelled) {
        task();
      }
    }, 500);
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
      clearTimeout(timeoutId);
    }
    if (idleId != null && cancelIdle) {
      cancelIdle(idleId);
    }
  };
}

export function ClientShell() {
  const pathname = usePathname() || '/';
  const chromeless = isChromelessPath(pathname);
  const immersivePlayback = isImmersivePlaybackPath(pathname);
  const installPromptEligible = pathname !== '/' && pathname !== '/login';
  const [mobileNavMounted, setMobileNavMounted] = React.useState(false);
  const [pwaPromptMounted, setPwaPromptMounted] = React.useState(false);

  React.useEffect(() => {
    if (chromeless || immersivePlayback) {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    const enableMobileNav = (matches: boolean) => {
      if (matches) {
        setMobileNavMounted(true);
      }
    };

    enableMobileNav(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      enableMobileNav(event.matches);
    };

    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    legacyMediaQuery.addListener?.(handleChange);
    return () => legacyMediaQuery.removeListener?.(handleChange);
  }, [chromeless, immersivePlayback]);

  React.useEffect(() => {
    if (chromeless || immersivePlayback || !installPromptEligible) {
      return;
    }

    return scheduleDeferredMount(() => {
      setPwaPromptMounted(true);
    });
  }, [chromeless, immersivePlayback, installPromptEligible]);

  return (
    <>
      <ColorModeController />
      <DeviceListener />
      <DeferredAnalytics />
      {!chromeless && !immersivePlayback && installPromptEligible && pwaPromptMounted ? <PWAInstallPrompt /> : null}
      {!chromeless && !immersivePlayback && mobileNavMounted ? <MobileNav /> : null}
    </>
  );
}
