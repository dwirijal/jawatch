export type ComicDataSource = 'database' | 'gateway';

function normalizeMode(value: string): ComicDataSource | '' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'database' || normalized === 'gateway') {
    return normalized;
  }
  return '';
}

export function readComicDataSource(): ComicDataSource {
  const explicit = normalizeMode(process.env.COMIC_DATA_SOURCE || '');
  if (explicit) {
    return explicit;
  }

  return process.env.DATABASE_URL?.trim() ? 'database' : 'gateway';
}

export function shouldUseComicGateway(): boolean {
  return readComicDataSource() === 'gateway';
}

export function readComicApiBaseUrl(): string {
  return (process.env.COMIC_API_BASE_URL || '').trim().replace(/\/+$/, '');
}

export function readComicOriginSharedToken(): string {
  return (process.env.COMIC_ORIGIN_SHARED_TOKEN || '').trim();
}

export function buildComicGatewayUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const baseUrl = readComicApiBaseUrl();
  if (!baseUrl) {
    throw new Error('COMIC_API_BASE_URL is required when COMIC_DATA_SOURCE=gateway');
  }

  const trimmedPath = path.trim();
  const normalizedPath = trimmedPath.replace(/^\/+/, '');
  const url = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const basePath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  url.pathname = `${basePath}${normalizedPath}`.replace(/\/{2,}/g, '/');

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
