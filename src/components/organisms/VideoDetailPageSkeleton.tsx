import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { Skeleton } from '@/components/atoms/Skeleton';
import { SplitLayout } from '@/components/atoms/SplitLayout';
import { getMediaPosterAspectClass, ThemeType } from '@/lib/utils';

interface VideoDetailPageSkeletonProps {
  theme: Extract<ThemeType, 'anime' | 'donghua' | 'movie' | 'drama'>;
  backLabel: string;
}

export function VideoDetailPageSkeleton({ theme, backLabel }: VideoDetailPageSkeletonProps) {
  const posterAspectClass = getMediaPosterAspectClass(theme);

  return (
    <div className="app-shell" data-theme={theme} data-view-mode="comfortable">
      <div className="app-container-wide flex flex-col gap-12 pb-6 pt-8 md:gap-16">
        <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_30%)]" />
          <div className="relative z-10 px-5 py-5 md:px-7 md:py-7">
            <nav className="mb-6">
              <Button variant="outline" size="sm" disabled className="rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 text-zinc-300">
                {backLabel}
              </Button>
            </nav>

            <SplitLayout
              mobileGoldenRows
              breakpoint="lg"
              className="items-end gap-6"
              stage={
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-28 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-12 max-w-2xl rounded-xl" />
                    <Skeleton className="h-5 w-80 max-w-full rounded-lg" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Skeleton className="h-12 w-44 rounded-[var(--radius-lg)]" />
                    <Skeleton className="h-12 w-32 rounded-[var(--radius-lg)]" />
                  </div>
                </div>
              }
              gallery={
                <div className="space-y-3.5">
                  <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
                    <div className={`mx-auto w-40 md:w-48 ${posterAspectClass}`}>
                      <Skeleton className="h-full w-full rounded-none" />
                    </div>
                  </Paper>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Paper key={index} tone="muted" shadow="sm" className="space-y-2 px-3.5 py-3">
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-lg" />
                      </Paper>
                    ))}
                  </div>
                </div>
              }
            />
          </div>
        </section>

        <SplitLayout
          breakpoint="xl"
          className="items-start gap-12 xl:gap-16"
          stage={
            <div className="space-y-8">
              <section className="space-y-5">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Paper tone="muted" shadow="sm" className="space-y-3 p-5 md:p-6">
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-4/5 rounded-full" />
                  <Skeleton className="h-4 w-3/5 rounded-full" />
                </Paper>
              </section>
              <section className="space-y-5">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <div className="media-grid" data-grid-density="default">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Paper key={index} tone="muted" shadow="sm" padded={false} className="overflow-hidden">
                      <Skeleton className={`${posterAspectClass} w-full rounded-none`} />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-5/6 rounded-full" />
                        <Skeleton className="h-3 w-2/3 rounded-full" />
                      </div>
                    </Paper>
                  ))}
                </div>
              </section>
            </div>
          }
          gallery={
            <div className="space-y-5">
              <Paper tone="muted" shadow="sm" className="space-y-3 p-5 md:p-6">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-10 w-full rounded-[var(--radius-lg)]" />
              </Paper>
              <Paper tone="muted" shadow="sm" className="space-y-3 p-5 md:p-6">
                <Skeleton className="h-4 w-20 rounded-full" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-[var(--radius-lg)]" />
                ))}
              </Paper>
            </div>
          }
        />
      </div>
    </div>
  );
}
