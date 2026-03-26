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
        <Button variant="outline" size="icon" className="rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 text-zinc-400 hover:bg-surface-elevated hover:text-white">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopperTrigger>
      <PopperContent className="z-[200] w-64 p-5" sideOffset={8} align="end">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-orange-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Reader Settings</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Container Width</span>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">{readerWidth}%</span>
            </div>
            <Slider value={readerWidth} min={60} max={100} step={20} onChange={(event) => setReaderWidth(Number(event.currentTarget.value))} />
          </div>

          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <div className="flex items-center gap-2">
              <FastForward className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Auto Next</span>
            </div>
            <Switch checked={autoNext} onClick={() => setAutoNext(!autoNext)} />
          </div>
        </div>
      </PopperContent>
    </PopperRoot>
  );
}
