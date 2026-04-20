import {
  buildLk21UpstreamHeaders,
  isAllowedLk21StreamUrl,
  rewriteLk21ManifestText,
} from '@/lib/adapters/movie-lk21-stream-resolver';

export const runtime = 'nodejs';

function buildProxyResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of ['accept-ranges', 'content-length', 'content-range', 'content-type', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  headers.set('cache-control', 'private, no-store');
  return headers;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawTargetUrl = requestUrl.searchParams.get('u')?.trim() ?? '';
  const playbackId = requestUrl.searchParams.get('id')?.trim() ?? '';

  if (!rawTargetUrl || !playbackId) {
    return new Response('Missing LK21 stream target', { status: 400 });
  }

  if (!isAllowedLk21StreamUrl(rawTargetUrl)) {
    return new Response('LK21 stream target not allowed', { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawTargetUrl);
  } catch {
    return new Response('Invalid LK21 stream target', { status: 400 });
  }

  const headers = buildLk21UpstreamHeaders(playbackId, {
    Accept: request.headers.get('accept')?.trim() || '*/*',
  });
  const range = request.headers.get('range')?.trim();
  if (range) {
    headers.set('Range', range);
  }

  const upstream = await fetch(targetUrl, {
    cache: 'no-store',
    headers,
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('LK21 upstream stream unavailable', { status: upstream.status || 502 });
  }

  const contentType = upstream.headers.get('content-type')?.trim().toLowerCase() ?? '';
  const isManifest = targetUrl.pathname.endsWith('.m3u8') || contentType.includes('mpegurl');
  if (isManifest) {
    const manifestText = await upstream.text();
    return new Response(rewriteLk21ManifestText(manifestText, targetUrl.toString(), playbackId), {
      status: upstream.status,
      headers: {
        'cache-control': 'private, no-store',
        'content-type': 'application/vnd.apple.mpegurl',
      },
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: buildProxyResponseHeaders(upstream),
  });
}
