import * as Sentry from '@sentry/nextjs';
import {
  buildLk21UpstreamHeaders,
  fetchLk21PlaybackManifestUrl,
  rewriteLk21ManifestText,
} from '@/lib/adapters/movie-lk21-stream-resolver';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const playbackId = requestUrl.searchParams.get('id')?.trim() ?? '';

  if (!playbackId) {
    return new Response('Missing LK21 playback id', { status: 400 });
  }

  try {
    const manifestUrl = await fetchLk21PlaybackManifestUrl(playbackId);
    const upstream = await fetch(manifestUrl, {
      cache: 'no-store',
      headers: buildLk21UpstreamHeaders(playbackId, {
        Accept: 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*;q=0.8',
      }),
    });

    if (!upstream.ok) {
      return new Response('LK21 manifest unavailable', { status: 502 });
    }

    const manifestText = await upstream.text();
    return new Response(rewriteLk21ManifestText(manifestText, manifestUrl, playbackId), {
      status: 200,
      headers: {
        'cache-control': 'private, no-store',
        'content-type': 'application/vnd.apple.mpegurl',
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return new Response('LK21 manifest unavailable', { status: 502 });
  }
}

