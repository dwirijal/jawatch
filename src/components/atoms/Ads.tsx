'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdsProps {
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
}

export function Ads({ type = 'horizontal', className }: AdsProps) {
  const styles = {
    horizontal: "w-full h-32 md:h-40",
    vertical: "w-64 h-[600px]",
    square: "w-full aspect-square"
  };

  return (
    <div className={cn(
      "bg-zinc-900/20 border border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-8 group relative overflow-hidden",
      styles[type],
      className
    )}>
      {/* Animated Background Pulse */}
      <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
          <ShieldAlert className="w-5 h-5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Advertisement Slot</p>
          <p className="text-[8px] font-bold text-zinc-800 uppercase tracking-widest mt-1">Contact for placements</p>
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-zinc-800" />
      <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-zinc-800" />
    </div>
  );
}
