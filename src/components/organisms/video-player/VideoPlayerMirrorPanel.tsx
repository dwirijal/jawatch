'use client';

import * as React from 'react';
import { AlertCircle, Layers, Play } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { Switch } from '@/components/atoms/Switch';
import { cn } from '@/lib/utils';
import { presentMirrorLabel } from '@/lib/video-player-ui';

interface MirrorOption {
  label: string;
  embed_url: string;
}

interface VideoPlayerMirrorPanelProps {
  accentPanelClassName: string;
  activeUrl: string;
  autoPlay: boolean;
  deadMirrors: string[];
  isLightsDimmed: boolean;
  isTheaterMode: boolean;
  mirrors: MirrorOption[];
  onMirrorChange: (url: string, label: string) => void;
  onToggleAutoPlay: () => void;
  theme: 'anime' | 'donghua' | 'movie' | 'drama';
}

export const VideoPlayerMirrorPanel = React.memo(function VideoPlayerMirrorPanel({
  accentPanelClassName,
  activeUrl,
  autoPlay,
  deadMirrors,
  isLightsDimmed,
  isTheaterMode,
  mirrors,
  onMirrorChange,
  onToggleAutoPlay,
  theme,
}: VideoPlayerMirrorPanelProps) {
  if (isTheaterMode) {
    return null;
  }

  return (
    <Paper
      tone="muted"
      shadow="sm"
      className={cn('p-3 transition-all md:p-6', isLightsDimmed && 'opacity-20 hover:opacity-100')}
    >
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-5">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', accentPanelClassName)}>
            <Layers className="h-4 w-4" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Pilihan nonton</h2>
        </div>
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auto lanjut</span>
          <Switch checked={autoPlay} onClick={onToggleAutoPlay} className={!autoPlay ? 'bg-zinc-700' : undefined} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">
        {mirrors.map((mirror, index) => {
          const isDead = deadMirrors.includes(mirror.embed_url);
          const isActive = activeUrl === mirror.embed_url;
          const mirrorLabel = presentMirrorLabel(
            mirror.label,
            mirror.embed_url,
            index,
            mirrors.map((m) => ({ label: m.label, url: m.embed_url })),
          );

          return (
            <Button
              key={`${mirror.embed_url}-${index}`}
              variant={isActive ? theme : 'outline'}
              onClick={() => onMirrorChange(mirror.embed_url, mirror.label)}
              className={cn(
                'relative min-w-0 overflow-hidden rounded-[var(--radius-sm)] px-3 text-[10px] uppercase tracking-[0.1em] md:px-6',
                !isActive && 'border-border-subtle bg-surface-1 hover:bg-surface-elevated',
                isDead && !isActive && 'opacity-40 grayscale',
              )}
              title={mirror.label}
              aria-label={`Pindah sumber ${mirrorLabel}`}
            >
              <div className="relative z-10 flex items-center gap-2">
                {isDead ? (
                  <AlertCircle className="h-3 w-3 text-red-500" />
                ) : (
                  <Play className={cn('h-3 w-3', isActive ? 'fill-current' : 'fill-muted-foreground')} />
                )}
                {mirrorLabel}
              </div>
            </Button>
          );
        })}
      </div>
    </Paper>
  );
});
