'use client';

import * as React from 'react';
import { Clapperboard, Play, Settings2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ModalContent, ModalDescription, ModalRoot, ModalTitle } from '@/components/atoms/Modal';
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
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (preference === null) {
      setDialogOpen(true);
    }
  }, [preference]);

  const handleSavePreference = (value: boolean) => {
    savePreference(value);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSavePreference(!(preference ?? false))}
          className={cn('rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 text-[10px] uppercase tracking-[0.24em] text-zinc-300 hover:bg-surface-elevated hover:text-white')}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Trailer {preference ? 'On' : 'Off'}
        </Button>
      </div>

      <ModalRoot open={dialogOpen} onOpenChange={setDialogOpen}>
        <ModalContent className="z-[221] w-[calc(100vw-2rem)] max-w-lg rounded-[var(--radius-2xl)] border border-border-subtle bg-background p-6 shadow-2xl md:p-7" overlayClassName="z-[220]">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-surface-1">
                <Clapperboard className="h-6 w-6 text-zinc-200" />
              </div>
              <ModalTitle className="text-xl font-black uppercase tracking-tight text-white md:text-2xl">
                Trailer Hero Preference
              </ModalTitle>
              <ModalDescription className="text-sm leading-relaxed text-zinc-400">
                Kalau trailer tersedia, hero bisa langsung pakai background trailer. Pilihan ini disimpan sekali untuk semua halaman video.
              </ModalDescription>
            </div>

            <div className="grid gap-3">
              <Button variant={theme} className="h-12 rounded-[var(--radius-lg)]" onClick={() => handleSavePreference(true)}>
                Play Trailer If Available
                <Play className="ml-2 h-4 w-4 fill-current" />
              </Button>
              <Button variant="outline" className="h-12 rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 hover:bg-surface-elevated" onClick={() => handleSavePreference(false)}>
                Keep Hero Static
              </Button>
            </div>
          </div>
        </ModalContent>
      </ModalRoot>
    </>
  );
}
