'use client';

import * as React from 'react';
import { Settings2, FastForward, Sliders } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/atoms/Button';
import { PopperContent, PopperRoot, PopperTrigger } from '@/components/atoms/Popper';
import { Slider } from '@/components/atoms/Slider';
import { Switch } from '@/components/atoms/Switch';

export function ReadingSettings({ autoNext, setAutoNext }: { autoNext: boolean, setAutoNext: (v: boolean) => void }) {
  const { readerWidth, setReaderWidth } = useUIStore();

  return (
    <PopperRoot>
      <PopperTrigger asChild>
        <Button variant="outline" size="icon" className="h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 text-foreground hover:bg-surface-elevated hover:text-foreground">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopperTrigger>
      <PopperContent className="z-[200] w-64 p-[var(--space-lg)]" sideOffset={8} align="end">
        <div className="space-y-5">
          <div className="flex items-center gap-[var(--space-xs)]">
            <Sliders className="h-3.5 w-3.5 text-[var(--signal-warning)]" />
            <h3 className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Pengaturan reader</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-[var(--space-sm)]">
              <span className="text-[var(--type-size-xs)] font-bold uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Lebar baca</span>
              <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-[var(--signal-warning)]">{readerWidth}%</span>
            </div>
            <Slider value={readerWidth} min={60} max={100} step={20} onChange={(event) => setReaderWidth(Number(event.currentTarget.value))} />
          </div>

          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <div className="flex items-center gap-[var(--space-xs)]">
              <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[var(--type-size-xs)] font-bold uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Auto lanjut</span>
            </div>
            <Switch checked={autoNext} onClick={() => setAutoNext(!autoNext)} />
          </div>
        </div>
      </PopperContent>
    </PopperRoot>
  );
}
