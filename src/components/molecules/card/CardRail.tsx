'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardRailProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function CardRail({ children, className, itemClassName }: CardRailProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={cn('media-rail', className)}>
      {items.map((child, index) => (
        <div key={index} className={cn('media-rail-item', itemClassName)}>
          {child}
        </div>
      ))}
    </div>
  );
}

