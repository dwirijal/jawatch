import 'server-only';

import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import {
  buildFuzzySearchRequestBody,
  buildPrimarySearchRequestBody,
  normalizeSearchQuery,
  type SearchOpenSearchInput,
} from './query-builder';

type SearchIndexDocument = {
  id: string;
  slug: string;
  href: string;
  title: string;
  image: string;
  subtitle?: string;
  metaLine?: string;
  badgeText?: string;
  routeType: 'series' | 'movies' | 'comic';
  theme: 'anime' | 'donghua' | 'drama' | 'movie' | 'manga' | 'novel';
  keywords?: string[];
  popularity?: number;
  updatedAt?: string;
};

type OpenSearchConfig = {
  baseUrl: string;
  authHeader?: string;
  indexName: string;
};

type OpenSearchHit = {
  _id: string;
  _score?: number;
  _source?: Record<string, unknown>;
};

type OpenSearchSearchResponse = {
  hits?: {
    hits?: OpenSearchHit[];
  };
};

const DEFAULT_INDEX_NAME = 'jawatch-title-search-v1';
const INDEX_CREATE_BODY = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 1,
  },
  mappings: {
    dynamic: false,
    properties: {
      id: { type: 'keyword' },
      slug: { type: 'keyword' },
      href: { type: 'keyword' },
      title: { type: 'search_as_you_type' },
      title_exact: { type: 'keyword' },
      image: { type: 'keyword', index: false },
      subtitle: { type: 'text' },
      meta_line: { type: 'text' },
      badge_text: { type: 'keyword' },
      route_type: { type: 'keyword' },
      theme: { type: 'keyword' },
      keywords: { type: 'text' },
      popularity: { type: 'float' },
      updated_at: { type: 'date' },
    },
  },
} as const;

let ensureIndexPromise: Promise<boolean> | null = null;

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

function readOpenSearchTimeoutMs(): number {
  return readIntegerEnv('OPENSEARCH_TIMEOUT_MS', 1_500, 250);
}

function readOpenSearchSearchTimeoutMs(): number {
  return readIntegerEnv('OPENSEARCH_SEARCH_TIMEOUT_MS', readOpenSearchTimeoutMs(), 250);
}

function readOpenSearchWriteTimeoutMs(): number {
  return readIntegerEnv('OPENSEARCH_WRITE_TIMEOUT_MS', 3_500, 500);
}

