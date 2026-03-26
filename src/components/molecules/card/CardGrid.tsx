'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CardGrid({ children, className }: CardGridProps) {
  return <div className={cn('media-grid', className)}>{children}</div>;
}

