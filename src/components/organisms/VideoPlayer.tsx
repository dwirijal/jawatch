'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn, type ThemeType } from '@/lib/utils';
import { resolveVideoPlayerMediaMode } from '@/lib/video-player-media';
import { useUIStore } from '@/store/useUIStore';
import { VideoPlayerControls } from '@/components/organisms/video-player/VideoPlayerControls';
import { VideoPlayerFrame } from '@/components/organisms/video-player/VideoPlayerFrame';
import { VideoPlayerMirrorPanel } from '@/components/organisms/video-player/VideoPlayerMirrorPanel';
import { useVideoPlayerShortcuts } from '@/components/organisms/video-player/useVideoPlayerShortcuts';
import { useVideoPlayerState } from '@/components/organisms/video-player/useVideoPlayerState';

interface VideoPlayerProps {
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
  showMirrorPanel?: boolean;
  theme?: WatchPlayerTheme;
  format?: 'landscape' | 'vertical' | 'shorts';
  onNext?: () => void;
  nextHref?: string | null;
  hasNext?: boolean;
  onEnded?: () => void;
}

type WatchPlayerTheme = Extract<ThemeType, 'anime' | 'donghua' | 'movie' | 'drama'>;

const THEME_ACCENT = {
  anime: {
    spinner: 'border-[color:var(--theme-anime-fill)]',
    panel: 'bg-[var(--theme-anime-surface)] text-[var(--theme-anime-text)]',
  },
  donghua: {
    spinner: 'border-[color:var(--theme-donghua-fill)]',
    panel: 'bg-[var(--theme-donghua-surface)] text-[var(--theme-donghua-text)]',
  },
  movie: {
    spinner: 'border-[color:var(--theme-movie-fill)]',
    panel: 'bg-[var(--theme-movie-surface)] text-[var(--theme-movie-text)]',
  },
  drama: {
    spinner: 'border-[color:var(--theme-drama-fill)]',
    panel: 'bg-[var(--theme-drama-surface)] text-[var(--theme-drama-text)]',
  },
} as const;

function resolveFrameClassName(format: NonNullable<VideoPlayerProps['format']>, isTheaterMode: boolean) {
  if (format === 'shorts') {
    return 'h-full w-full rounded-none border-0';
  }

  if (format === 'vertical') {
    return 'mx-auto aspect-[9/16] w-full max-w-[26rem] rounded-[var(--radius-2xl)]';
  }

  return cn(
    'aspect-video rounded-[var(--radius-2xl)] md:rounded-[calc(var(--radius-2xl)+0.5rem)]',
    isTheaterMode && 'md:rounded-[2rem]',
  );
}

export function VideoPlayer({
  mirrors,
  defaultUrl,
  showMirrorPanel = true,
  theme = 'anime',
  format = 'landscape',
  onNext,
  nextHref,
  hasNext = false,
  onEnded,
}: VideoPlayerProps) {
  const router = useRouter();
  const { isTheaterMode, setTheaterMode, isLightsDimmed, setLightsDimmed } = useUIStore();
  const accent = THEME_ACCENT[theme];
  const {
    activeUrl,
    autoPlay,
    deadMirrors,
    hasReportedCurrentMirror,
    playerKey,
    setAutoPlay,
    handleMirrorChange,
    handleReportCurrentMirror,
    refreshPlayer,
  } = useVideoPlayerState({
    mirrors,
    defaultUrl,
  });
  const mediaMode = resolveVideoPlayerMediaMode(activeUrl || '');
  const frameClassName = resolveFrameClassName(format, isTheaterMode);
  const canGoNext = hasNext && Boolean(onNext || nextHref);

  const handleNext = React.useCallback(() => {
    if (onNext) {
      onNext();
      return;
    }

    if (nextHref) {
      router.push(nextHref);
    }
  }, [nextHref, onNext, router]);

  const toggleLights = React.useCallback(() => {
    setLightsDimmed(!isLightsDimmed);
  }, [isLightsDimmed, setLightsDimmed]);

  const toggleTheater = React.useCallback(() => {
    setTheaterMode(!isTheaterMode);

    if (!isTheaterMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isTheaterMode, setTheaterMode]);

  useVideoPlayerShortcuts({
    onToggleTheater: toggleTheater,
    onToggleLights: toggleLights,
  });

  return (
    <div
      className={cn(
        'relative z-[150] w-full transition-all duration-500 ease-out',
        format === 'shorts' && 'h-full',
        format !== 'shorts' && 'space-y-4 md:space-y-6',
      )}
    >
      {isLightsDimmed && !isTheaterMode ? (
        <div className="fixed inset-0 z-[140] animate-in fade-in bg-surface-1/95 duration-500" onClick={toggleLights} />
      ) : null}

      {!isTheaterMode ? (
        <div
          className={cn(
            'absolute inset-0 z-0 opacity-20 blur-[120px] transition-all duration-1000',
            theme === 'anime' && 'bg-[var(--theme-anime-fill)]',
            theme === 'donghua' && 'bg-[var(--theme-donghua-fill)]',
            theme === 'movie' && 'bg-[var(--theme-movie-fill)]',
            theme === 'drama' && 'bg-[var(--theme-drama-fill)]',
          )}
          style={{ transform: 'scale(1.1)' }}
        />
      ) : null}

      <div
        className={cn(
          'group relative z-10 overflow-hidden border border-border-subtle bg-surface-2 hard-shadow-md transition-all duration-700',
          frameClassName,
          isTheaterMode && format === 'landscape' && 'border-white/15 shadow-[0_30px_120px_color-mix(in_srgb,var(--shadow-color-strong)_48%,transparent)]',
          isLightsDimmed && !isTheaterMode && 'ring-4 ring-foreground/10',
        )}
      >
        <VideoPlayerFrame
          activeUrl={activeUrl || ''}
          autoPlay={autoPlay}
          mediaMode={mediaMode}
          playerKey={playerKey}
          spinnerClassName={accent.spinner}
          onEnded={onEnded}
        />

        <div
          className={cn(
            'pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center transition-all duration-300 lg:inset-x-auto lg:bottom-auto lg:right-4 lg:top-4 lg:justify-end',
            isTheaterMode && 'lg:right-8 lg:top-8',
          )}
        >
          <div
            className={cn(
              'flex items-center gap-[var(--space-xs)] rounded-full border border-white/10 bg-surface-1/55 px-[var(--space-xs)] py-[var(--space-xs)] shadow-[0_24px_60px_-36px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-opacity duration-300',
              isTheaterMode
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-auto opacity-100 lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100',
            )}
          >
            <VideoPlayerControls
              hasNext={canGoNext}
              isLightsDimmed={isLightsDimmed}
              isTheaterMode={isTheaterMode}
              onNext={canGoNext ? handleNext : undefined}
              onRefresh={refreshPlayer}
              onReport={handleReportCurrentMirror}
              onToggleLights={toggleLights}
              onToggleTheater={toggleTheater}
              reportDisabled={hasReportedCurrentMirror}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {showMirrorPanel ? (
        <VideoPlayerMirrorPanel
          accentPanelClassName={accent.panel}
          activeUrl={activeUrl || ''}
          autoPlay={autoPlay}
          deadMirrors={deadMirrors}
          isLightsDimmed={isLightsDimmed}
          isTheaterMode={isTheaterMode}
          mirrors={mirrors}
          onMirrorChange={handleMirrorChange}
          onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
          theme={theme}
        />
      ) : null}
    </div>
  );
}
