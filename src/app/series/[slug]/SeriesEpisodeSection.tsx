import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { PendingLinkHint } from '@/components/atoms/PendingLinkHint';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import type { ThemeType } from '@/lib/utils';

type EpisodeSortMode = 'latest' | 'az';

interface EpisodeListItem {
  slug: string;
  title: string;
  label: string;
}

interface SeriesEpisodeSectionProps {
  seriesSlug: string;
  theme: Extract<ThemeType, 'anime' | 'donghua' | 'drama'>;
  episodeCount: number;
  currentPage: number;
  totalPages: number;
  episodeSort: EpisodeSortMode;
  episodes: EpisodeListItem[];
  pageStart: number;
  totalCount: number;
  latestSortHref: string;
  azSortHref: string;
  previousPageHref: string | null;
  nextPageHref: string | null;
}

export function SeriesEpisodeSection({
  seriesSlug,
  theme,
  episodeCount,
  currentPage,
  totalPages,
  episodeSort,
  episodes,
  pageStart,
  totalCount,
  latestSortHref,
  azSortHref,
  previousPageHref,
  nextPageHref,
}: SeriesEpisodeSectionProps) {
  return (
    <section id="episodes" className="space-y-8">
      <DetailSectionHeading
        title="Episodes"
        theme={theme}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{episodeCount} Tersedia</Badge>
            <Badge variant="outline">Halaman {currentPage} / {totalPages}</Badge>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {episodeSort === 'latest' ? (
          <Button type="button" variant={theme} size="sm" disabled>
            Terbaru
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={latestSortHref} prefetch={false}>
              Terbaru
              <PendingLinkHint label="Mengurutkan episode terbaru..." />
            </Link>
          </Button>
        )}
        {episodeSort === 'az' ? (
          <Button type="button" variant={theme} size="sm" disabled>
            A-Z
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={azSortHref} prefetch={false}>
              A-Z
              <PendingLinkHint label="Mengurutkan episode A-Z..." />
            </Link>
          </Button>
        )}

        <div className="min-h-5 pl-1 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500/80" />
            Klik episode untuk membuka player.
          </span>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {episodes.map((episode) => (
          <Button
            key={episode.slug}
            variant="outline"
            className="h-full min-h-24 w-full justify-start rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-4 py-4 text-left hover:bg-surface-elevated"
            asChild
          >
            <Link
              href={`/series/${seriesSlug}/episodes/${episode.slug}`}
              prefetch={false}
              className="relative flex h-full flex-col items-start justify-between gap-3"
            >
              <PendingLinkHint variant="badge" label={`Membuka ${episode.label}...`} />
              <span className="line-clamp-2 text-sm font-semibold text-white">
                {episode.title || episode.label}
              </span>
              <span className="text-xs text-zinc-400">{episode.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            Showing {pageStart + 1}-{Math.min(pageStart + episodes.length, totalCount)} of {totalCount} episodes
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!previousPageHref} asChild={Boolean(previousPageHref)}>
              {previousPageHref ? (
                <Link href={previousPageHref} prefetch={false}>
                  Previous
                  <PendingLinkHint label="Membuka halaman episode sebelumnya..." />
                </Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>
            <Button variant="outline" size="sm" disabled={!nextPageHref} asChild={Boolean(nextPageHref)}>
              {nextPageHref ? (
                <Link href={nextPageHref} prefetch={false}>
                  Next
                  <PendingLinkHint label="Membuka halaman episode berikutnya..." />
                </Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
