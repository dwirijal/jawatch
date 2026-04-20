export type MovieRouteCandidate = {
  slug: string;
  year?: string | null;
  hasPlayback?: boolean;
};

function normalizeRouteSlug(value: string): string {
  return value.trim().toLowerCase();
}

function extractSlugYear(slug: string): string | null {
  const match = normalizeRouteSlug(slug).match(/-(\d{4})$/);
  return match?.[1] || null;
}

export function stripMovieRouteYear(slug: string): string {
  return normalizeRouteSlug(slug).replace(/-\d{4}$/, '');
}

export function sharesMovieRouteFamily(leftSlug: string, rightSlug: string): boolean {
  return stripMovieRouteYear(leftSlug) === stripMovieRouteYear(rightSlug);
}

function readCandidateYear(value: string | null | undefined): number | null {
  const match = value?.trim().match(/\b(\d{4})\b/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreMovieRouteCandidate(requestedSlug: string, candidate: MovieRouteCandidate): number {
  const requestedYear = extractSlugYear(requestedSlug);
  const candidateYear = readCandidateYear(candidate.year || extractSlugYear(candidate.slug));
  let score = 0;

  if (candidate.hasPlayback) {
    score += 100;
  }

  if (normalizeRouteSlug(candidate.slug) === normalizeRouteSlug(requestedSlug)) {
    score += candidate.hasPlayback ? 50 : 5;
  }

  if (requestedYear && candidateYear === Number.parseInt(requestedYear, 10)) {
    score += 40;
  }

  if (!requestedYear && candidateYear) {
    score += 10;
  }

  if (candidateYear) {
    score += candidateYear / 10000;
  }

  return score;
}

export function pickPreferredMovieRouteCandidate(
  requestedSlug: string,
  candidates: MovieRouteCandidate[],
): MovieRouteCandidate | null {
  const familyCandidates = candidates.filter((candidate) => sharesMovieRouteFamily(requestedSlug, candidate.slug));
  if (familyCandidates.length === 0) {
    return null;
  }

  const ranked = [...familyCandidates].sort((left, right) => {
    const scoreDiff = scoreMovieRouteCandidate(requestedSlug, right) - scoreMovieRouteCandidate(requestedSlug, left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return normalizeRouteSlug(left.slug).localeCompare(normalizeRouteSlug(right.slug));
  });

  return ranked[0] || null;
}
