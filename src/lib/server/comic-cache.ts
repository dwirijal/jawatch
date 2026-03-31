import 'server-only';

import { createClient } from 'redis';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

type UpstashResult<T> = {
  result?: T;
  error?: string;
};

type UpstashConfig = {
  baseUrl: string;
  token: string;
};

type RedisConfig = {
  url: string;
};

type SortedSetEntry = {
  member: string;
  score: number;
};

type ComicRedisClient = ReturnType<typeof createClient>;

let redisClientPromise: Promise<ComicRedisClient | null> | null = null;
let hasLoggedRedisFailure = false;
let hasLoggedUpstashFallback = false;

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
    normalizeEnvValue(process.env.VALKEY_URL) ||
    normalizeEnvValue(process.env.REDIS_URL) ||
    normalizeEnvValue(process.env.AIVEN_VALKEY_URL);

  if (!url) {
    return null;
  }

  return { url };
}

function readUpstashConfig(): UpstashConfig | null {
  const baseUrl = normalizeEnvValue(process.env.UPSTASH_REDIS_REST_URL);
  const token = normalizeEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!baseUrl || !token) {
    return null;
  }

  return { baseUrl, token };
}

function logRedisFailureOnce(error: unknown): void {
  if (hasLoggedRedisFailure) {
    return;
  }

  hasLoggedRedisFailure = true;
  const message = error instanceof Error ? error.message : 'Unknown Redis connection error';
  console.warn(`[comic-cache] Primary Valkey/Redis unavailable, falling back to Upstash if configured: ${message}`);
}

function logUpstashFallbackOnce(): void {
  if (hasLoggedUpstashFallback) {
    return;
  }

  hasLoggedUpstashFallback = true;
  console.warn('[comic-cache] Using Upstash REST fallback cache');
}

async function getRedisClient(): Promise<ComicRedisClient | null> {
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

async function sendUpstashCommand<T>(command: string, args: Array<string | number | boolean>): Promise<T | null> {
  const config = readUpstashConfig();
  if (!config) {
    return null;
  }

  logUpstashFallbackOnce();

  try {
    const response = await fetchWithTimeout(config.baseUrl, {
      method: 'POST',
      timeoutMs: 2500,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as UpstashResult<T>;
    if (payload.error) {
      return null;
    }

    return (payload.result ?? null) as T | null;
  } catch {
    return null;
  }
}

export function hasComicCache(): boolean {
  return Boolean(readRedisConfig() || readUpstashConfig());
}

export function buildComicCacheKey(...parts: Array<string | number | null | undefined>): string {
  return ['comic', ...parts]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(':');
}

export async function getComicCacheValue<T>(key: string): Promise<T | null> {
  if (!key) {
    return null;
  }

  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      return deserializeCacheValue<T>(value);
    } catch {
      // Fall through to Upstash.
    }
  }

  const result = await sendUpstashCommand<string>('GET', [key]);
  return deserializeCacheValue<T>(result);
}

export async function setComicCacheValue<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  if (!key || ttlSeconds <= 0) {
    return false;
  }

  const serialized = serializeCacheValue(value);
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const response = await redisClient.set(key, serialized, {
        EX: ttlSeconds,
      });
      return response === 'OK';
    } catch {
      // Fall through to Upstash.
    }
  }

  const result = await sendUpstashCommand<string>('SET', [key, serialized, 'EX', ttlSeconds]);
  return result === 'OK';
}

export async function deleteComicCacheValue(key: string): Promise<boolean> {
  if (!key) {
    return false;
  }

  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      return (await redisClient.del(key)) > 0;
    } catch {
      // Fall through to Upstash.
    }
  }

  const result = await sendUpstashCommand<number>('DEL', [key]);
  return typeof result === 'number' ? result > 0 : false;
}

export async function rememberComicCacheValue<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cachedValue = await getComicCacheValue<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  const value = await loader();
  void setComicCacheValue(key, value, ttlSeconds);
  return value;
}

export async function incrementComicSortedSet(key: string, member: string, amount: number): Promise<number | null> {
  if (!key || !member || !Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      return await redisClient.zIncrBy(key, amount, member);
    } catch {
      // Fall through to Upstash.
    }
  }

  const result = await sendUpstashCommand<string>('ZINCRBY', [key, amount, member]);
  const parsed = Number.parseFloat(result ?? '');
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getComicSortedSetDescending(
  key: string,
  start: number,
  stop: number,
): Promise<SortedSetEntry[]> {
  if (!key) {
    return [];
  }

  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const entries = await redisClient.zRangeWithScores(key, start, stop, {
        REV: true,
      });
      return entries.map((entry) => ({
        member: entry.value,
        score: entry.score,
      }));
    } catch {
      // Fall through to Upstash.
    }
  }

  const result = await sendUpstashCommand<string[]>('ZREVRANGE', [key, start, stop, 'WITHSCORES']);
  if (!Array.isArray(result) || result.length === 0) {
    return [];
  }

  const entries: SortedSetEntry[] = [];
  for (let index = 0; index < result.length; index += 2) {
    const member = result[index]?.trim();
    const score = Number.parseFloat(result[index + 1] ?? '');
    if (!member || !Number.isFinite(score)) {
      continue;
    }
    entries.push({ member, score });
  }

  return entries;
}
