'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { useUIStore } from '@/store/useUIStore';

export function SearchLauncher() {
  const { setSearchOpen } = useUIStore();

  return (
    <Button
      variant="ghost"
      onClick={() => setSearchOpen(true)}
      className="hidden items-center gap-4 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/50 px-4 py-2 text-muted-foreground backdrop-blur-md hover:bg-surface-elevated hover:text-foreground md:flex refractive-border glass-noise"
    >
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Search Discovery</span>
      </div>
    </Button>
  );
}
