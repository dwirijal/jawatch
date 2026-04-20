export type CanonicalSeriesRowLike = {
  item_key?: string | null;
  canonical_item_key?: string | null;
  slug?: string | null;
  is_canonical?: boolean | null;
  updated_at?: string | null;
};

export type CanonicalSeriesRouteTargetLike = {
  slug?: string | null;
};

export type CanonicalEpisodeEntryLike = {
  canonical_unit_key?: string | null;
  slug?: string | null;
};

export type SeriesMirrorLike = {
  label: string;
  embed_url: string;
};

export type SeriesDownloadLinkLike = {
  label: string;
  href: string;
};

export type SeriesDownloadGroupLike = {
  format: string;
  quality: string;
  links: SeriesDownloadLinkLike[];
};

export type LinkedSourceItemLike = {
  item_key?: string | null;
  source?: string | null;
  is_primary?: boolean | null;
  priority?: number | null;
};

export type LinkedSourceUnitLike = LinkedSourceItemLike & {
  unit_key?: string | null;
  detail?: unknown;
};

export type SeriesEpisodeNavigationEntryLike = {
  slug?: string | null;
};

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readPriority(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : Number.parseFloat(readText(value)) || 0;
}

function getCanonicalGroupKey(row: CanonicalSeriesRowLike): string {
  return readText(row.canonical_item_key) || readText(row.item_key) || readText(row.slug);
}

function getCanonicalEpisodeKey(row: CanonicalEpisodeEntryLike): string {
  return readText(row.canonical_unit_key) || readText(row.slug);
}

function getUpdatedAtTime(row: CanonicalSeriesRowLike): number {
  const value = Date.parse(readText(row.updated_at));
  return Number.isFinite(value) ? value : 0;
}

function isPreferredCanonicalRow(
  candidate: CanonicalSeriesRowLike,
  current: CanonicalSeriesRowLike,
): boolean {
  const candidateCanonical = Boolean(candidate.is_canonical);
  const currentCanonical = Boolean(current.is_canonical);
  if (candidateCanonical !== currentCanonical) {
    return candidateCanonical;
  }

  return getUpdatedAtTime(candidate) > getUpdatedAtTime(current);
}

function getPreferredCanonicalSeriesRows<T extends CanonicalSeriesRowLike>(rows: T[]): Map<string, T> {
  const grouped = new Map<string, T>();

  for (const row of rows) {
    const key = getCanonicalGroupKey(row);
    if (!key) {
      continue;
    }

    const existing = grouped.get(key);
    if (!existing || isPreferredCanonicalRow(row, existing)) {
      grouped.set(key, row);
    }
  }

  return grouped;
}

export function collapseCanonicalSeriesRows<T extends CanonicalSeriesRowLike>(
  rows: T[],
  options: { limit?: number } = {},
): T[] {
  const grouped = getPreferredCanonicalSeriesRows(rows);
  const emitted = new Set<string>();
  const collapsed: T[] = [];

  for (const row of rows) {
    const key = getCanonicalGroupKey(row);
    if (!key || emitted.has(key)) {
      continue;
    }

    const representative = grouped.get(key);
    if (!representative) {
      continue;
    }

    emitted.add(key);
    collapsed.push(representative);

    if (options.limit != null && collapsed.length >= Math.max(1, options.limit)) {
      break;
    }
  }

  return collapsed;
}

export function selectCanonicalSeriesRow<T extends CanonicalSeriesRowLike>(rows: T[]): T | null {
  const firstRow = rows[0];
  if (!firstRow) {
    return null;
  }

  const key = getCanonicalGroupKey(firstRow);
  if (!key) {
    return firstRow;
  }

  return getPreferredCanonicalSeriesRows(rows).get(key) ?? null;
}

export function getSeriesSearchCandidateLimit(limit: number): number {
  const normalizedLimit = Math.max(1, limit);
  return normalizedLimit * 4;
}

export function buildSeriesCanonicalRedirectPath(
  pathname: '/series',
  requestedSlug: string,
  canonicalSlug: string,
): string | null {
  const requested = readText(requestedSlug);
  const canonical = readText(canonicalSlug);

  if (!requested || !canonical || requested === canonical) {
    return null;
  }

  return `${pathname}/${canonical}`;
}

