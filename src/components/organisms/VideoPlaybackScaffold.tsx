import * as React from 'react';
import { SplitLayout } from '@/components/atoms/SplitLayout';
import { cn } from '@/lib/utils';

interface VideoPlaybackScaffoldProps {
  backHref: string;
  title: string;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  stage: React.ReactNode;
  sidebar?: React.ReactNode;
  desktopColumnsClassName?: string;
  stretchSidebarToStage?: boolean;
  children?: React.ReactNode;
}

export function VideoPlaybackScaffold(props: VideoPlaybackScaffoldProps) {
  const { stage, sidebar, desktopColumnsClassName, stretchSidebarToStage = false, children } = props;

  return (
    <div className="app-shell bg-background text-[var(--accent-contrast)]">
      <main className="app-container-wide app-section-stack py-[var(--space-sm)] md:py-5">
        <SplitLayout
          breakpoint="xl"
          desktopColumnsClassName={desktopColumnsClassName}
          className={cn(stretchSidebarToStage ? 'items-stretch' : 'items-start', 'gap-[var(--space-xl)] xl:gap-8')}
          stage={<div className="space-y-5">{stage}</div>}
          gallery={
            sidebar ? (
              <div className={cn('space-y-5 xl:sticky xl:top-5', stretchSidebarToStage && 'xl:h-full')}>
                {sidebar}
              </div>
            ) : undefined
          }
        />

        {children ? <div className="app-section-stack">{children}</div> : null}
      </main>
    </div>
  );
}
