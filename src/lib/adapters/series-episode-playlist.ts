import { collapseCanonicalEpisodeEntries } from './series-canonical-utils.ts';
import { buildSeriesEpisodeHref } from '../series-episode-paths.ts';

type SeriesEpisodePlaylistEntry = {
  canonical_unit_key?: string | null;
  label: string;
  title: string;
  number: number | null;
};

type SeriesEpisodeRailItem = {
  slug: string;
  href: string;
  label: string;
  title: string;
  number: number | null;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildPublicSeriesEpisodeSlug({
  seriesSlug,
  episodeSlug,
  label,
  title,
  number,
}: {
  seriesSlug: string;
  episodeSlug: string;
  label?: string | null;
  title?: string | null;
  number?: number | null;
}): string {
  const normalizedSeriesSlug = normalizeText(seriesSlug);
  const normalizedEpisodeSlug = normalizeText(episodeSlug);

  if (normalizedEpisodeSlug && !normalizedEpisodeSlug.includes(':') && normalizedEpisodeSlug.startsWith(`${normalizedSeriesSlug}-`)) {
    return normalizedEpisodeSlug;
  }

  if (number != null && Number.isFinite(number)) {
    return `${normalizedSeriesSlug}-episode-${String(number)}`;
  }

  const labelSlug = slugify(normalizeText(label) || normalizeText(title));
  if (labelSlug) {
    return `${normalizedSeriesSlug}-${labelSlug}`;
  }

  return normalizedEpisodeSlug || normalizedSeriesSlug;
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

function toRailItem(seriesSlug: string, entry: SeriesEpisodePlaylistEntry): SeriesEpisodeRailItem {
  return {
    slug: buildPublicSeriesEpisodeSlug({
      seriesSlug,
      episodeSlug: '',
      label: entry.label,
      title: entry.title,
      number: entry.number,
    }),
    href: buildSeriesEpisodeHref({
      seriesSlug,
      episodeSlug: buildPublicSeriesEpisodeSlug({
        seriesSlug,
        episodeSlug: '',
        label: entry.label,
        title: entry.title,
        number: entry.number,
      }),
      label: entry.label,
      title: entry.title,
      number: entry.number,
    }),
    label: entry.label,
    title: entry.title,
    number: entry.number,
  };
}

export function buildSeriesEpisodeRailState({
  entries,
  currentCanonicalUnitKey,
  seriesSlug,
  radius = 5,
}: {
  entries: SeriesEpisodePlaylistEntry[];
  currentCanonicalUnitKey: string;
  seriesSlug: string;
  radius?: number;
}): {
  playlist: SeriesEpisodeRailItem[];
  playlistTotal: number;
  prevEpisodeHref: string | null;
  nextEpisodeHref: string | null;
  prevEpisodeSlug: string | null;
  nextEpisodeSlug: string | null;
} {
  const collapsedEntries = collapseCanonicalEpisodeEntries(entries);
  const playlistTotal = collapsedEntries.length;
  const activeIndex = collapsedEntries.findIndex(
    (entry) => normalizeText(entry.canonical_unit_key) === normalizeText(currentCanonicalUnitKey),
  );
  const visibleEntries = sliceAroundIndex(collapsedEntries, activeIndex, radius);
  const prevEntry = activeIndex >= 0 ? collapsedEntries[activeIndex + 1] ?? null : null;
  const nextEntry = activeIndex > 0 ? collapsedEntries[activeIndex - 1] ?? null : null;

  return {
    playlist: visibleEntries.map((entry) => toRailItem(seriesSlug, entry)),
    playlistTotal,
    prevEpisodeHref: prevEntry ? toRailItem(seriesSlug, prevEntry).href : null,
    nextEpisodeHref: nextEntry ? toRailItem(seriesSlug, nextEntry).href : null,
    prevEpisodeSlug: prevEntry ? toRailItem(seriesSlug, prevEntry).slug : null,
    nextEpisodeSlug: nextEntry ? toRailItem(seriesSlug, nextEntry).slug : null,
  };
}
