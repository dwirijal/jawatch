'use client';

import * as React from 'react';
import CircularText from './CircularText';

interface CircularLoaderProps {
  text?: string;
  theme?: 'manga' | 'anime' | 'donghua' | 'movie' | 'default';
}

export function CircularLoader({ text = " • LOADING • DWIZZYWEEB • PLEASE WAIT • ", theme = 'default' }: CircularLoaderProps) {
  const colors = {
    manga: "text-orange-500",
    anime: "text-blue-500",
    donghua: "text-red-500",
    movie: "text-indigo-500",
    default: "text-zinc-500"
  };

  const bgColors = {
    manga: "bg-orange-600",
    anime: "bg-blue-600",
    donghua: "bg-red-600",
    movie: "bg-indigo-600",
    default: "bg-zinc-100"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-20">
      <div className="relative">
        <CircularText 
          text={text} 
          spinDuration={10} 
          onHover="goBonkers" 
          className={colors[theme]}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full ${bgColors[theme]} flex items-center justify-center shadow-2xl animate-pulse`}>
             <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">Synchronizing Data</p>
    </div>
  );
}
