const DEAD_LK21_HOST = 'lk21.apivalidasi.my.id';
const LIVE_LK21_IFRAME_HOST = 'playeriframe.sbs';
const LIVE_LK21_IFRAME_BASE = `https://${LIVE_LK21_IFRAME_HOST}/iframe/p2p/`;
const LIVE_LK21_STREAM_HOST = 'cloud.hownetwork.xyz';
const LIVE_LK21_STREAM_ORIGIN = `https://${LIVE_LK21_STREAM_HOST}`;
const NGOPI_HOST = 'ngopi.web.id';
const NGOPI_PATH = '/dl.php';
const LK21_PROXY_MANIFEST_PATH = '/api/lk21/manifest';
const LK21_PROXY_STREAM_PATH = '/api/lk21/stream';
const LK21_SEGMENT_HOST_SUFFIXES = [
  'buwirope.xyz',
  'defokula.xyz',
  'fexandra.xyz',
  'fukanazo.xyz',
  'kisenupi.xyz',
  'leyazome.xyz',
  'murejivo.xyz',
  'nemobavi.xyz',
  'nizurelo.xyz',
  'petiwola.xyz',
  'pofenuza.xyz',
  'rufowupe.xyz',
  'ruvaxijo.xyz',
  'talinera.xyz',
  'tejabova.xyz',
  'witokari.xyz',
  'xijurova.xyz',
  'zopulake.xyz',
  'zorawenu.xyz',
  'zulipade.xyz',
] as const;
const DEFAULT_BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type Lk21SourcePayload = {
  file?: unknown;
  message?: unknown;
};

export function rewriteDeadLk21MirrorUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  if (parsed.hostname !== DEAD_LK21_HOST || parsed.pathname !== '/pemutar-video') {
    return trimmed;
  }

  const id = parsed.searchParams.get('id')?.trim();
  if (!id) {
    return trimmed;
  }

  return `${LIVE_LK21_IFRAME_BASE}${encodeURIComponent(id)}`;
}

export function extractLk21PlaybackId(rawUrl: string): string | null {
  const trimmed = rewriteDeadLk21MirrorUrl(rawUrl).trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'https://jawatch.local');
  } catch {
    return null;
  }

  if (parsed.hostname === LIVE_LK21_IFRAME_HOST && parsed.pathname.startsWith('/iframe/p2p/')) {
    const encodedId = parsed.pathname.slice('/iframe/p2p/'.length).split('/')[0]?.trim();
    return encodedId ? decodeURIComponent(encodedId) : null;
  }

  if (parsed.hostname === LIVE_LK21_STREAM_HOST && parsed.pathname === '/video.php') {
    return parsed.searchParams.get('id')?.trim() || null;
  }

  if (
    (parsed.hostname === 'jawatch.web.id' || parsed.hostname === 'jawatch.local' || !parsed.hostname) &&
    (parsed.pathname === LK21_PROXY_MANIFEST_PATH || parsed.pathname === LK21_PROXY_STREAM_PATH)
  ) {
    return parsed.searchParams.get('id')?.trim() || null;
  }

  return null;
}

export function buildLk21ProxyManifestUrl(playbackId: string): string {
  return `${LK21_PROXY_MANIFEST_PATH}?id=${encodeURIComponent(playbackId)}`;
}

export function buildLk21ExternalPlayerUrl(playbackId: string): string {
  return `${LIVE_LK21_STREAM_ORIGIN}/video.php?id=${encodeURIComponent(playbackId)}`;
}

export function buildLk21ProxyStreamUrl(targetUrl: string, playbackId: string): string {
  return `${LK21_PROXY_STREAM_PATH}?u=${encodeURIComponent(targetUrl)}&id=${encodeURIComponent(playbackId)}`;
}

export function isAllowedLk21StreamHost(hostname: string): boolean {
  if (hostname === LIVE_LK21_STREAM_HOST) {
    return true;
  }

  return LK21_SEGMENT_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
}

export function isAllowedLk21StreamUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && isAllowedLk21StreamHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function buildLk21UpstreamHeaders(playbackId: string, extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', '*/*');
  }
  headers.set('Origin', LIVE_LK21_STREAM_ORIGIN);
  headers.set('Referer', `${LIVE_LK21_STREAM_ORIGIN}/video.php?id=${encodeURIComponent(playbackId)}`);
  headers.set('User-Agent', headers.get('User-Agent') || DEFAULT_BROWSER_USER_AGENT);
  return headers;
}

export function rewriteLk21ManifestText(manifestText: string, upstreamUrl: string, playbackId: string): string {
  return manifestText
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return line;
      }

      let resolved: string;
      try {
        resolved = new URL(trimmed, upstreamUrl).toString();
      } catch {
        return line;
      }

      return isAllowedLk21StreamUrl(resolved)
        ? buildLk21ProxyStreamUrl(resolved, playbackId)
        : line;
    })
    .join('\n');
}

function isNgopiLk21Url(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.hostname === NGOPI_HOST && parsed.pathname === NGOPI_PATH;
  } catch {
    return false;
  }
}

async function defaultFetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7_500);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchLk21SourcePayload(playbackId: string, fetcher: Fetcher = defaultFetchWithTimeout): Promise<Lk21SourcePayload | null> {
  const apiUrl = `${LIVE_LK21_STREAM_ORIGIN}/api2.php?id=${encodeURIComponent(playbackId)}`;
  const response = await fetcher(apiUrl, {
    method: 'POST',
    cache: 'no-store',
    headers: buildLk21UpstreamHeaders(playbackId, {
      Accept: 'application/json,text/plain,*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: new URLSearchParams({
      r: `${LIVE_LK21_IFRAME_BASE}${encodeURIComponent(playbackId)}`,
      d: LIVE_LK21_STREAM_HOST,
    }).toString(),
  });

  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as Lk21SourcePayload;
  } catch {
    return null;
  }
}

export async function fetchLk21PlaybackManifestUrl(
  playbackId: string,
  fetcher: Fetcher = defaultFetchWithTimeout,
): Promise<string> {
  const payload = await fetchLk21SourcePayload(playbackId, fetcher);
  const manifestUrl = typeof payload?.file === 'string' ? payload.file.trim() : '';

  if (!manifestUrl || !isAllowedLk21StreamUrl(manifestUrl)) {
    throw new Error(`LK21 manifest unavailable for ${playbackId}`);
  }

  return manifestUrl;
}

export async function resolveLk21MovieProviderUrl(
  rawUrl: string,
  fetcher: Fetcher = defaultFetchWithTimeout,
): Promise<string> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  const directId = extractLk21PlaybackId(trimmed);
  if (directId) {
    return buildLk21ProxyManifestUrl(directId);
  }

  if (!isNgopiLk21Url(trimmed)) {
    return trimmed;
  }

  try {
    const response = await fetcher(trimmed, {
      cache: 'no-store',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual',
    });
    const location = response.headers.get('location')?.trim() ?? '';
    if (location) {
      const redirectedId = extractLk21PlaybackId(new URL(location, trimmed).toString());
      if (redirectedId) {
        return buildLk21ProxyManifestUrl(redirectedId);
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
