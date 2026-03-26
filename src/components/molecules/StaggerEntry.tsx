'use client';

import * as React from 'react';
import { animate } from 'animejs';
import { ANIMATION_PRESETS } from '@/lib/animations';

interface StaggerEntryProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerEntry({ children, className, delay = 0 }: StaggerEntryProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      animate(
        Array.from(containerRef.current.children), 
        ANIMATION_PRESETS.staggerEntrance(delay)
      );
    }
  }, [children, delay]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
