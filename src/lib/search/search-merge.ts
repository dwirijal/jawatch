import type { SearchIndexDocument } from './search-contract';

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function readSubtitleYear(document: Pick<SearchIndexDocument, 'subtitle'>): string | null {
  const match = document.subtitle?.match(/\b(\d{4})\b/);
  return match?.[1] || null;
}

function sharesSearchDocumentFamily(
  left: Pick<SearchIndexDocument, 'routeType' | 'title' | 'subtitle'>,
  right: Pick<SearchIndexDocument, 'routeType' | 'title' | 'subtitle'>,
): boolean {
  if (left.routeType !== right.routeType || normalizeTitle(left.title) !== normalizeTitle(right.title)) {
    return false;
  }

  const leftYear = readSubtitleYear(left);
  const rightYear = readSubtitleYear(right);
  return !leftYear || !rightYear || leftYear === rightYear;
}

export function mergeSearchDocuments(
  indexedDocuments: SearchIndexDocument[],
  fallbackDocuments: SearchIndexDocument[],
  limit: number,
): SearchIndexDocument[] {
  const merged = [...indexedDocuments];

  for (const fallback of fallbackDocuments) {
    const duplicateIndex = merged.findIndex((indexed) =>
      indexed.id === fallback.id || sharesSearchDocumentFamily(indexed, fallback)
    );

    if (duplicateIndex >= 0) {
      merged.splice(duplicateIndex, 1, fallback);
      continue;
    }

    merged.push(fallback);
  }

  return merged.slice(0, Math.max(1, limit));
}
