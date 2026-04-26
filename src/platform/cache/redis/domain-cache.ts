import { createClient } from 'redis';
import { fetchWithTimeout } from '../../../lib/fetch-with-timeout.ts';

type TcpRedisConfig = {
  kind: 'tcp';
  url: string;
};

type UpstashRedisConfig = {
  kind: 'upstash';
  url: string;
  token: string;
};

type RedisConfig = TcpRedisConfig | UpstashRedisConfig;

type SortedSetEntry = {
  member: string;
  score: number;
};

type DomainRedisClient = ReturnType<typeof createClient>;
type DomainCacheClient =
  | { kind: 'tcp'; client: DomainRedisClient }
  | { kind: 'upstash'; config: UpstashRedisConfig };

let redisClientPromise: Promise<DomainCacheClient | null> | null = null;
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

function readIntegerEnv(name: string, fallback: number, minimum: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }

  return parsed;
}

function readCacheConnectTimeoutMs(): number {
  return readIntegerEnv('DOMAIN_CACHE_CONNECT_TIMEOUT_MS', readIntegerEnv('CACHE_CONNECT_TIMEOUT_MS', 1_500, 250), 250);
}

function readCacheOperationTimeoutMs(): number {
  return readIntegerEnv('DOMAIN_CACHE_OPERATION_TIMEOUT_MS', readIntegerEnv('CACHE_OPERATION_TIMEOUT_MS', 800, 100), 100);
}

function readUpstashConfig(): UpstashRedisConfig | null {
  const url = normalizeEnvValue(process.env.UPSTASH_REDIS_REST_URL);
  const token = normalizeEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN);

  return url && token ? { kind: 'upstash', url, token } : null;
}

function readRedisConfig(): RedisConfig | null {
  const preferredDriver = normalizeEnvValue(process.env.DOMAIN_CACHE_DRIVER).toLowerCase();
  const upstashConfig = readUpstashConfig();
  const redisUrl =
    normalizeEnvValue(process.env.AIVEN_REDIS_URL) ||
    normalizeEnvValue(process.env.REDIS_URL);
  const valkeyFallbackUrl =
    normalizeEnvValue(process.env.AIVEN_VALKEY_URL) ||
    normalizeEnvValue(process.env.VALKEY_URL);

  if (preferredDriver === 'upstash' && upstashConfig) {
    return upstashConfig;
  }
  if (preferredDriver === 'valkey' && valkeyFallbackUrl) {
    return { kind: 'tcp', url: valkeyFallbackUrl };
  }
  if (redisUrl) {
    return { kind: 'tcp', url: redisUrl };
  }
  if (upstashConfig) {
    return upstashConfig;
  }

  return valkeyFallbackUrl ? { kind: 'tcp', url: valkeyFallbackUrl } : null;
}

function logRedisFailureOnce(error: unknown): void {
  if (hasLoggedRedisFailure) {
    return;
  }

  hasLoggedRedisFailure = true;
  const message = error instanceof Error ? error.message : 'Unknown Redis connection error';
  console.warn(`[domain-cache] Redis unavailable: ${message}`);
}

async function getDomainRedisClient(): Promise<DomainCacheClient | null> {
  if (redisClientPromise) {
    return redisClientPromise;
  }

  const config = readRedisConfig();
  if (!config) {
    return null;
  }

  redisClientPromise = (async () => {
    if (config.kind === 'upstash') {
      return { kind: 'upstash', config };
    }

    try {
      const client = createClient({
        url: config.url,
        socket: {
          connectTimeout: readCacheConnectTimeoutMs(),
          reconnectStrategy: false,
        },
      });

      client.on('error', (error) => {
        logRedisFailureOnce(error);
      });

      await client.connect();
      return { kind: 'tcp', client };
    } catch (error) {
      logRedisFailureOnce(error);
      const upstashConfig = readUpstashConfig();
      return upstashConfig ? { kind: 'upstash', config: upstashConfig } : null;
    }
  })();

  return redisClientPromise;
}

