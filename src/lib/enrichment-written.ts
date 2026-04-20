import 'server-only';

import {
  ENRICHMENT_CACHE_TTL,
  fetchJson,
  GOOGLE_BOOKS_SEARCH_URL,
  OPEN_LIBRARY_SEARCH_URL,
  scoreTitleSimilarity,
  type WrittenMetadata,
  withRuntimeCache,
} from './enrichment-shared.ts';

function normalizeGoogleBooksCover(url: string): string {
  if (!url) {
    return '';
  }
  return url.replace(/^http:\/\//i, 'https://').replace(/&zoom=\d+/i, '&zoom=2');
}

function normalizeOpenLibraryCover(coverId: unknown): string {
  const id = typeof coverId === 'number' ? coverId : Number(coverId);
  if (!Number.isFinite(id) || id <= 0) {
    return '';
  }
  return `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
}

function pickBestWrittenMetadata(title: string, options: Array<WrittenMetadata | null>): WrittenMetadata | null {
  const ranked = options
    .map((option) => ({
      option,
      score: scoreTitleSimilarity(title, option?.title),
    }))
    .filter((entry) => entry.option && entry.score >= 0.72)
    .sort((left, right) => right.score - left.score);

  const best = ranked[0]?.option;
  if (!best) {
    return null;
  }

  const fallback = ranked.find((entry) => entry.option !== best)?.option || null;

  return {
    title: best.title,
    cover: best.cover || fallback?.cover,
    description: best.description || fallback?.description,
    authors: (best.authors && best.authors.length > 0 ? best.authors : fallback?.authors) || [],
    source: best.source,
  };
}

async function fetchOpenLibraryMetadata(title: string): Promise<WrittenMetadata | null> {
  try {
    const data = await fetchJson<{
      docs?: Array<Record<string, unknown>>;
    }>(`${OPEN_LIBRARY_SEARCH_URL}?title=${encodeURIComponent(title)}&limit=1`);

    const item = data.docs?.[0];
    if (!item) {
      return null;
    }

    const authors = Array.isArray(item.author_name)
      ? item.author_name.filter((author): author is string => typeof author === 'string')
      : [];

    return {
      title: typeof item.title === 'string' ? item.title : undefined,
      cover: normalizeOpenLibraryCover(item.cover_i),
      description: typeof item.first_sentence === 'string' ? item.first_sentence : undefined,
      authors,
      source: 'open-library',
    };
  } catch {
    return null;
  }
}

async function fetchGoogleBooksMetadata(title: string): Promise<WrittenMetadata | null> {
  try {
    const data = await fetchJson<{
      items?: Array<{
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
          };
        };
      }>;
    }>(`${GOOGLE_BOOKS_SEARCH_URL}?q=${encodeURIComponent(title)}&maxResults=1&printType=books`);

    const item = data.items?.[0]?.volumeInfo;
    if (!item) {
      return null;
    }

    return {
      title: item.title,
      cover: normalizeGoogleBooksCover(item.imageLinks?.thumbnail || item.imageLinks?.smallThumbnail || ''),
      description: item.description,
      authors: Array.isArray(item.authors) ? item.authors : [],
      source: 'google-books',
    };
  } catch {
    return null;
  }
}

export async function getWrittenMetadata(title: string): Promise<WrittenMetadata | null> {
  const normalizedTitle = title.trim().toLowerCase();
  return withRuntimeCache(`written:${normalizedTitle}`, ENRICHMENT_CACHE_TTL.long, async () => {
    const [googleBooksResult, openLibraryResult] = await Promise.allSettled([
      fetchGoogleBooksMetadata(title),
      fetchOpenLibraryMetadata(title),
    ]);

    const google = googleBooksResult.status === 'fulfilled' ? googleBooksResult.value : null;
    const openLibrary = openLibraryResult.status === 'fulfilled' ? openLibraryResult.value : null;

    const best = pickBestWrittenMetadata(title, [google, openLibrary]);
    if (!best) {
      return null;
    }

    return best;
  });
}
