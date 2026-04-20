import {
  deleteDomainCacheValue,
  getDomainCacheValue,
  getDomainSortedSetDescending,
  hasDomainCache,
  incrementDomainCacheCounter,
  incrementDomainSortedSet,
  rememberDomainCacheValue,
  setDomainCacheValue,
} from '../../platform/cache/redis/domain-cache.ts';
import {
  deleteQueryCacheValue,
  getQueryCacheValue,
  hasQueryCache,
  rememberQueryCacheValue,
  setQueryCacheValue,
} from '../../platform/cache/valkey/query-cache.ts';

type SortedSetEntry = {
  member: string;
  score: number;
};

function shouldUseQueryCache(key: string): boolean {
  return /(^|:)(search|query|opensearch)(:|$)/.test(key);
}

export function hasComicCache(): boolean {
  return hasDomainCache() || hasQueryCache();
}

export function buildComicCacheKey(...parts: Array<string | number | null | undefined>): string {
  return ['comic', ...parts]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(':');
}

export async function getComicCacheValue<T>(key: string): Promise<T | null> {
  return shouldUseQueryCache(key)
    ? getQueryCacheValue<T>(key)
    : getDomainCacheValue<T>(key);
}

export async function setComicCacheValue<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  return shouldUseQueryCache(key)
    ? setQueryCacheValue(key, value, ttlSeconds)
    : setDomainCacheValue(key, value, ttlSeconds);
}

export async function deleteComicCacheValue(key: string): Promise<boolean> {
  return shouldUseQueryCache(key)
    ? deleteQueryCacheValue(key)
    : deleteDomainCacheValue(key);
}

const inflightLoads = new Map<string, Promise<unknown>>();

export async function rememberComicCacheValue<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cachedValue = await getComicCacheValue<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  const existingLoad = inflightLoads.get(key);
  if (existingLoad) {
    return existingLoad as Promise<T>;
  }

  const remember = shouldUseQueryCache(key) ? rememberQueryCacheValue : rememberDomainCacheValue;
  const loadPromise = remember(key, ttlSeconds, loader).finally(() => {
    inflightLoads.delete(key);
  });

  inflightLoads.set(key, loadPromise);
  return loadPromise;
}

export async function incrementComicCacheCounter(key: string, ttlSeconds: number): Promise<number | null> {
  return incrementDomainCacheCounter(key, ttlSeconds);
}

export async function incrementComicSortedSet(key: string, member: string, amount: number): Promise<number | null> {
  return incrementDomainSortedSet(key, member, amount);
}

export async function getComicSortedSetDescending(
  key: string,
  start: number,
  stop: number,
): Promise<SortedSetEntry[]> {
  return getDomainSortedSetDescending(key, start, stop);
}
