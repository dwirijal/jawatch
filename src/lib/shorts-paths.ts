export const SHORTS_HUB_ENABLED = false;
export const SHORTS_HUB_HREF = SHORTS_HUB_ENABLED ? '/watch/shorts' : '/watch';
export const SHORTS_BACK_LABEL = SHORTS_HUB_ENABLED ? 'Kembali ke shorts' : 'Kembali ke nonton';

function normalizePathSegment(value: string): string {
  return value.trim();
}

function normalizeEpisodeIndex(value?: number | string): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return String(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return String(parsed);
    }
  }

  return '';
}

export function getShortsDetailHref(slug: string): string {
  return `/shorts/${normalizePathSegment(slug)}`;
}

export function getShortsEpisodeHref(slug: string, episodeSlug: string, episodeIndex?: number | string): string {
  const searchParams = new URLSearchParams();
  const normalizedIndex = normalizeEpisodeIndex(episodeIndex);

  if (normalizedIndex) {
    searchParams.set('index', normalizedIndex);
  }

  const serialized = searchParams.toString();
  const pathname = `/shorts/${normalizePathSegment(slug)}/episodes/${normalizePathSegment(episodeSlug)}`;
  return serialized ? `${pathname}?${serialized}` : pathname;
}
