'use client';

import * as React from 'react';

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StaggeredList({ children, className, delay = 0 }: StaggeredListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || typeof Element === 'undefined') {
      return;
    }

    const animations = Array.from(containerRef.current.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .map((child, index) =>
        child.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            delay: index * delay,
            duration: 800,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'both',
          }
        )
      );

    return () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };
  }, [children, delay]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
