'use client';

import * as React from 'react';
import { Clapperboard } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ThemeType, cn } from '@/lib/utils';
import { getVideoTrailerPreference, setVideoTrailerPreference } from '@/lib/store';

type VideoHeroTheme = Extract<ThemeType, 'anime' | 'donghua' | 'movie' | 'drama'>;

const TRAILER_PREFERENCE_EVENT = 'dwizzy:video-trailer-preference-change';

declare global {
  interface WindowEventMap {
    'dwizzy:video-trailer-preference-change': Event;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(TRAILER_PREFERENCE_EVENT, onStoreChange);
  return () => window.removeEventListener(TRAILER_PREFERENCE_EVENT, onStoreChange);
}

function getPreferenceSnapshot(): boolean | null {
  return getVideoTrailerPreference();
}

function getPreferenceServerSnapshot(): boolean | null {
  return null;
}

function useTrailerPreference() {
  const preference = React.useSyncExternalStore(
    subscribe,
    getPreferenceSnapshot,
    getPreferenceServerSnapshot
  );

  const savePreference = React.useCallback((value: boolean) => {
    setVideoTrailerPreference(value);
    window.dispatchEvent(new Event(TRAILER_PREFERENCE_EVENT));
  }, []);

  return [preference, savePreference] as const;
}

export function VideoHeroTrailerBackground({
  embedUrl,
  title,
}: {
  embedUrl: string;
  title: string;
}) {
  const [preference] = useTrailerPreference();

  if (!preference) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 scale-[1.25] opacity-35">
      <iframe
        src={embedUrl}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; picture-in-picture"
        className="h-full w-full"
      />
    </div>
  );
}

export function VideoHeroTrailerControls({
  theme,
}: {
  theme: VideoHeroTheme;
}) {
  const [preference, savePreference] = useTrailerPreference();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={preference ? theme : 'outline'}
        onClick={() => savePreference(!(preference ?? false))}
        aria-pressed={Boolean(preference)}
        aria-label={preference ? 'Disable trailer background' : 'Enable trailer background'}
        className={cn(
          'h-11 min-w-[9.25rem] rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 px-4 text-[11px] uppercase tracking-[0.22em] text-zinc-200 hover:bg-surface-elevated hover:text-white',
          preference && 'border-white/20'
        )}
      >
        <Clapperboard className={cn('h-4 w-4', preference && 'text-current')} />
        Trailer {preference ? 'On' : 'Off'}
      </Button>
    </div>
  );
}
