import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
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

export function VideoPlaybackScaffold({
  backHref,
  title,
  eyebrow,
  subtitle,
  headerActions,
  stage,
  sidebar,
  desktopColumnsClassName,
  stretchSidebarToStage = false,
  children,
}: VideoPlaybackScaffoldProps) {
  return (
    <div className="app-shell bg-background text-white">
      <header className="sticky top-0 z-[160] border-b border-border-subtle bg-background/85 backdrop-blur-xl">
        <div className="app-container-immersive flex items-center justify-between gap-4 py-2.5 md:py-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Button variant="outline" size="icon" asChild className="shrink-0">
              <Link href={backHref}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0 min-h-[2.75rem] space-y-1 md:min-h-[3rem]">
              {eyebrow ? (
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="line-clamp-1 text-sm font-semibold tracking-tight text-white md:text-base">
                {title}
              </h1>
              {subtitle ? (
                <div className="flex min-h-4 flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>

          {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
        </div>
      </header>

      <main className="app-container-immersive app-section-stack py-4 md:py-5">
        <SplitLayout
          breakpoint="xl"
          desktopColumnsClassName={desktopColumnsClassName}
          className={cn(stretchSidebarToStage ? 'items-stretch' : 'items-start', 'gap-6 xl:gap-8')}
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
