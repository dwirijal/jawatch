import type { APIRequestContext } from '@playwright/test';

export type ComicFixture = {
  slug: string;
  chapterHref: string | null;
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function extractSlugFromHref(value: unknown): string {
  const href = readString(value);
  if (!href) {
    return '';
  }

  const segments = href.split('/').filter(Boolean);
  const comicsIndex = segments.lastIndexOf('comics');
  if (comicsIndex >= 0) {
    return segments[comicsIndex + 1] || '';
  }

  return segments.at(-1) || '';
}

function normalizeHref(value: unknown): string {
  const href = readString(value);
  if (!href) {
    return '';
  }

  try {
    return new URL(href).pathname;
  } catch {
    return href.startsWith('/') ? href : `/${href}`;
  }
}

export async function findComicFixture(request: APIRequestContext): Promise<ComicFixture | null> {
  const latestResponse = await request.get('/api/comic/latest?limit=20');
  if (!latestResponse.ok()) {
    return null;
  }

  const latestPayload = readRecord(await latestResponse.json().catch(() => null));
  const comics = Array.isArray(latestPayload.comics) ? latestPayload.comics : [];

  for (const item of comics) {
    const record = readRecord(item);
    const slug = readString(record.slug) || extractSlugFromHref(record.link);
    if (!slug) {
      continue;
    }

    const titleResponse = await request.get(`/api/comic/title/${slug}`);
    if (!titleResponse.ok()) {
      continue;
    }

    const titlePayload = readRecord(await titleResponse.json().catch(() => null));
    const chapters = Array.isArray(titlePayload.chapters) ? titlePayload.chapters : [];
    const chapter = chapters.map(readRecord).find((candidate) => readString(candidate.link));

    return {
      slug,
      chapterHref: chapter ? normalizeHref(chapter.link) : null,
    };
  }

  return null;
}
