import { createClient } from 'redis';

type RedisConfig = {
  url: string;
};

type SortedSetEntry = {
  member: string;
  score: number;
};

type DomainRedisClient = ReturnType<typeof createClient>;

let redisClientPromise: Promise<DomainRedisClient | null> | null = null;
let hasLoggedRedisFailure = false;
const inflightLoads = new Map<string, Promise<unknown>>();

function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() || '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function readRedisConfig(): RedisConfig | null {
  const url =
    normalizeEnvValue(process.env.AIVEN_REDIS_URL) ||
    normalizeEnvValue(process.env.AIVEN_VALKEY_URL) ||
    normalizeEnvValue(process.env.REDIS_URL) ||
    normalizeEnvValue(process.env.VALKEY_URL);

  return url ? { url } : null;
}

function logRedisFailureOnce(error: unknown): void {
  if (hasLoggedRedisFailure) {
    return;
  }

  hasLoggedRedisFailure = true;
  const message = error instanceof Error ? error.message : 'Unknown Redis connection error';
  console.warn(`[domain-cache] Redis unavailable: ${message}`);
}

async function getDomainRedisClient(): Promise<DomainRedisClient | null> {
  if (redisClientPromise) {
    return redisClientPromise;
  }

  const config = readRedisConfig();
  if (!config) {
    return null;
  }

  redisClientPromise = (async () => {
    try {
      const client = createClient({
        url: config.url,
        socket: {
          connectTimeout: 10_000,
          reconnectStrategy: false,
        },
      });

      client.on('error', (error) => {
        logRedisFailureOnce(error);
      });

      await client.connect();
      return client;
    } catch (error) {
      logRedisFailureOnce(error);
      return null;
    }
  })();

  return redisClientPromise;
}

function serializeCacheValue<T>(value: T): string {
  return JSON.stringify(value);
}

function deserializeCacheValue<T>(value: string | null | undefined): T | null {
  if (value == null || value === '') {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export function hasDomainCache(): boolean {
  return Boolean(readRedisConfig());
}

export function buildDomainCacheKey(...parts: Array<string | number | null | undefined>): string {
  return ['domain', ...parts]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(':');
}

export async function getDomainCacheValue<T>(key: string): Promise<T | null> {
  if (!key) {
    return null;
  }

  const redisClient = await getDomainRedisClient();
  if (!redisClient) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return deserializeCacheValue<T>(value);
  } catch {
    return null;
  }
}

export async function setDomainCacheValue<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  if (!key || ttlSeconds <= 0) {
    return false;
  }

  const redisClient = await getDomainRedisClient();
  if (!redisClient) {
    return false;
  }

  try {
    const response = await redisClient.set(key, serializeCacheValue(value), {
      EX: ttlSeconds,
    });
    return response === 'OK';
  } catch {
    return false;
  }
}

export async function deleteDomainCacheValue(key: string): Promise<boolean> {
  if (!key) {
    return false;
  }

  const redisClient = await getDomainRedisClient();
  if (!redisClient) {
    return false;
  }

  try {
    return (await redisClient.del(key)) > 0;
  } catch {
    return false;
  }
}

export async function rememberDomainCacheValue<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cachedValue = await getDomainCacheValue<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  const existingLoad = inflightLoads.get(key);
  if (existingLoad) {
    return existingLoad as Promise<T>;
  }

  const loadPromise = (async () => {
    try {
      const value = await loader();
      void setDomainCacheValue(key, value, ttlSeconds);
      return value;
    } finally {
      inflightLoads.delete(key);
    }
  })();

  inflightLoads.set(key, loadPromise);
  return loadPromise;
}

export async function incrementDomainCacheCounter(key: string, ttlSeconds: number): Promise<number | null> {
  if (!key || ttlSeconds <= 0) {
    return null;
  }

  const redisClient = await getDomainRedisClient();
  if (!redisClient) {
    return null;
  }

  try {
    const value = await redisClient.incr(key);
    if (value === 1) {
      await redisClient.expire(key, ttlSeconds);
    }
    return value;
  } catch {
    return null;
  }
}

export async function incrementDomainSortedSet(key: string, member: string, amount: number): Promise<number | null> {
  if (!key || !member || !Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const redisClient = await getDomainRedisClient();
  if (!redisClient) {
    return null;
  }

  try {
    return await redisClient.zIncrBy(key, amount, member);
  } catch {
    return null;
  }
}

export async function getDomainSortedSetDescending(
  key: string,
  start: number,
  stop: number,
): Promise<SortedSetEntry[]> {
  if (!key) {
    return [];
  }

  const redisClient = await getDomainRedisClient();
  if (!redisClient) {
    return [];
  }

  try {
    const entries = await redisClient.zRangeWithScores(key, start, stop, {
      REV: true,
    });
    return entries.map((entry) => ({
      member: entry.value,
      score: entry.score,
    }));
  } catch {
    return [];
  }
}