export function resolveSeriesCanonicalRedirect<T extends CanonicalSeriesRouteTargetLike>(
  pathname: '/series',
  requestedSlug: string,
  resolvedEntity: T | null | undefined,
): string | null {
  return buildSeriesCanonicalRedirectPath(pathname, requestedSlug, readText(resolvedEntity?.slug));
}

export function buildCanonicalEpisodeLateralSubquery(
  canonicalAlias = 'cu',
  sourceUnitAlias = 'u',
  enabled = true,
): string {
  if (!enabled) {
    return `
        select
          null::text as unit_key,
          null::text as title,
          null::text as label,
          null::real as number,
          null::timestamptz as updated_at
    `;
  }

  return `
        select
          ${canonicalAlias}.unit_key,
          ${canonicalAlias}.title,
          ${canonicalAlias}.label,
          ${canonicalAlias}.number,
          ${canonicalAlias}.updated_at
        from public.media_unit_links mul
        join public.media_units ${canonicalAlias} on ${canonicalAlias}.unit_key = mul.canonical_unit_key
        where mul.source_unit_key = ${sourceUnitAlias}.unit_key
        order by mul.is_primary desc, mul.priority desc, mul.updated_at desc
        limit 1
  `;
}

export function collapseCanonicalEpisodeEntries<T extends CanonicalEpisodeEntryLike>(rows: T[]): T[] {
  const emitted = new Set<string>();
  const collapsed: T[] = [];

  for (const row of rows) {
    const key = getCanonicalEpisodeKey(row);
    if (!key || emitted.has(key)) {
      continue;
    }

    emitted.add(key);
    collapsed.push(row);
  }

  return collapsed;
}

