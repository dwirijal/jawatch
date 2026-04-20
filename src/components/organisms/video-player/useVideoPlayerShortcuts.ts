'use client';

import * as React from 'react';

interface UseVideoPlayerShortcutsProps {
  onToggleTheater: () => void;
  onToggleLights: () => void;
}

export function useVideoPlayerShortcuts({
  onToggleTheater,
  onToggleLights,
}: UseVideoPlayerShortcutsProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 't':
          onToggleTheater();
          break;
        case 'l':
          onToggleLights();
          break;
        case 'f':
          (document.querySelector('iframe, video') as HTMLElement | null)?.requestFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleLights, onToggleTheater]);
}
