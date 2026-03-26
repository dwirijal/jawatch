export type SnapshotDomain =
  | 'anime'
  | 'movies'
  | 'manga'
  | 'manhwa'
  | 'manhua'
  | 'donghua';

export interface SnapshotManifestDomain {
  hotSlugs?: string[];
  hotPlaybackSlugs?: string[];
  generatedAt?: string;
}

export interface SnapshotManifest {
  version: string;
  generatedAt: string;
  domains: Partial<Record<SnapshotDomain, SnapshotManifestDomain>>;
}

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type SearchableSnapshotRecord = {
  slug?: string;
  title?: string;
  alternativeTitle?: string;
  altTitle?: string | null;
  subtitle?: string;
  tags?: string[];
  genres?: string[] | string;
  aliases?: string[];
  description?: string;
};

const runtimeCache = new Map<string, CacheEntry>();
const SNAPSHOT_CACHE_TTL_MS = 1000 * 60;
const SNAPSHOT_WEB_ROOT = '/snapshots/current';

async function withSnapshotCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = runtimeCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }
  const value = await loader();
  runtimeCache.set(key, {
    expiresAt: now + SNAPSHOT_CACHE_TTL_MS,
    value,
  });
  return value;
}

async function readSnapshotJson<T>(relativePath: string): Promise<T | null> {
  if (typeof window !== 'undefined') {
    const response = await fetch(`${SNAPSHOT_WEB_ROOT}/${relativePath}`, {
      cache: 'force-cache',
    }).catch(() => null);
    if (!response || !response.ok) {
      return null;
    }
    return (await response.json()) as T;
  }

  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const absolutePath = path.join(process.cwd(), 'public', 'snapshots', 'current', ...relativePath.split('/'));
    const raw = await readFile(absolutePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function collectHaystack(item: SearchableSnapshotRecord): string {
  const genres = Array.isArray(item.genres) ? item.genres : typeof item.genres === 'string' ? [item.genres] : [];
  return [
    item.slug,
    item.title,
    item.alternativeTitle,
    item.altTitle,
    item.subtitle,
    item.description,
    ...(item.tags || []),
    ...genres,
    ...(item.aliases || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export async function getSnapshotManifest(): Promise<SnapshotManifest | null> {
  return withSnapshotCache('snapshot:manifest', () => readSnapshotJson<SnapshotManifest>('manifest.json'));
}

export async function readSnapshotDomainFile<T>(domain: SnapshotDomain, fileName: string): Promise<T | null> {
  return withSnapshotCache(`snapshot:domain:${domain}:${fileName}`, () =>
    readSnapshotJson<T>(`domains/${domain}/${fileName}`)
  );
}

export async function readSnapshotTitle<T>(domain: SnapshotDomain, slug: string): Promise<T | null> {
  return withSnapshotCache(`snapshot:title:${domain}:${slug}`, () =>
    readSnapshotJson<T>(`titles/${domain}/${slug}.json`)
  );
}

export async function readSnapshotPlayback<T>(domain: SnapshotDomain, slug: string): Promise<T | null> {
  return withSnapshotCache(`snapshot:playback:${domain}:${slug}`, () =>
    readSnapshotJson<T>(`playback/${domain}/${slug}.json`)
  );
}

export async function searchSnapshotDomain<T extends SearchableSnapshotRecord>(
  domain: SnapshotDomain,
  query: string,
  limit: number
): Promise<T[]> {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const payload =
    (await readSnapshotDomainFile<T[] | { items?: T[] }>(domain, 'search.json')) ??
    (await readSnapshotDomainFile<T[] | { items?: T[] }>(domain, 'catalog.json'));
  const items = Array.isArray(payload) ? payload : payload?.items || [];

  return items.filter((item) => collectHaystack(item).includes(normalizedQuery)).slice(0, limit);
}
