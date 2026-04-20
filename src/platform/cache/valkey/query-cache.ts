import { createClient } from 'redis';

type ValkeyConfig = {
  url: string;
};

type QueryCacheClient = ReturnType<typeof createClient>;

let queryClientPromise: Promise<QueryCacheClient | null> | null = null;
let hasLoggedValkeyFailure = false;
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

function readValkeyConfig(): ValkeyConfig | null {
  const url =
    normalizeEnvValue(process.env.AIVEN_VALKEY_URL) ||
    normalizeEnvValue(process.env.VALKEY_URL);

  return url ? { url } : null;
}

function logValkeyFailureOnce(error: unknown): void {
  if (hasLoggedValkeyFailure) {
    return;
  }

  hasLoggedValkeyFailure = true;
  const message = error instanceof Error ? error.message : 'Unknown Valkey connection error';
  console.warn(`[query-cache] Valkey unavailable: ${message}`);
}

async function getQueryCacheClient(): Promise<QueryCacheClient | null> {
  if (queryClientPromise) {
    return queryClientPromise;
  }

  const config = readValkeyConfig();
  if (!config) {
    return null;
  }

  queryClientPromise = (async () => {
    try {
      const client = createClient({
        url: config.url,
        socket: {
          connectTimeout: 10_000,
          reconnectStrategy: false,
        },
      });

      client.on('error', (error) => {
        logValkeyFailureOnce(error);
      });

      await client.connect();
      return client;
    } catch (error) {
      logValkeyFailureOnce(error);
      return null;
    }
  })();

  return queryClientPromise;
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

export function hasQueryCache(): boolean {
  return Boolean(readValkeyConfig());
}

export function buildQueryCacheKey(...parts: Array<string | number | null | undefined>): string {
  return ['query', ...parts]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(':');
}

export async function getQueryCacheValue<T>(key: string): Promise<T | null> {
  if (!key) {
    return null;
  }

  const client = await getQueryCacheClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get(key);
    return deserializeCacheValue<T>(value);
  } catch {
    return null;
  }
}

export async function setQueryCacheValue<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  if (!key || ttlSeconds <= 0) {
    return false;
  }

  const client = await getQueryCacheClient();
  if (!client) {
    return false;
  }

  try {
    const response = await client.set(key, serializeCacheValue(value), {
      EX: ttlSeconds,
    });
    return response === 'OK';
  } catch {
    return false;
  }
}

export async function deleteQueryCacheValue(key: string): Promise<boolean> {
  if (!key) {
    return false;
  }

  const client = await getQueryCacheClient();
  if (!client) {
    return false;
  }

  try {
    return (await client.del(key)) > 0;
  } catch {
    return false;
  }
}

export async function rememberQueryCacheValue<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cachedValue = await getQueryCacheValue<T>(key);
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
      void setQueryCacheValue(key, value, ttlSeconds);
      return value;
    } finally {
      inflightLoads.delete(key);
    }
  })();

  inflightLoads.set(key, loadPromise);
  return loadPromise;
}
