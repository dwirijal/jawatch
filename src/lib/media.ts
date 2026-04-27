type MediaProvider = 'sanka' | 'kanata-movie';

export const SANKA_BASE_URL = 'https://www.sankavollerei.com';
export const KANATA_MOVIE_BASE_URL = 'https://api.kanata.web.id/movietube';

function buildSankaHeaders(): HeadersInit {
  const baseHeaders: HeadersInit = {
    Accept: 'application/json, text/plain, */*',
  };

  if (typeof window !== 'undefined') {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${SANKA_BASE_URL}/anime/`,
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  };
}

function buildKanataHeaders(): HeadersInit {
  return {
    Accept: 'application/json, text/plain, */*',
  };
}

export function buildSankaUrl(path: string): string {
  return `${SANKA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildKanataMovieUrl(path: string): string {
  return `${KANATA_MOVIE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildMediaUrl(provider: MediaProvider, path: string): string {
  switch (provider) {
    case 'sanka':
      return buildSankaUrl(path);
    case 'kanata-movie':
      return buildKanataMovieUrl(path);
    default:
      return path;
  }
}

function buildMediaHeaders(provider: MediaProvider): HeadersInit {
  switch (provider) {
    case 'sanka':
      return buildSankaHeaders();
    case 'kanata-movie':
      return buildKanataHeaders();
    default:
      return { Accept: 'application/json, text/plain, */*' };
  }
}

export async function fetchMediaJson<T>(provider: MediaProvider, path: string): Promise<T> {
  const response = await fetch(buildMediaUrl(provider, path), {
    headers: buildMediaHeaders(provider),
  });

  if (!response.ok) {
    throw new Error(`${provider} request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSankaJson<T>(path: string): Promise<T> {
  return fetchMediaJson<T>('sanka', path);
}

export async function fetchKanataMovieJson<T>(path: string): Promise<T> {
  return fetchMediaJson<T>('kanata-movie', path);
}
