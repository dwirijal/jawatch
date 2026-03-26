import 'server-only';
import { withCloudflareEdgeCache } from './cloudflare-cache';

const DEFAULT_API_GATEWAY_BASE_URL = 'https://api.dwizzy.my.id';

function firstNonEmpty(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

export function getApiGatewayBaseUrl(): string {
  return (
    firstNonEmpty(
      'DWIZZY_API_BASE_URL',
      'NEXT_PUBLIC_DWIZZY_API_BASE_URL',
      'API_DWIZZY_BASE_URL',
      'NEXT_PUBLIC_API_DWIZZY_BASE_URL'
    ) || DEFAULT_API_GATEWAY_BASE_URL
  );
}

export function buildGatewayUrl(path: string): string {
  const rawPath = path.trim();
  if (!rawPath) {
    return getApiGatewayBaseUrl();
  }
  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return new URL(normalizedPath, getApiGatewayBaseUrl()).toString();
}

type FetchOptions = {
  revalidate?: number;
  timeoutMs?: number;
  edgeCacheKey?: string;
  edgeCacheTtlSeconds?: number;
};

export async function gatewayFetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const loader = async () => {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(buildGatewayUrl(path), {
        headers: {
          Accept: 'application/json',
        },
        next: {
          revalidate: options.revalidate ?? 3600,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Gateway ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gateway timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  if (options.edgeCacheKey && options.edgeCacheTtlSeconds) {
    return withCloudflareEdgeCache(options.edgeCacheKey, options.edgeCacheTtlSeconds, loader);
  }

  return loader();
}

export function unwrapGatewayData<T>(payload: T | { data?: T; result?: T } | null | undefined): T | null {
  if (payload == null) {
    return null;
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as { data?: T; result?: T };
    if (record.data !== undefined) {
      return record.data ?? null;
    }
    if (record.result !== undefined) {
      return record.result ?? null;
    }
  }
  return payload as T;
}
