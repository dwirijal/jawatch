import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

const HOTLINK_PROTECTED_COMIC_HOSTS = new Set([
  'bacaman00.sokuja.id',
]);

function inferComicSubtype(item: Pick<MangaSearchResult, 'type' | 'subtype'>): MangaSubtype {
  const subtype = item.subtype?.toLowerCase() ?? '';
  if (subtype === 'manhwa' || subtype === 'manhua' || subtype === 'manga') {
    return subtype;
  }

  const type = item.type?.toLowerCase() ?? '';
  if (type.includes('manhwa')) return 'manhwa';
  if (type.includes('manhua')) return 'manhua';
  return 'manga';
}

export function normalizeComicImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) {
    return normalizeComicImageUrl(`https:${trimmed}`);
  }
  if (trimmed.startsWith('http://')) {
    return normalizeComicImageUrl(trimmed.replace(/^http:\/\//i, 'https://'));
  }
  if (trimmed.startsWith('/')) return trimmed;

  const normalized = trimmed.split('?')[0] ?? '';

  try {
    const parsed = new URL(normalized);
    if (HOTLINK_PROTECTED_COMIC_HOSTS.has(parsed.hostname)) {
      return `/api/comic/image?url=${encodeURIComponent(parsed.toString())}`;
    }
  } catch {
    return normalized;
  }

  return normalized;
}

export function pickSubtypePosterImage(
  primaryItems: Array<Pick<MangaSearchResult, 'image' | 'type' | 'subtype'>>,
  fallbackItems: Array<Pick<MangaSearchResult, 'image' | 'type' | 'subtype'>>,
  subtype: MangaSubtype,
): string {
  for (const collection of [primaryItems, fallbackItems]) {
    const match = collection.find((item) => inferComicSubtype(item) === subtype && normalizeComicImageUrl(item.image));
    if (match) {
      return normalizeComicImageUrl(match.image);
    }
  }

  return '';
}
