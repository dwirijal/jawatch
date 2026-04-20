'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const ContinueWatching = dynamic(
  () => import('@/components/organisms/ContinueWatching').then((mod) => mod.ContinueWatching),
  { ssr: false }
);

const SavedContentSection = dynamic(
  () => import('@/components/organisms/SavedContentSection').then((mod) => mod.SavedContentSection),
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
      }, { timeout: 1600 });
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

export function CollectionSections() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (mounted) {
      return;
    }

    return scheduleDeferredMount(() => {
      setMounted(true);
    });
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <ContinueWatching />
      <SavedContentSection title="Saved Favorites" />
    </>
  );
}
