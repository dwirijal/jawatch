const ALLOWED_COMIC_IMAGE_HOSTS = new Set([
  'bacaman00.sokuja.id',
]);

function inferImageContentType(url: URL): string {
  const pathname = url.pathname.toLowerCase();
  if (pathname.endsWith('.avif')) return 'image/avif';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.gif')) return 'image/gif';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get('url')?.trim();

  if (!rawUrl) {
    return new Response('Missing image url', { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return new Response('Invalid image url', { status: 400 });
  }

  if ((targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') || !ALLOWED_COMIC_IMAGE_HOSTS.has(targetUrl.hostname)) {
    return new Response('Image host not allowed', { status: 400 });
  }

  const upstream = await fetch(targetUrl, {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'User-Agent': 'dwizzyWEEB-image-proxy/1.0',
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream image unavailable', { status: upstream.status || 502 });
  }

  const upstreamContentType = upstream.headers.get('content-type')?.trim() ?? '';
  const contentType = upstreamContentType.startsWith('image/')
    ? upstreamContentType
    : inferImageContentType(targetUrl);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
      'content-type': contentType,
    },
  });
}
