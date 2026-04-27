'use client';

import * as React from 'react';
import { Clapperboard, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  resolveCompactWatchSurfaceSections,
  resolveWatchSurfaceLayout,
  type WatchSurfaceKind,
} from '@/lib/watch-surface';
import { useUIStore } from '@/store/useUIStore';

interface WatchModeSurfaceProps {
  kind: Exclude<WatchSurfaceKind, 'shorts'>;
  header: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  headerActions?: React.ReactNode;
  stage: React.ReactNode;
  body?: React.ReactNode;
  rail?: React.ReactNode;
}

export function WatchModeSurface({
  kind,
  header,
  breadcrumbs,
  headerActions,
  stage,
  body,
  rail,
}: WatchModeSurfaceProps) {
  const isTheaterMode = useUIStore((state) => state.isTheaterMode);
  const setTheaterMode = useUIStore((state) => state.setTheaterMode);
  const setNavbarHidden = useUIStore((state) => state.setNavbarHidden);
  const setFooterHidden = useUIStore((state) => state.setFooterHidden);
  const layout = resolveWatchSurfaceLayout({ kind, isTheatrical: isTheaterMode });
  const compactSections = resolveCompactWatchSurfaceSections({
    hasBody: Boolean(body),
    hasRail: Boolean(rail),
  });

  React.useEffect(() => {
    setTheaterMode(false);
    return () => {
      setTheaterMode(false);
      setNavbarHidden(false);
      setFooterHidden(false);
    };
  }, [setFooterHidden, setNavbarHidden, setTheaterMode]);

  React.useEffect(() => {
    const hidden = layout.effectiveMode === 'theatrical';
    setNavbarHidden(hidden);
    setFooterHidden(hidden);
  }, [layout.effectiveMode, setFooterHidden, setNavbarHidden]);

  const modeSwitch = layout.allowModeSwitch ? (
    <div
      className="inline-flex items-center gap-[var(--space-2xs)] rounded-full border border-border-subtle bg-surface-1 p-[var(--space-2xs)]"
      data-watch-mode-switch
    >
      <button
        type="button"
        onClick={() => setTheaterMode(false)}
        aria-pressed={layout.effectiveMode === 'default'}
        className={cn(
          'inline-flex cursor-pointer items-center gap-[var(--space-xs)] rounded-full px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] transition',
          layout.effectiveMode === 'default'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
        )}
      >
        <MonitorPlay className="h-3.5 w-3.5" />
        Default
      </button>
      <button
        type="button"
        onClick={() => setTheaterMode(true)}
        aria-pressed={layout.effectiveMode === 'theatrical'}
        className={cn(
          'inline-flex cursor-pointer items-center gap-[var(--space-xs)] rounded-full px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] transition',
          layout.effectiveMode === 'theatrical'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
        )}
      >
        <Clapperboard className="h-3.5 w-3.5" />
        Theatrical
      </button>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        'w-full transition-colors duration-300',
        layout.effectiveMode === 'theatrical' && 'bg-surface-2 md:-mt-[5.25rem]'
      )}
      data-watch-kind={kind}
      data-watch-mode={layout.effectiveMode}
    >
      <div className="mx-auto flex w-[min(var(--layout-max-immersive),calc(100%-var(--layout-pad)*2))] flex-col gap-[var(--space-xl)] py-[var(--space-md)] md:gap-8 md:py-6">
        {breadcrumbs}
        <section className="flex flex-col gap-[var(--space-md)] border-b border-border-subtle/80 pb-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="flex flex-wrap items-center gap-[var(--space-xs)] md:justify-end">
            {headerActions}
            {modeSwitch}
          </div>
        </section>

        {layout.showRail ? (
          <>
            <section className="flex flex-col gap-[var(--space-xl)] xl:hidden">
              {compactSections.map((section) => {
                if (section.id === 'stage') {
                  return (
                    <div key={section.id} className="min-w-0 space-y-6">
                      {stage}
                    </div>
                  );
                }

                if (section.id === 'body' && body) {
                  return (
                    <div
                      key={section.id}
                      className={cn('min-w-0 space-y-6', section.bordered && 'border-t border-border-subtle/70 pt-5')}
                    >
                      {body}
                    </div>
                  );
                }

                if (section.id === 'rail' && rail) {
                  return (
                    <div
                      key={section.id}
                      className={cn('min-w-0', section.bordered && 'border-t border-border-subtle/70 pt-5')}
                    >
                      {rail}
                    </div>
                  );
                }

                return null;
              })}
            </section>

            <section
              className={cn(
                'hidden gap-[var(--space-xl)] xl:grid xl:grid-cols-[minmax(0,1.45fr)_22rem] xl:gap-8',
                !rail && 'xl:grid-cols-1'
              )}
            >
              <div className="min-w-0 space-y-6">
                {stage}
                {body}
              </div>
              {rail ? (
                <aside className="min-w-0 border-l border-border-subtle/70 pl-6">
                  {rail}
                </aside>
              ) : null}
            </section>
          </>
        ) : (
          <>
            <section className="min-w-0">{stage}</section>
            {(body || rail) ? (
              <section
                className={cn(
                  'grid gap-[var(--space-xl)] border-t border-border-subtle/80 pt-5 xl:grid-cols-[minmax(0,1.45fr)_22rem] xl:gap-8',
                  !rail && 'grid-cols-1'
                )}
              >
                {body ? <div className="min-w-0 space-y-6">{body}</div> : <div />}
                {rail ? (
                  <aside className="min-w-0 border-t border-border-subtle/70 pt-5 xl:border-l xl:border-t-0 xl:pt-0 xl:pl-6">
                    {rail}
                  </aside>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
