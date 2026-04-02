'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import type { AdSectionProps } from '@/components/organisms/AdSection';

const AdSection = dynamic(
  () => import('@/components/organisms/AdSection').then((mod) => mod.AdSection),
  { ssr: false }
);

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

export function DeferredAdSection(props: AdSectionProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (mounted) {
      return;
    }

    return scheduleDeferredMount(() => {
      setMounted(true);
    });
  }, [mounted]);

  return mounted ? <AdSection {...props} /> : null;
}
