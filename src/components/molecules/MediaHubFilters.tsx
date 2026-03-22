'use client';

import * as React from 'react';
import { Calendar, Monitor, FilterX } from 'lucide-react';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface MediaHubFiltersProps {
  years: string[];
  studios?: string[];
  activeYear: string | null;
  activeStudio?: string | null;
  onYearChange: (year: string | null) => void;
  onStudioChange?: (studio: string | null) => void;
  onClear: () => void;
  theme: ThemeType;
}

export function MediaHubFilters({
  years,
  studios,
  activeYear,
  activeStudio,
  onYearChange,
  onStudioChange,
  onClear,
  theme
}: MediaHubFiltersProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  return (
    <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
      {/* Year Filter */}
      <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-2xl focus-within:border-zinc-700 transition-all">
        <Calendar className="w-4 h-4 text-zinc-500" />
        <select 
          value={activeYear || ''} 
          onChange={(e) => onYearChange(e.target.value || null)}
          className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-zinc-300 cursor-pointer"
        >
          <option value="" className="bg-zinc-950 text-zinc-500">All Years</option>
          {years.map(year => (
            <option key={year} value={year} className="bg-zinc-950 text-zinc-300">{year}</option>
          ))}
        </select>
      </div>

      {/* Studio Filter (Optional) */}
      {studios && onStudioChange && (
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-2xl focus-within:border-zinc-700 transition-all">
          <Monitor className="w-4 h-4 text-zinc-500" />
          <select 
            value={activeStudio || ''} 
            onChange={(e) => onStudioChange(e.target.value || null)}
            className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-zinc-300 cursor-pointer max-w-[150px]"
          >
            <option value="" className="bg-zinc-950 text-zinc-500">All Studios</option>
            {studios.map(studio => (
              <option key={studio} value={studio} className="bg-zinc-950 text-zinc-300">{studio}</option>
            ))}
          </select>
        </div>
      )}

      {/* Clear Button */}
      {(activeYear || activeStudio) && (
        <button 
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-red-500/10 text-red-500 transition-all group"
        >
          <FilterX className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Reset Filters</span>
        </button>
      )}
    </div>
  );
}
