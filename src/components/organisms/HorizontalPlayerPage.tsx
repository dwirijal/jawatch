import * as React from 'react';
import { VideoPlaybackScaffold } from '@/components/organisms/VideoPlaybackScaffold';

interface HorizontalPlayerPageProps {
  backHref: string;
  title: string;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  stage: React.ReactNode;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  desktopColumnsClassName?: string;
  stretchSidebarToStage?: boolean;
}

export function HorizontalPlayerPage({
  backHref,
  title,
  eyebrow,
  subtitle,
  headerActions,
  stage,
  sidebar,
  children,
  desktopColumnsClassName = 'xl:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] xl:grid-rows-1',
  stretchSidebarToStage = true,
}: HorizontalPlayerPageProps) {
  return (
    <VideoPlaybackScaffold
      backHref={backHref}
      title={title}
      eyebrow={eyebrow}
      subtitle={subtitle}
      headerActions={headerActions}
      stage={stage}
      sidebar={sidebar}
      desktopColumnsClassName={desktopColumnsClassName}
      stretchSidebarToStage={stretchSidebarToStage}
    >
      {children}
    </VideoPlaybackScaffold>
  );
}
