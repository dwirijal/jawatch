import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import type { MovieCardItem } from '@/lib/types';

type SeriesRailEpisode = {
  slug: string;
  label: string;
  title: string;
  number: number | null;
};

interface SeriesWatchRailProps {
  seriesSlug: string;
  currentEpisodeSlug: string;
  playlist: SeriesRailEpisode[];
  prevEpisodeSlug: string | null;
  nextEpisodeSlug: string | null;
}

function sliceAroundIndex<T>(items: T[], activeIndex: number, radius: number): T[] {
  if (items.length <= radius * 2 + 1) {
    return items;
  }

  const safeIndex = Math.min(Math.max(activeIndex, 0), items.length - 1);
  const start = Math.max(0, safeIndex - radius);
  const end = Math.min(items.length, safeIndex + radius + 1);

  if (end - start >= radius * 2 + 1) {
    return items.slice(start, end);
  }

  if (start === 0) {
    return items.slice(0, Math.min(items.length, radius * 2 + 1));
  }

  return items.slice(Math.max(0, items.length - (radius * 2 + 1)));
}

export function SeriesWatchRail({
  seriesSlug,
  currentEpisodeSlug,
  playlist,
  prevEpisodeSlug,
  nextEpisodeSlug,
}: SeriesWatchRailProps) {
  const activeIndex = playlist.findIndex((item) => item.slug === currentEpisodeSlug);
  const visibleEpisodes = sliceAroundIndex(playlist, activeIndex, 5);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Rak episode</p>
        <h2 className="text-xl font-black tracking-tight text-foreground">Pilih episode</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Episode sebelumnya dan berikutnya tetap dekat supaya maraton tidak putus.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {prevEpisodeSlug ? (
          <Link
            href={`/series/${seriesSlug}/episodes/${prevEpisodeSlug}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border-strong px-4 text-xs font-bold text-foreground transition hover:bg-surface-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle px-4 text-xs font-bold text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </span>
        )}

        {nextEpisodeSlug ? (
          <Link
            href={`/series/${seriesSlug}/episodes/${nextEpisodeSlug}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border-strong px-4 text-xs font-bold text-foreground transition hover:bg-surface-1"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle px-4 text-xs font-bold text-muted-foreground">
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="space-y-2 border-t border-border-subtle/70 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Lompat cepat</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{playlist.length} episode</Badge>
            <Link
              href={`/series/${seriesSlug}?tab=episodes`}
              className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
            >
              Lihat semua
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {visibleEpisodes.map((episode) => {
            const isActive = episode.slug === currentEpisodeSlug;

            return isActive ? (
              <span
                key={episode.slug}
                className="inline-flex min-h-11 cursor-default items-center justify-center rounded-[var(--radius-sm)] bg-foreground px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-background"
              >
                {episode.label}
              </span>
            ) : (
              <Link
                key={episode.slug}
                href={`/series/${seriesSlug}/episodes/${episode.slug}`}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-foreground transition hover:bg-surface-2',
                  'focus-tv'
                )}
              >
                {episode.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MovieRelatedRailProps {
  items: MovieCardItem[];
}

export function MovieRelatedRail({ items }: MovieRelatedRailProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Mirip ini</p>
        <h2 className="text-xl font-black tracking-tight text-foreground">Nonton berikutnya</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Rekomendasi tetap dekat tanpa mengganggu area pemutar.
        </p>
      </div>

      <div className="space-y-3 border-t border-border-subtle/70 pt-4">
        <div className="flex gap-3 overflow-x-auto pb-1 xl:hidden">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.slug}
              href={`/movies/${item.slug}`}
              className="group min-w-[11rem] flex-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-1 p-2.5 transition hover:bg-surface-elevated"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2">
                  {item.poster ? (
                    <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-foreground">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {item.year ? <span>{item.year}</span> : null}
                    {item.rating ? <span>{item.rating}</span> : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden space-y-3 xl:block">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.slug}
              href={`/movies/${item.slug}`}
              className="group flex items-center gap-3 rounded-[var(--radius-sm)] p-2 transition hover:bg-surface-1"
            >
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2">
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    sizes="56px"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="line-clamp-2 text-sm font-bold leading-5 text-foreground">{item.title}</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {item.year ? <span>{item.year}</span> : null}
                  {item.rating ? <span>{item.rating}</span> : null}
                </div>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