function compareLinkedSourceItems<T extends LinkedSourceItemLike>(
  left: T,
  right: T,
  {
    requestedItemKey,
    requestedSource,
  }: {
    requestedItemKey?: string | null;
    requestedSource?: string | null;
  } = {},
): number {
  const targetItemKey = readText(requestedItemKey);
  const targetSource = readText(requestedSource);
  const leftItemKey = readText(left.item_key);
  const rightItemKey = readText(right.item_key);
  const leftSource = readText(left.source);
  const rightSource = readText(right.source);

  if (targetItemKey) {
    const leftMatchesRequestedItem = leftItemKey === targetItemKey;
    const rightMatchesRequestedItem = rightItemKey === targetItemKey;
    if (leftMatchesRequestedItem !== rightMatchesRequestedItem) {
      return leftMatchesRequestedItem ? -1 : 1;
    }
  }

  if (targetSource) {
    const leftMatchesRequestedSource = leftSource === targetSource;
    const rightMatchesRequestedSource = rightSource === targetSource;
    if (leftMatchesRequestedSource !== rightMatchesRequestedSource) {
      return leftMatchesRequestedSource ? -1 : 1;
    }
  }

  const leftPrimary = Boolean(left.is_primary);
  const rightPrimary = Boolean(right.is_primary);
  if (leftPrimary !== rightPrimary) {
    return leftPrimary ? -1 : 1;
  }

  const priorityDelta = readPriority(right.priority) - readPriority(left.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const sourceComparison = leftSource.localeCompare(rightSource);
  if (sourceComparison !== 0) {
    return sourceComparison;
  }

  return leftItemKey.localeCompare(rightItemKey);
}

export function selectPreferredLinkedSourceItem<T extends LinkedSourceItemLike>(
  rows: T[],
  options: {
    requestedItemKey?: string | null;
    requestedSource?: string | null;
  } = {},
): T | null {
  let preferred: T | null = null;

  for (const row of rows) {
    if (!readText(row.item_key)) {
      continue;
    }

    if (!preferred || compareLinkedSourceItems(row, preferred, options) < 0) {
      preferred = row;
    }
  }

  return preferred;
}

export function selectPreferredLinkedSourceUnit<T extends LinkedSourceUnitLike>(
  rows: T[],
  {
    requestedUnitKey,
    linkedSourceItemKey,
    requestedSource,
  }: {
    requestedUnitKey?: string | null;
    linkedSourceItemKey?: string | null;
    requestedSource?: string | null;
  } = {},
): T | null {
  const targetUnitKey = readText(requestedUnitKey);
  const targetItemKey = readText(linkedSourceItemKey);
  let preferred: T | null = null;

  for (const row of rows) {
    const rowUnitKey = readText(row.unit_key);
    if (!rowUnitKey) {
      continue;
    }

    if (!preferred) {
      preferred = row;
      continue;
    }

    const preferredUnitKey = readText(preferred.unit_key);
    if (targetUnitKey) {
      const rowMatchesRequestedUnit = rowUnitKey === targetUnitKey;
      const preferredMatchesRequestedUnit = preferredUnitKey === targetUnitKey;
      if (rowMatchesRequestedUnit !== preferredMatchesRequestedUnit) {
        preferred = rowMatchesRequestedUnit ? row : preferred;
        continue;
      }
    }

    if (targetItemKey) {
      const rowMatchesLinkedItem: boolean = readText(row.item_key) === targetItemKey;
      const preferredMatchesLinkedItem: boolean = readText(preferred.item_key) === targetItemKey;
      if (rowMatchesLinkedItem !== preferredMatchesLinkedItem) {
        preferred = rowMatchesLinkedItem ? row : preferred;
        continue;
      }
    }

    if (compareLinkedSourceItems(row, preferred, { requestedSource }) < 0) {
      preferred = row;
      continue;
    }

    if (
      compareLinkedSourceItems(row, preferred, { requestedSource }) === 0 &&
      rowUnitKey.localeCompare(preferredUnitKey) < 0
    ) {
      preferred = row;
    }
  }

  return preferred;
}

export function resolveSeriesEpisodeNavigation({
  currentSlug,
  playlist,
  prevSlug,
  nextSlug,
}: {
  currentSlug: string;
  playlist: SeriesEpisodeNavigationEntryLike[];
  prevSlug?: string | null;
  nextSlug?: string | null;
}): {
  prevSlug: string | null;
  nextSlug: string | null;
} {
  const resolvedPrevSlug = readText(prevSlug) || null;
  const resolvedNextSlug = readText(nextSlug) || null;

  if (resolvedPrevSlug && resolvedNextSlug) {
    return {
      prevSlug: resolvedPrevSlug,
      nextSlug: resolvedNextSlug,
    };
  }

  const normalizedCurrentSlug = readText(currentSlug);
  const currentIndex = playlist.findIndex((entry) => readText(entry.slug) === normalizedCurrentSlug);
  if (currentIndex === -1) {
    return {
      prevSlug: resolvedPrevSlug,
      nextSlug: resolvedNextSlug,
    };
  }

  return {
    prevSlug: resolvedPrevSlug || readText(playlist[currentIndex + 1]?.slug) || null,
    nextSlug: resolvedNextSlug || readText(playlist[currentIndex - 1]?.slug) || null,
  };
}

export function selectSeriesPlaybackSources({
  requestedSlug,
  canonicalSlug,
  sourceMirrors,
  canonicalMirrors,
  sourceDownloadGroups,
  canonicalDownloadGroups,
  sourceStreamUrl,
}: {
  requestedSlug: string;
  canonicalSlug: string;
  sourceMirrors: SeriesMirrorLike[];
  canonicalMirrors: SeriesMirrorLike[];
  sourceDownloadGroups: SeriesDownloadGroupLike[];
  canonicalDownloadGroups: SeriesDownloadGroupLike[];
  sourceStreamUrl: string;
}): {
  mirrors: SeriesMirrorLike[];
  downloadGroups: SeriesDownloadGroupLike[];
  defaultUrl: string;
} {
  const requested = readText(requestedSlug);
  const canonical = readText(canonicalSlug);
  const isCanonicalRoute = Boolean(requested) && Boolean(canonical) && requested === canonical;

  const mirrors = canonicalMirrors.length > 0
    ? canonicalMirrors
    : isCanonicalRoute
      ? sourceMirrors
      : [];

  const downloadGroups = canonicalDownloadGroups.length > 0
    ? canonicalDownloadGroups
    : isCanonicalRoute
      ? sourceDownloadGroups
      : [];

  const defaultUrl = mirrors[0]?.embed_url || (isCanonicalRoute ? readText(sourceStreamUrl) : '');

  return {
    mirrors,
    downloadGroups,
    defaultUrl,
  };
}
