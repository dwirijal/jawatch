'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: number;
}

export function Slider({ value, className, min = 0, max = 100, ...props }: SliderProps) {
  const minValue = Number(min);
  const maxValue = Number(max);
  const percent = ((value - minValue) / (maxValue - minValue)) * 100;

  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800',
        '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
        '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white',
        className
      )}
      style={{ backgroundImage: `linear-gradient(to right, rgb(234 88 12) 0%, rgb(234 88 12) ${percent}%, rgb(39 39 42) ${percent}%, rgb(39 39 42) 100%)` }}
      {...props}
    />
  );
}
