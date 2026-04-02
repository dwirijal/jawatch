'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  {
    ssr: false,
    loading: () => null,
  }
);

function scheduleDeferredWork(task: () => void) {
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
      }, { timeout: 2000 });
      return;
    }

    timeoutId = setTimeout(() => {
      if (!cancelled) {
        task();
      }
    }, 600);
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

export function DeferredAnalytics() {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    return scheduleDeferredWork(() => {
      setShouldRender(true);
    });
  }, []);

  return shouldRender ? <Analytics /> : null;
}
