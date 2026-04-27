'use client';

import * as React from 'react';
import {
  AlertCircle,
  Lightbulb,
  LightbulbOff,
  Maximize,
  Minimize,
  RefreshCw,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import {
  buildVideoPlayerControls,
  type VideoPlayerControlDescriptor,
} from '@/lib/video-player-controls';

interface VideoPlayerControlsProps {
  hasNext: boolean;
  isLightsDimmed: boolean;
  isTheaterMode: boolean;
  onNext?: () => void;
  onRefresh: () => void;
  onReport: () => void;
  onToggleLights: () => void;
  onToggleTheater: () => void;
  reportDisabled: boolean;
  theme: 'anime' | 'donghua' | 'movie' | 'drama';
}

const overlayButtonClass =
  'h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/90 text-foreground backdrop-blur-md hover:bg-surface-elevated hover:text-foreground';

function renderControlIcon(
  control: VideoPlayerControlDescriptor,
  state: Pick<VideoPlayerControlsProps, 'isLightsDimmed' | 'isTheaterMode'>,
) {
  switch (control.id) {
    case 'next':
      return <SkipForward className="h-5 w-5 fill-current" />;
    case 'report':
      return <AlertCircle className="h-5 w-5" />;
    case 'refresh':
      return <RefreshCw className="h-5 w-5" />;
    case 'lights':
      return state.isLightsDimmed ? <Lightbulb className="h-5 w-5" /> : <LightbulbOff className="h-5 w-5" />;
    case 'theater':
      return state.isTheaterMode ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />;
    default:
      return null;
  }
}

function resolveControlVariant(
  control: VideoPlayerControlDescriptor,
  props: Pick<VideoPlayerControlsProps, 'theme' | 'reportDisabled'>,
) {
  if (control.id === 'next') {
    return {
      className: 'h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-[var(--radius-sm)]',
      variant: props.theme,
    } as const;
  }

  if (control.id === 'report') {
    return {
      className: cn(
        overlayButtonClass,
        props.reportDisabled ? 'text-[var(--signal-success)]' : 'hover:bg-[var(--signal-danger-surface)] hover:text-[var(--signal-danger)]',
      ),
      variant: 'ghost',
    } as const;
  }

  return {
    className: overlayButtonClass,
    variant: 'ghost',
  } as const;
}

export const VideoPlayerControls = React.memo(function VideoPlayerControls({
  hasNext,
  isLightsDimmed,
  isTheaterMode,
  onNext,
  onRefresh,
  onReport,
  onToggleLights,
  onToggleTheater,
  reportDisabled,
  theme,
}: VideoPlayerControlsProps) {
  const controls = buildVideoPlayerControls({
    hasNext,
    hasReportedCurrentMirror: reportDisabled,
  });

  return (
    <>
      {controls.map((control) => {
        const { className, variant } = resolveControlVariant(control, {
          theme,
          reportDisabled,
        });

        const handlerMap: Record<VideoPlayerControlDescriptor['id'], (() => void) | undefined> = {
          next: onNext,
          report: onReport,
          refresh: onRefresh,
          lights: onToggleLights,
          theater: onToggleTheater,
        };

        return (
          <Button
            key={control.id}
            variant={variant}
            size="icon"
            onClick={handlerMap[control.id]}
            disabled={control.disabled}
            className={className}
            title={control.label}
            aria-label={control.label}
          >
            {renderControlIcon(control, { isLightsDimmed, isTheaterMode })}
          </Button>
        );
      })}
    </>
  );
});
