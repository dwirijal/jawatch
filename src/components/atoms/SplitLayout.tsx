import * as React from 'react';
import { cn } from '@/lib/utils';

type SplitLayoutBreakpoint = 'lg' | 'xl';

interface SplitLayoutProps {
  stage: React.ReactNode;
  gallery?: React.ReactNode;
  className?: string;
  stageClassName?: string;
  galleryClassName?: string;
  breakpoint?: SplitLayoutBreakpoint;
  mobileGoldenRows?: boolean;
}

const BREAKPOINT_CLASS: Record<SplitLayoutBreakpoint, string> = {
  lg: 'lg:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)] lg:grid-rows-1',
  xl: 'xl:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)] xl:grid-rows-1',
};

export function SplitLayout({
  stage,
  gallery,
  className,
  stageClassName,
  galleryClassName,
  breakpoint = 'lg',
  mobileGoldenRows = false,
}: SplitLayoutProps) {
  if (!gallery) {
    return <div className={cn(stageClassName)}>{stage}</div>;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        mobileGoldenRows && 'grid-rows-[minmax(0,1.618fr)_minmax(0,1fr)]',
        BREAKPOINT_CLASS[breakpoint],
        className
      )}
    >
      <section className={cn(stageClassName)}>{stage}</section>
      <aside className={cn(galleryClassName)}>{gallery}</aside>
    </div>
  );
}
