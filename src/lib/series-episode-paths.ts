function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumericText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, '');
  }

  const text = readText(value);
  if (!text) {
    return '';
  }

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return text.replace(/\.0+$/, '');
  }

  return '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type SeriesEpisodePathInput = {
  seriesSlug: string;
  episodeSlug?: string | null;
  label?: string | null;
  title?: string | null;
  number?: string | number | null;
};

export function parseSeriesEpisodeNumberParam(value: string): number | null {
  const normalized = readText(value);
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildSeriesEpisodeSpecialSegment({
  seriesSlug,
  episodeSlug,
  label,
  title,
  number,
}: SeriesEpisodePathInput): string {
  const numericText = readNumericText(number);
  if (numericText) {
    return numericText;
  }

  const normalizedSeriesSlug = readText(seriesSlug);
  const normalizedEpisodeSlug = readText(episodeSlug);
  const repeatedPrefix = normalizedSeriesSlug ? `${normalizedSeriesSlug}-` : '';

  if (normalizedEpisodeSlug) {
    if (repeatedPrefix && normalizedEpisodeSlug.startsWith(repeatedPrefix)) {
      const trimmed = normalizedEpisodeSlug.slice(repeatedPrefix.length);
      if (trimmed) {
        return trimmed;
      }
    }

    return normalizedEpisodeSlug;
  }

  const labelSlug = slugify(readText(label) || readText(title));
  return labelSlug || 'special';
}

export function buildSeriesEpisodeHref(input: SeriesEpisodePathInput): string {
  const seriesSlug = readText(input.seriesSlug);
  const numericText = readNumericText(input.number);

  if (numericText) {
    return `/series/${seriesSlug}/ep/${numericText}`;
  }

  return `/series/${seriesSlug}/special/${buildSeriesEpisodeSpecialSegment(input)}`;
}
