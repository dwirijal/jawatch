'use client';

import * as React from 'react';
import type { BookmarkItem } from '@/lib/store';
import type { ShareMediaType } from '@/lib/marketing';
import type { ThemeType } from '@/lib/utils';
import { ShareButton } from '@/components/molecules/ShareButton';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';

interface DeferredHeroActionsProps {
  title: string;
  mediaType?: ShareMediaType;
  theme: Extract<ThemeType, 'manga' | 'anime' | 'donghua' | 'movie' | 'drama' | 'novel'>;
  bookmarkItem?: BookmarkItem;
}

function scheduleDeferredLoad(task: () => void) {
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

function ActionPlaceholder({ wide = false }: { wide?: boolean }) {
      return (
        <span
          aria-hidden="true"
          className={wide
        ? 'inline-flex min-h-11 min-w-[7.5rem] rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/80'
        : 'inline-flex h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/80'}
    />
  );
}

export function DeferredHeroActions({
  title,
  mediaType,
  theme,
  bookmarkItem,
}: DeferredHeroActionsProps) {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const bookmarkTheme = theme === 'novel' ? undefined : theme;

  React.useEffect(() => {
    if (shouldLoad) {
      return;
    }

    return scheduleDeferredLoad(() => {
      setShouldLoad(true);
    });
  }, [shouldLoad]);

  const handleEagerLoad = React.useCallback(() => {
    setShouldLoad(true);
  }, []);

  return (
    <span
      className="contents"
      onPointerEnter={handleEagerLoad}
      onFocus={handleEagerLoad}
      onTouchStart={handleEagerLoad}
    >
      {shouldLoad ? <ShareButton title={title} mediaType={mediaType} theme={theme} /> : <ActionPlaceholder />}
      {bookmarkItem && bookmarkTheme ? (
        shouldLoad ? (
          <BookmarkButton item={bookmarkItem} theme={bookmarkTheme} />
        ) : (
          <ActionPlaceholder wide />
        )
      ) : null}
    </span>
  );
}
