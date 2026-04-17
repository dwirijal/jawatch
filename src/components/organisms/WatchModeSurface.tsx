'use client';

import * as React from 'react';
import { Clapperboard, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveWatchSurfaceLayout, type WatchSurfaceKind } from '@/lib/watch-surface';
import { useUIStore } from '@/store/useUIStore';

interface WatchModeSurfaceProps {
  kind: Exclude<WatchSurfaceKind, 'shorts'>;
  header: React.ReactNode;
  headerActions?: React.ReactNode;
  stage: React.ReactNode;
  body?: React.ReactNode;
  rail?: React.ReactNode;
}

export function WatchModeSurface({
  kind,
  header,
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
      className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 p-1"
      data-watch-mode-switch
    >
      <button
        type="button"
        onClick={() => setTheaterMode(false)}
        aria-pressed={layout.effectiveMode === 'default'}
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition',
          layout.effectiveMode === 'default'
            ? 'bg-foreground text-background'
            : 'text-zinc-500 hover:bg-surface-2 hover:text-foreground'
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
          'inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition',
          layout.effectiveMode === 'theatrical'
            ? 'bg-foreground text-background'
            : 'text-zinc-500 hover:bg-surface-2 hover:text-foreground'
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
        'app-shell bg-background text-foreground transition-colors duration-300',
        layout.effectiveMode === 'theatrical' && 'bg-[#f4f1ec]'
      )}
      data-watch-kind={kind}
      data-watch-mode={layout.effectiveMode}
    >
      <main className="mx-auto flex w-[min(var(--layout-max-immersive),calc(100%-var(--layout-pad)*2))] flex-col gap-6 py-4 md:gap-8 md:py-6">
        <section className="flex flex-col gap-4 border-b border-border-subtle/80 pb-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {headerActions}
            {modeSwitch}
          </div>
        </section>

        {layout.showRail ? (
          <>
            <section className="flex flex-col gap-6 xl:hidden">
              <div className="min-w-0 space-y-6">{stage}</div>
              {rail ? (
                <div className="min-w-0 border-t border-border-subtle/70 pt-5">
                  {rail}
                </div>
              ) : null}
              {body ? <div className="min-w-0 space-y-6 border-t border-border-subtle/70 pt-5">{body}</div> : null}
            </section>

            <section
              className={cn(
                'hidden gap-6 xl:grid xl:grid-cols-[minmax(0,1.45fr)_22rem] xl:gap-8',
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
                  'grid gap-6 border-t border-border-subtle/80 pt-5 xl:grid-cols-[minmax(0,1.45fr)_22rem] xl:gap-8',
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
      </main>
    </div>
  );
}
