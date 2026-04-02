'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

const ReadingSettings = dynamic(
  () => import('@/components/molecules/ReadingSettings').then((mod) => mod.ReadingSettings),
  { ssr: false }
);

interface DeferredReadingSettingsProps {
  autoNext: boolean;
  setAutoNext: (value: boolean) => void;
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

export function DeferredReadingSettings({
  autoNext,
  setAutoNext,
}: DeferredReadingSettingsProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (mounted) {
      return;
    }

    return scheduleDeferredMount(() => {
      setMounted(true);
    });
  }, [mounted]);

  const handleMount = React.useCallback(() => {
    setMounted(true);
  }, []);

  if (mounted) {
    return <ReadingSettings autoNext={autoNext} setAutoNext={setAutoNext} />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Open reader settings"
      className="rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 text-zinc-400 hover:bg-surface-elevated hover:text-white"
      onPointerEnter={handleMount}
      onFocus={handleMount}
      onTouchStart={handleMount}
      onClick={handleMount}
    >
      <Settings2 className="h-4 w-4" />
    </Button>
  );
}