function readOpenSearchConfig(): OpenSearchConfig | null {
  const rawUrl =
    normalizeEnvValue(process.env.AIVEN_OPENSEARCH_URL) ||
    normalizeEnvValue(process.env.OPENSEARCH_URL) ||
    normalizeEnvValue(process.env.SEARCH_OPENSEARCH_URL);

  if (!rawUrl) {
    return null;
  }

  const indexName =
    normalizeEnvValue(process.env.OPENSEARCH_INDEX_NAME) ||
    normalizeEnvValue(process.env.SEARCH_INDEX_NAME) ||
    DEFAULT_INDEX_NAME;

  try {
    const url = new URL(rawUrl);
    const authHeader =
      url.username || url.password
        ? `Basic ${Buffer.from(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`).toString('base64')}`
        : undefined;

    url.username = '';
    url.password = '';
    url.pathname = url.pathname.replace(/\/+$/, '');

    return {
      baseUrl: url.toString().replace(/\/+$/, ''),
      authHeader,
      indexName,
    };
  } catch {
    return null;
  }
}

function buildHeaders(config: OpenSearchConfig, extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  headers.set('Accept', 'application/json');
  if (config.authHeader) {
    headers.set('Authorization', config.authHeader);
  }
  return headers;
}

async function requestOpenSearch<T>(
  config: OpenSearchConfig,
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const response = await fetchWithTimeout(`${config.baseUrl}${path}`, {
      timeoutMs: init?.timeoutMs ?? readOpenSearchTimeoutMs(),
      method: init?.method,
      headers: buildHeaders(config, init?.headers),
      body: init?.body,
    });

    if (response.status === 404) {
      return { ok: false, status: response.status, data: null };
    }

    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }

    if (response.status === 204) {
      return { ok: true, status: response.status, data: null };
    }

    return {
      ok: true,
      status: response.status,
      data: (await response.json()) as T,
    };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

async function ensureIndexInternal(config: OpenSearchConfig): Promise<boolean> {
  const headResult = await requestOpenSearch<Record<string, unknown>>(config, `/${config.indexName}`, {
    method: 'GET',
    timeoutMs: readOpenSearchWriteTimeoutMs(),
  });

  if (headResult.ok) {
    return true;
  }

  const createResult = await requestOpenSearch<Record<string, unknown>>(config, `/${config.indexName}`, {
    method: 'PUT',
    timeoutMs: readOpenSearchWriteTimeoutMs(),
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(INDEX_CREATE_BODY),
  });

  return createResult.ok || createResult.status === 400;
}

export function hasOpenSearchConfig(): boolean {
  return Boolean(readOpenSearchConfig());
}

export async function ensureSearchIndex(): Promise<boolean> {
  const config = readOpenSearchConfig();
  if (!config) {
    return false;
  }

  if (!ensureIndexPromise) {
    ensureIndexPromise = ensureIndexInternal(config);
  }

  return ensureIndexPromise;
}

function toIndexedDocument(document: SearchIndexDocument): Record<string, unknown> {
  return {
    id: document.id,
    slug: document.slug,
    href: document.href,
    title: document.title,
    title_exact: document.title.toLowerCase(),
    image: document.image,
    subtitle: document.subtitle || '',
    meta_line: document.metaLine || '',
    badge_text: document.badgeText || '',
    route_type: document.routeType,
    theme: document.theme,
    keywords: document.keywords || [],
    popularity: document.popularity ?? 0,
    updated_at: document.updatedAt || new Date().toISOString(),
  };
}

export async function upsertSearchDocuments(documents: SearchIndexDocument[]): Promise<boolean> {
  const config = readOpenSearchConfig();
  if (!config || documents.length === 0) {
    return false;
  }

  const ready = await ensureSearchIndex();
  if (!ready) {
    return false;
  }

  const lines = documents.flatMap((document) => [
    JSON.stringify({ index: { _index: config.indexName, _id: document.id } }),
    JSON.stringify(toIndexedDocument(document)),
  ]);

  const response = await requestOpenSearch<Record<string, unknown>>(config, '/_bulk', {
    method: 'POST',
    timeoutMs: readOpenSearchWriteTimeoutMs(),
    headers: {
      'Content-Type': 'application/x-ndjson',
    },
    body: `${lines.join('\n')}\n`,
  });

  return response.ok;
}

function mapSearchHits(
  response: OpenSearchSearchResponse | null,
): Array<SearchIndexDocument & { score?: number }> {
  return (response?.hits?.hits || []).map((hit) => {
    const source = hit._source || {};
    return {
      id: String(source.id || hit._id || ''),
      slug: String(source.slug || ''),
      href: String(source.href || ''),
      title: String(source.title || ''),
      image: String(source.image || ''),
      subtitle: typeof source.subtitle === 'string' ? source.subtitle : undefined,
      metaLine: typeof source.meta_line === 'string' ? source.meta_line : undefined,
      badgeText: typeof source.badge_text === 'string' ? source.badge_text : undefined,
      routeType: String(source.route_type || 'series') as SearchIndexDocument['routeType'],
      theme: String(source.theme || 'drama') as SearchIndexDocument['theme'],
      keywords: Array.isArray(source.keywords) ? source.keywords.map((keyword) => String(keyword)) : [],
      popularity: typeof source.popularity === 'number' ? source.popularity : undefined,
      updatedAt: typeof source.updated_at === 'string' ? source.updated_at : undefined,
      score: typeof hit._score === 'number' ? hit._score : undefined,
    };
  }).filter((item) => item.id && item.title && item.href);
}

async function executeSearchRequest(
  config: OpenSearchConfig,
  indexName: string,
  body: Record<string, unknown>,
): Promise<Array<SearchIndexDocument & { score?: number }> | null> {
  const response = await requestOpenSearch<OpenSearchSearchResponse>(config, `/${indexName}/_search`, {
    method: 'POST',
    timeoutMs: readOpenSearchSearchTimeoutMs(),
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return mapSearchHits(response.data);
}

export async function searchIndexedDocuments({
  query,
  domain,
  limit,
}: SearchOpenSearchInput): Promise<Array<SearchIndexDocument & { score?: number }> | null> {
  const config = readOpenSearchConfig();
  if (!config) {
    return null;
  }

  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const primaryResults = await executeSearchRequest(
    config,
    config.indexName,
    buildPrimarySearchRequestBody({ query: normalizedQuery, domain, limit }),
  );
  if (primaryResults === null) {
    return null;
  }
  if (primaryResults.length > 0 || normalizedQuery.length < 4) {
    return primaryResults;
  }

  return executeSearchRequest(
    config,
    config.indexName,
    buildFuzzySearchRequestBody({ query: normalizedQuery, domain, limit }),
  );
}
