import type { SeriesMediaType } from './series-presentation';

const DRAMA_SOURCES = new Set(['drakorid', 'dracinly', 'dramabox']);

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function resolveSeriesMediaType({
  originType,
  mediaType,
  source,
}: {
  originType?: string | null;
  mediaType?: string | null;
  source?: string | null;
}): SeriesMediaType {
  const origin = normalize(originType);
  if (origin === 'donghua' || origin === 'drama' || origin === 'anime') {
    return origin;
  }

  const normalizedSource = normalize(source);
  if (normalizedSource === 'anichin') {
    return 'donghua';
  }
  if (DRAMA_SOURCES.has(normalizedSource)) {
    return 'drama';
  }

  return normalize(mediaType) === 'drama' ? 'drama' : 'anime';
}
