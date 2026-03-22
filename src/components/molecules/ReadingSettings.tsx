'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Settings2, FastForward, Sliders } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

export function ReadingSettings({ autoNext, setAutoNext }: { autoNext: boolean, setAutoNext: (v: boolean) => void }) {
  const { readerWidth, setReaderWidth } = useUIStore();

  const widths = [
    { label: '60%', value: 60 },
    { label: '80%', value: 80 },
    { label: '100%', value: 100 },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl bg-zinc-900 border border-zinc-800">
          <Settings2 className="w-4 h-4 text-zinc-400" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="z-[200] w-64 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          sideOffset={5}
          align="end"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Reader Settings</h3>
            </div>

            {/* Width Selector */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Container Width</span>
                <span className="text-[10px] font-black text-orange-500">{readerWidth}%</span>
              </div>
              <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                {widths.map((w) => (
                  <button
                    key={w.value}
                    onClick={() => setReaderWidth(w.value)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all",
                      readerWidth === w.value ? "bg-orange-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Next Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-zinc-900 mt-2">
              <div className="flex items-center gap-2">
                <FastForward className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Auto Next</span>
              </div>
              <button 
                onClick={() => setAutoNext(!autoNext)}
                className={cn("w-8 h-4 rounded-full transition-all relative", autoNext ? "bg-orange-600" : "bg-zinc-800")}
              >
                <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", autoNext ? "left-4.5" : "left-0.5")} />
              </button>
            </div>
          </div>
          <Popover.Arrow className="fill-zinc-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
