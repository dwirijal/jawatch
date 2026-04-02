import { Paper } from '@/components/atoms/Paper';
import { Skeleton } from '@/components/atoms/Skeleton';
import { SplitLayout } from '@/components/atoms/SplitLayout';

export function SeriesWatchPageSkeleton() {
  return (
    <div className="app-shell bg-background text-white">
      <header className="sticky top-0 z-[160] border-b border-border-subtle bg-background/85 backdrop-blur-xl">
        <div className="app-container-immersive flex items-center justify-between gap-4 py-2.5 md:py-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)]" />
            <div className="min-w-0 min-h-[2.75rem] space-y-1 md:min-h-[3rem]">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-5 w-52 max-w-full rounded-full" />
              <div className="flex min-h-4 flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-28 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="hidden h-8 w-28 rounded-[var(--radius-sm)] md:block" />
        </div>
      </header>

      <main className="app-container-immersive app-section-stack py-4 md:py-5">
        <SplitLayout
          breakpoint="xl"
          desktopColumnsClassName="xl:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] xl:grid-rows-1"
          className="items-stretch gap-6 xl:gap-8"
          stage={
            <div className="space-y-5">
              <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
                <div className="relative aspect-video w-full bg-surface-2">
                  <Skeleton className="h-full w-full rounded-none" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 py-4">
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-200">
                      Menyiapkan Episode...
                    </p>
                  </div>
                </div>
              </Paper>

              <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-[var(--radius-sm)]" />
                  <Skeleton className="h-4 w-28 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-28 rounded-[var(--radius-sm)]" />
                  ))}
                </div>
              </Paper>
            </div>
          }
          gallery={
            <div className="space-y-5 xl:h-full xl:sticky xl:top-5">
              <Paper tone="muted" shadow="sm" className="space-y-4 p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-7 w-4/5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-5/6 rounded-full" />
                  <Skeleton className="h-4 w-3/5 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 w-full rounded-[var(--radius-sm)]" />
                  <Skeleton className="h-10 w-full rounded-[var(--radius-sm)]" />
                </div>
              </Paper>
            </div>
          }
        />

        <div className="app-section-stack">
          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <Skeleton className="h-5 w-36 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-[var(--radius-sm)]" />
              <Skeleton className="h-10 w-full rounded-[var(--radius-sm)]" />
              <Skeleton className="h-10 w-full rounded-[var(--radius-sm)]" />
            </div>
          </Paper>
          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <Skeleton className="h-5 w-32 rounded-full" />
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
              <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
            </div>
          </Paper>
        </div>
      </main>
    </div>
  );
}
