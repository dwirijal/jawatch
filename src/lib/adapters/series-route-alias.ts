import {
  extractSeriesInstallmentHint,
  buildSeriesFranchiseSearchQuery,
  hasExplicitSeriesInstallmentLabel,
  readSeriesFamilyTokenPrefix,
  sharesSeriesFranchise,
} from '../series-franchise.ts';

export type SeriesRouteCandidate = {
  slug: string;
  title?: string | null;
};

function normalizeRouteSlug(value: string): string {
  return value.trim().toLowerCase();
}

function hasVolatileSeriesSuffix(value: string): boolean {
  return /-[a-f0-9]{8}$/.test(normalizeRouteSlug(value));
}

export function stripSeriesRouteVolatileSuffix(slug: string): string {
  return normalizeRouteSlug(slug).replace(/-[a-f0-9]{8}$/, '');
}

export function buildSeriesAliasSearchQuery(slug: string): string {
  return stripSeriesRouteVolatileSuffix(slug)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSeriesAliasSearchQueries(slug: string): string[] {
  const primary = buildSeriesAliasSearchQuery(slug);
  const franchise = buildSeriesFranchiseSearchQuery(primary);
  const scienceFutureFranchise = primary
    .replace(/\bscience future\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const installment = extractSeriesInstallmentHint(primary);
  const queries = new Set<string>();

  const addQuery = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (normalized.length >= 2) {
      queries.add(normalized);
    }
  };

  addQuery(primary);
  addQuery(franchise);
  addQuery(scienceFutureFranchise);

  const seasonPartMatch = installment.match(/^s(\d+)-p(\d+)$/);
  const canonicalFranchise = scienceFutureFranchise || franchise;
  if (seasonPartMatch && canonicalFranchise) {
    const [, season, part] = seasonPartMatch;
    addQuery(`${canonicalFranchise} season ${season}`);
    addQuery(`${canonicalFranchise} season ${season} part ${part}`);
  } else {
    const seasonMatch = installment.match(/^s(\d+)$/);
    if (seasonMatch && canonicalFranchise) {
      addQuery(`${canonicalFranchise} season ${seasonMatch[1]}`);
    }

    const partMatch = installment.match(/^p(\d+)$/);
    if (partMatch && canonicalFranchise) {
      addQuery(`${canonicalFranchise} part ${partMatch[1]}`);
    }
  }

  return [...queries];
}

export function resolveKnownSeriesRouteAlias(slug: string): string | null {
  const normalized = stripSeriesRouteVolatileSuffix(slug);
  const drStoneScienceFutureMatch = normalized.match(/^dr-stone-science-future(?:-part-(\d+))?$/);
  if (drStoneScienceFutureMatch) {
    return `dr-stone-season-4-part-${drStoneScienceFutureMatch[1] || '1'}`;
  }

  return null;
}

export function sharesSeriesRouteFamily(leftSlug: string, rightSlug: string): boolean {
  const leftBase = stripSeriesRouteVolatileSuffix(leftSlug);
  const rightBase = stripSeriesRouteVolatileSuffix(rightSlug);
  const leftPrefix = readSeriesFamilyTokenPrefix(leftBase.replace(/-/g, ' '));
  const rightPrefix = readSeriesFamilyTokenPrefix(rightBase.replace(/-/g, ' '));

  return leftBase === rightBase
    || leftBase.startsWith(`${rightBase}-`)
    || rightBase.startsWith(`${leftBase}-`)
    || (leftPrefix.length > 0 && leftPrefix === rightPrefix)
    || sharesSeriesFranchise(leftBase.replace(/-/g, ' '), rightBase.replace(/-/g, ' '));
}

function scoreSeriesRouteCandidate(requestedSlug: string, candidate: SeriesRouteCandidate): number {
  const requestedBase = stripSeriesRouteVolatileSuffix(requestedSlug);
  const candidateBase = stripSeriesRouteVolatileSuffix(candidate.slug);
  const requestedInstallment = extractSeriesInstallmentHint(requestedBase);
  const candidateInstallment = extractSeriesInstallmentHint(`${candidateBase} ${candidate.title || ''}`);
  let score = 0;

  if (candidateBase === requestedBase) {
    score += 200;
  }

  if (requestedInstallment && requestedInstallment === candidateInstallment) {
    score += 150;
  }

  if (!hasVolatileSeriesSuffix(candidate.slug)) {
    score += 40;
  }

  if (hasExplicitSeriesInstallmentLabel(candidate.title || '')) {
    score += 15;
  }

  if (sharesSeriesFranchise(requestedBase.replace(/-/g, ' '), candidate.title || candidateBase.replace(/-/g, ' '))) {
    score += 40;
  }

  score -= normalizeRouteSlug(candidate.slug).length / 1000;
  return score;
}

export function pickPreferredSeriesRouteCandidate(
  requestedSlug: string,
  candidates: SeriesRouteCandidate[],
): SeriesRouteCandidate | null {
  const familyCandidates = candidates.filter((candidate) => (
    sharesSeriesRouteFamily(requestedSlug, candidate.slug)
    || sharesSeriesFranchise(buildSeriesAliasSearchQuery(requestedSlug), candidate.title || candidate.slug)
  ));
  if (familyCandidates.length === 0) {
    return null;
  }

  const ranked = [...familyCandidates].sort((left, right) => {
    const scoreDiff = scoreSeriesRouteCandidate(requestedSlug, right) - scoreSeriesRouteCandidate(requestedSlug, left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return normalizeRouteSlug(left.slug).localeCompare(normalizeRouteSlug(right.slug));
  });

  return ranked[0] || null;
}