async function withCacheTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Cache operation timeout')), readCacheOperationTimeoutMs());
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function requestUpstash<T>(config: UpstashRedisConfig, command: unknown[]): Promise<T | null> {
  const response = await fetchWithTimeout(config.url, {
    method: 'POST',
    timeoutMs: readCacheOperationTimeoutMs(),
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null) as { result?: T; error?: string } | null;
  if (!payload || payload.error) {
    return null;
  }

  return payload.result ?? null;
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

  const cacheClient = await getDomainRedisClient();
  if (!cacheClient) {
    return null;
  }

  try {
    const value = cacheClient.kind === 'upstash'
      ? await requestUpstash<string | null>(cacheClient.config, ['GET', key])
      : await withCacheTimeout(cacheClient.client.get(key));
    return deserializeCacheValue<T>(value);
  } catch {
    return null;
  }
}

export async function setDomainCacheValue<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  if (!key || ttlSeconds <= 0) {
    return false;
  }

  const cacheClient = await getDomainRedisClient();
  if (!cacheClient) {
    return false;
  }

  try {
    const serializedValue = serializeCacheValue(value);
    const response = cacheClient.kind === 'upstash'
      ? await requestUpstash<string>(cacheClient.config, ['SET', key, serializedValue, 'EX', ttlSeconds])
      : await withCacheTimeout(cacheClient.client.set(key, serializedValue, {
          EX: ttlSeconds,
        }));
    return response === 'OK';
  } catch {
    return false;
  }
}

export async function deleteDomainCacheValue(key: string): Promise<boolean> {
  if (!key) {
    return false;
  }

  const cacheClient = await getDomainRedisClient();
  if (!cacheClient) {
    return false;
  }

  try {
    const deleted = cacheClient.kind === 'upstash'
      ? await requestUpstash<number>(cacheClient.config, ['DEL', key])
      : await withCacheTimeout(cacheClient.client.del(key));
    return Number(deleted ?? 0) > 0;
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

  const cacheClient = await getDomainRedisClient();
  if (!cacheClient) {
    return null;
  }

  try {
    const value = cacheClient.kind === 'upstash'
      ? await requestUpstash<number>(cacheClient.config, ['INCR', key])
      : await withCacheTimeout(cacheClient.client.incr(key));
    if (value === 1) {
      if (cacheClient.kind === 'upstash') {
        await requestUpstash<number>(cacheClient.config, ['EXPIRE', key, ttlSeconds]);
      } else {
        await withCacheTimeout(cacheClient.client.expire(key, ttlSeconds));
      }
    }
    return value ?? null;
  } catch {
    return null;
  }
}

export async function incrementDomainSortedSet(key: string, member: string, amount: number): Promise<number | null> {
  if (!key || !member || !Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const cacheClient = await getDomainRedisClient();
  if (!cacheClient) {
    return null;
  }

  try {
    const value = cacheClient.kind === 'upstash'
      ? await requestUpstash<string | number>(cacheClient.config, ['ZINCRBY', key, amount, member])
      : await withCacheTimeout(cacheClient.client.zIncrBy(key, amount, member));
    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : null;
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

  const cacheClient = await getDomainRedisClient();
  if (!cacheClient) {
    return [];
  }

  try {
    if (cacheClient.kind === 'upstash') {
      const rawEntries = await requestUpstash<Array<string | number>>(cacheClient.config, [
        'ZREVRANGE',
        key,
        start,
        stop,
        'WITHSCORES',
      ]);
      const entries = rawEntries || [];
      const result: SortedSetEntry[] = [];
      for (let index = 0; index < entries.length; index += 2) {
        const member = String(entries[index] ?? '');
        const score = Number.parseFloat(String(entries[index + 1] ?? ''));
        if (member && Number.isFinite(score)) {
          result.push({ member, score });
        }
      }
      return result;
    }

    const entries = await withCacheTimeout(cacheClient.client.zRangeWithScores(key, start, stop, {
      REV: true,
    }));
    return entries.map((entry) => ({
      member: entry.value,
      score: entry.score,
    }));
  } catch {
    return [];
  }
}
