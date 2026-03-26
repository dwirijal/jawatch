'use client';

import * as React from 'react';
import { Calendar, Monitor, FilterX } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { Select } from '@/components/atoms/Select';
import { ThemeType } from '@/lib/utils';

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
  return (
    <div data-theme={theme} className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
      <Paper tone="muted" padded={false} className="flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 focus-within:border-white/15">
        <Calendar className="w-4 h-4 text-zinc-500" />
        <Select
          value={activeYear || ''} 
          onChange={(e) => onYearChange(e.target.value || null)}
          className="h-auto border-0 bg-transparent px-0 py-0"
        >
          <option value="" className="bg-zinc-950 text-zinc-500">All Years</option>
          {years.map(year => (
            <option key={year} value={year} className="bg-zinc-950 text-zinc-300">{year}</option>
          ))}
        </Select>
      </Paper>

      {studios && onStudioChange && (
        <Paper tone="muted" padded={false} className="flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 focus-within:border-white/15">
          <Monitor className="w-4 h-4 text-zinc-500" />
          <Select
            value={activeStudio || ''} 
            onChange={(e) => onStudioChange(e.target.value || null)}
            className="h-auto max-w-[150px] border-0 bg-transparent px-0 py-0"
          >
            <option value="" className="bg-zinc-950 text-zinc-500">All Studios</option>
            {studios.map(studio => (
              <option key={studio} value={studio} className="bg-zinc-950 text-zinc-300">{studio}</option>
            ))}
          </Select>
        </Paper>
      )}

      {(activeYear || activeStudio) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="gap-2 rounded-[var(--radius-lg)] border-red-500/20 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          <FilterX className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Reset Filters</span>
        </Button>
      )}
    </div>
  );
}
