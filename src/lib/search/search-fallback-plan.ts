import type { SearchDomain, SearchIndexDocument, SearchRouteType } from './search-contract';

const ALL_SEARCH_ROUTE_TYPES: SearchRouteType[] = ['series', 'movies', 'comic'];

export type SearchFallbackPhase = {
  routeTypes: SearchRouteType[];
  limit: number;
};

type SearchFallbackRunner = (
  routeType: SearchRouteType,
  limit: number,
) => Promise<SearchIndexDocument[]>;

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 1;
  }

  return Math.max(1, Math.trunc(limit));
}

export function planUnifiedSearchFallbackPhases(input: {
  domain: SearchDomain;
  limit: number;
  indexedDocuments: Array<Pick<SearchIndexDocument, 'routeType'>>;
}): SearchFallbackPhase[] {
  const normalizedLimit = normalizeLimit(input.limit);
  if (input.domain !== 'all') {
    return [{ routeTypes: [input.domain], limit: Math.max(normalizedLimit, 8) }];
  }

  const missingSlots = Math.max(1, normalizedLimit - input.indexedDocuments.length);
  const coveredRouteTypes = new Set(input.indexedDocuments.map((document) => document.routeType));
  const missingRouteTypes = ALL_SEARCH_ROUTE_TYPES.filter((routeType) => !coveredRouteTypes.has(routeType));
  const existingRouteTypes = ALL_SEARCH_ROUTE_TYPES.filter((routeType) => coveredRouteTypes.has(routeType));
  const phases: SearchFallbackPhase[] = [];

  if (missingRouteTypes.length > 0) {
    phases.push({ routeTypes: missingRouteTypes, limit: missingSlots });
  }

  if (existingRouteTypes.length > 0) {
    phases.push({ routeTypes: existingRouteTypes, limit: missingSlots });
  }

  return phases;
}

export async function executePlannedSearchFallback(input: {
  phases: SearchFallbackPhase[];
  targetCount: number;
  runSearch: SearchFallbackRunner;
}): Promise<SearchIndexDocument[]> {
  const normalizedTargetCount = normalizeLimit(input.targetCount);
  const collectedDocuments: SearchIndexDocument[] = [];
  const seenDocumentIds = new Set<string>();

  for (const phase of input.phases) {
    const remainingCount = normalizedTargetCount - collectedDocuments.length;
    if (remainingCount <= 0) {
      break;
    }

    const phaseLimit = Math.min(normalizeLimit(phase.limit), remainingCount);
    const phaseResults = await Promise.all(
      phase.routeTypes.map((routeType) => input.runSearch(routeType, phaseLimit)),
    );

    for (const documents of phaseResults) {
      for (const document of documents) {
        if (seenDocumentIds.has(document.id)) {
          continue;
        }

        seenDocumentIds.add(document.id);
        collectedDocuments.push(document);

        if (collectedDocuments.length >= normalizedTargetCount) {
          return collectedDocuments;
        }
      }
    }
  }

  return collectedDocuments;
}
