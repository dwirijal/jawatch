type EdgeCacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

const EDGE_CACHE_NAMESPACE = 'https://dwizzy-cache.local';
const fallbackRuntimeCache = new Map<string, EdgeCacheEnvelope<unknown>>();
const inflightCache = new Map<string, Promise<unknown>>();

function getCloudflareDefaultCache(): Cache | null {
  const cacheStorage = (globalThis as typeof globalThis & {
    caches?: CacheStorage & { default?: Cache };
  }).caches;

  return cacheStorage?.default ?? null;
}

function canUseCloudflareEdgeCache(): boolean {
  return typeof window === 'undefined' && Boolean(getCloudflareDefaultCache());
}

function buildEdgeCacheRequest(key: string): Request {
  const normalizedKey = key.trim().replace(/^\/+/, '');
  return new Request(`${EDGE_CACHE_NAMESPACE}/${encodeURIComponent(normalizedKey)}`, {
    method: 'GET',
  });
}

export async function withCloudflareEdgeCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  if (ttlSeconds <= 0) {
    return loader();
  }

  const cached = fallbackRuntimeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const inflight = inflightCache.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const request = buildEdgeCacheRequest(key);
  const edgeCache = getCloudflareDefaultCache();
  const readCachedEdgeValue = async () => {
    if (!canUseCloudflareEdgeCache() || !edgeCache) {
      return null;
    }

    try {
      const cachedResponse = await edgeCache.match(request);
      if (cachedResponse?.ok) {
        const cachedEntry = (await cachedResponse.json()) as EdgeCacheEnvelope<T>;
        if (cachedEntry.expiresAt > Date.now()) {
          fallbackRuntimeCache.set(key, cachedEntry as EdgeCacheEnvelope<unknown>);
          return cachedEntry.value;
        }
      }
    } catch {
      // Cache failures should never break the request path.
    }

    return null;
  };

  const pending = (async () => {
    const edgeValue = await readCachedEdgeValue();
    if (edgeValue !== null) {
      return edgeValue;
    }

    const value = await loader();
    const entry = {
      expiresAt: Date.now() + ttlSeconds * 1000,
      value,
    } satisfies EdgeCacheEnvelope<T>;

    fallbackRuntimeCache.set(key, entry as EdgeCacheEnvelope<unknown>);

    if (edgeCache) {
      try {
        const response = new Response(JSON.stringify(entry), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': `public, max-age=${ttlSeconds}`,
          },
        });

        await edgeCache.put(request, response);
      } catch {
        // Ignore edge cache write failures and still return fresh data.
      }
    }

    return value;
  })().finally(() => {
    inflightCache.delete(key);
  });

  inflightCache.set(key, pending as Promise<unknown>);
  return pending;
}

export function buildEdgeCacheControl(ttlSeconds: number, staleWhileRevalidateSeconds = ttlSeconds * 3): string {
  return `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`;
}

export function buildPublicCacheHeaders(
  ttlSeconds: number,
  staleWhileRevalidateSeconds = ttlSeconds * 3,
): Record<string, string> {
  const cacheControl = buildEdgeCacheControl(ttlSeconds, staleWhileRevalidateSeconds);
  return {
    'Cache-Control': cacheControl,
    'CDN-Cache-Control': cacheControl,
    'Vercel-CDN-Cache-Control': cacheControl,
  };
}

export function buildAuthSensitiveCacheHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Vercel-CDN-Cache-Control', 'no-store');
  headers.set('Pragma', 'no-cache');
  headers.set('Vary', 'Cookie, Authorization');
  return headers;
}

export function buildPrivateNoStoreCacheControl(): string {
  return 'private, no-store, max-age=0, must-revalidate';
}

export function buildAuthSensitiveCacheControl(): string {
  return 'private, no-store, max-age=0, must-revalidate';
}

export function buildAuthSensitiveResponseHeaders(): Record<string, string> {
  return {
    'Cache-Control': buildAuthSensitiveCacheControl(),
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    Pragma: 'no-cache',
    Vary: 'Cookie, Authorization',
  };
}

export function buildPrivateCacheControl(): Record<string, string> {
  return buildAuthSensitiveResponseHeaders();
}
