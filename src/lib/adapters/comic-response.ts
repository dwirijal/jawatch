import type { MangaSearchResult } from '@/lib/types';

type JsonRecord = Record<string, unknown>;

export type ComicListPayload = {
  comics: MangaSearchResult[];
};

export type ComicSearchPayload = {
  data: MangaSearchResult[];
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readComicItems(value: unknown): MangaSearchResult[] {
  if (Array.isArray(value)) {
    return value as MangaSearchResult[];
  }

  if (!isRecord(value)) {
    return [];
  }

  if ('comics' in value) {
    return readComicItems(value.comics);
  }

  if ('data' in value) {
    return readComicItems(value.data);
  }

  return [];
}

export function normalizeComicListPayload(value: unknown): ComicListPayload {
  return {
    comics: readComicItems(value),
  };
}

export function normalizeComicSearchPayload(value: unknown): ComicSearchPayload {
  return {
    data: readComicItems(value),
  };
}

export function shouldRewriteNormalizedComicPayload(value: unknown): boolean {
  if (Array.isArray(value)) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return isRecord(value.comics) || isRecord(value.data);
}
