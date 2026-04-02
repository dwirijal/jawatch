'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import type { AdRenderState } from '@/lib/ad-section-visibility';
import type { ThemeType } from '@/lib/utils';

const LazyAds = dynamic(
  () => import('@/components/atoms/Ads').then((mod) => mod.Ads),
  { ssr: false }
);

interface DeferredAdsProps {
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
  theme?: ThemeType;
  onStatusChange?: (status: AdRenderState) => void;
}

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
      }, { timeout: 1800 });
      return;
    }

    timeoutId = setTimeout(() => {
      if (!cancelled) {
        task();
      }
    }, 700);
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

export function DeferredAds(props: DeferredAdsProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (mounted) {
      return;
    }

    return scheduleDeferredMount(() => {
      setMounted(true);
    });
  }, [mounted]);

  return mounted ? <LazyAds {...props} /> : null;
}
