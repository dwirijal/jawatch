type ComicChapterRouteInput = {
  slug?: string | null;
  number?: string | number | null;
};

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeChapterNumber(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, '');
  }

  const text = readText(value);
  if (!text) {
    return null;
  }

  const normalized = text.replace(/\.0+$/, '');
  return /^\d+(?:[.-]\d+)?$/.test(normalized) ? normalized : null;
}

export function extractComicChapterNumber(value: string | null | undefined): string | null {
  const text = readText(value);
  if (!text) {
    return null;
  }

  const matches = [...text.matchAll(/(?:^|-)chapter-(\d+(?:[.-]\d+)?)(?=$|-)/gi)];
  const latest = matches.at(-1)?.[1];
  return normalizeChapterNumber(latest);
}

export function buildComicChapterSlugFromNumber(comicSlug: string, chapterNumber: string | number): string {
  const number = normalizeChapterNumber(chapterNumber);
  return `${comicSlug}-chapter-${number || readText(chapterNumber)}`;
}

export function buildComicChapterFallbackHref(comicSlug: string, chapterSlug: string): string {
  return `/comics/${comicSlug}/chapter/${chapterSlug}`;
}

export function buildComicChapterHref(comicSlug: string, chapter: ComicChapterRouteInput): string {
  const number = normalizeChapterNumber(chapter.number) ?? extractComicChapterNumber(chapter.slug);
  if (number) {
    return `/comics/${comicSlug}/ch/${number}`;
  }

  return buildComicChapterFallbackHref(comicSlug, readText(chapter.slug));
}
