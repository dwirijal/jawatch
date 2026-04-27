'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { DeviceListener } from '@/components/atoms/DeviceListener';
import { DeferredAnalytics } from '@/components/organisms/DeferredAnalytics';
import { ColorModeController } from '@/components/organisms/ColorModeController';
import { subscribeToMediaQuery } from '@/lib/media-query';
import { isChromelessPath, isImmersivePlaybackPath } from '@/lib/route-chrome';

const DesktopNavbar = dynamic(() => import('@/components/organisms/Navbar').then((mod) => mod.Navbar), {
  ssr: false,
  loading: () => null,
});

const DeferredCommandBar = dynamic(
  () => import('@/components/organisms/DeferredCommandBar').then((mod) => mod.DeferredCommandBar),
  {
    ssr: false,
    loading: () => null,
  },
);

const AdNetworkScripts = dynamic(
  () => import('@/components/organisms/AdNetworkScripts').then((mod) => mod.AdNetworkScripts),
  {
    ssr: false,
    loading: () => null,
  },
);

const LegacyServiceWorkerCleanup = dynamic(
  () => import('@/components/organisms/LegacyServiceWorkerCleanup').then((mod) => mod.LegacyServiceWorkerCleanup),
  {
    ssr: false,
    loading: () => null,
  },
);

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
  const chromeEnabled = !chromeless && !immersivePlayback;
  const [deferredGlobalsMounted, setDeferredGlobalsMounted] = React.useState(false);
  const [desktopChromeMounted, setDesktopChromeMounted] = React.useState(false);
  const [mobileNavMounted, setMobileNavMounted] = React.useState(false);
  const [pwaPromptMounted, setPwaPromptMounted] = React.useState(false);

  React.useEffect(() => {
    if (deferredGlobalsMounted) {
      return;
    }

    return scheduleDeferredMount(() => {
      setDeferredGlobalsMounted(true);
    });
  }, [deferredGlobalsMounted]);

  React.useEffect(() => {
    if (!chromeEnabled) {
      setDesktopChromeMounted(false);
      return;
    }

    return subscribeToMediaQuery('(min-width: 768px)', (matches) => {
      setDesktopChromeMounted(matches);
    });
  }, [chromeEnabled]);

  React.useEffect(() => {
    if (!chromeEnabled) {
      setMobileNavMounted(false);
      return;
    }

    return subscribeToMediaQuery('(max-width: 767px)', (matches) => {
      setMobileNavMounted(matches);
    });
  }, [chromeEnabled]);

  React.useEffect(() => {
    if (!chromeEnabled || !installPromptEligible) {
      setPwaPromptMounted(false);
      return;
    }

    return scheduleDeferredMount(() => {
      setPwaPromptMounted(true);
    });
  }, [chromeEnabled, installPromptEligible]);

  return (
    <>
      <ColorModeController />
      <DeviceListener />
      <DeferredAnalytics />
      {deferredGlobalsMounted ? <LegacyServiceWorkerCleanup /> : null}
      {deferredGlobalsMounted ? <AdNetworkScripts /> : null}
      {chromeEnabled && desktopChromeMounted ? <DeferredCommandBar /> : null}
      {chromeEnabled && desktopChromeMounted ? <DesktopNavbar /> : null}
      {chromeEnabled && installPromptEligible && pwaPromptMounted ? <PWAInstallPrompt /> : null}
      {chromeEnabled && mobileNavMounted ? <MobileNav /> : null}
    </>
  );
}
