import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';
import type { MovieCardItem } from '@/lib/types';

type SeriesRailEpisode = {
  slug: string;
  href: string;
  label: string;
  title: string;
  number: number | null;
};

interface SeriesWatchRailProps {
  currentEpisodeHref: string;
  seriesHref: string;
  playlist: SeriesRailEpisode[];
  playlistTotal: number;
  prevEpisodeHref: string | null;
  nextEpisodeHref: string | null;
}

export function SeriesWatchRail({
  currentEpisodeHref,
  seriesHref,
  playlist,
  playlistTotal,
  prevEpisodeHref,
  nextEpisodeHref,
}: SeriesWatchRailProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Rak episode</p>
        <h2 className="text-xl font-black tracking-[var(--type-tracking-normal)] text-foreground">Pilih episode</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Episode sebelumnya dan berikutnya tetap dekat supaya maraton tidak putus.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-xs)]">
        {prevEpisodeHref ? (
          <Link
            href={prevEpisodeHref}
            className="inline-flex h-[calc(var(--size-control-md)-var(--space-2xs))] items-center justify-center gap-[var(--space-xs)] rounded-[var(--radius-sm)] border border-border-strong px-[var(--space-md)] text-xs font-bold text-foreground transition hover:bg-surface-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Link>
        ) : (
          <span className="inline-flex h-[calc(var(--size-control-md)-var(--space-2xs))] items-center justify-center gap-[var(--space-xs)] rounded-[var(--radius-sm)] border border-border-subtle px-[var(--space-md)] text-xs font-bold text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </span>
        )}

        {nextEpisodeHref ? (
          <Link
            href={nextEpisodeHref}
            className="inline-flex h-[calc(var(--size-control-md)-var(--space-2xs))] items-center justify-center gap-[var(--space-xs)] rounded-[var(--radius-sm)] border border-border-strong px-[var(--space-md)] text-xs font-bold text-foreground transition hover:bg-surface-1"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-[calc(var(--size-control-md)-var(--space-2xs))] items-center justify-center gap-[var(--space-xs)] rounded-[var(--radius-sm)] border border-border-subtle px-[var(--space-md)] text-xs font-bold text-muted-foreground">
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="space-y-2 border-t border-border-subtle/70 pt-4">
        <div className="flex items-center justify-between gap-[var(--space-sm)]">
          <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Lompat cepat</p>
          <div className="flex items-center gap-[var(--space-xs)]">
            <Badge variant="outline">{playlistTotal} episode</Badge>
            <Link
              href={`${seriesHref}?tab=episodes`}
              className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground transition hover:text-foreground"
            >
              Lihat semua
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[var(--space-xs)]">
          {playlist.map((episode) => {
            const isActive = episode.href === currentEpisodeHref;

            return isActive ? (
              <span
                key={episode.slug}
                className="inline-flex min-h-11 cursor-default items-center justify-center rounded-[var(--radius-sm)] bg-foreground px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-background"
              >
                {episode.label}
              </span>
            ) : (
              <Link
                key={episode.slug}
                href={episode.href}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground transition hover:bg-surface-2',
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
        <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Mirip ini</p>
        <h2 className="text-xl font-black tracking-[var(--type-tracking-normal)] text-foreground">Nonton berikutnya</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Rekomendasi tetap dekat tanpa mengganggu area pemutar.
        </p>
      </div>

      <div className="space-y-3 border-t border-border-subtle/70 pt-4">
        <div className="flex gap-[var(--space-sm)] overflow-x-auto pb-1 xl:hidden">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.slug}
              href={`/movies/${item.slug}`}
              className="group min-w-[11rem] flex-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-1 p-2.5 transition hover:bg-surface-elevated"
            >
              <div className="flex items-center gap-[var(--space-sm)]">
                <div className="relative h-16 w-[var(--size-control-lg)] shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2">
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
                  <div className="flex flex-wrap items-center gap-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
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
              className="group flex items-center gap-[var(--space-sm)] rounded-[var(--radius-sm)] p-[var(--space-xs)] transition hover:bg-surface-1"
            >
              <div className="relative h-20 w-[calc(var(--size-control-lg)+var(--space-xs))] shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2">
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
                <div className="flex flex-wrap items-center gap-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
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
