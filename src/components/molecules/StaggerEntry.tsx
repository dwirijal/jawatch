'use client';

import * as React from 'react';
import { animate, utils } from 'animejs';

interface StaggerEntryProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerEntry({ children, className, delay = 0 }: StaggerEntryProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      animate(Array.from(containerRef.current.children), {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        delay: utils.stagger(100, { start: delay }),
        duration: 1000,
        ease: 'outExpo',
      });
    }
  }, [delay, children]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
