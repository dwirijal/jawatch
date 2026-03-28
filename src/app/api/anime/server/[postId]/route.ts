import { fetchSankaJson } from '@/lib/media';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

type SankaServerPayload = {
  data?: {
    url?: string;
  };
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ postId: string }> },
) {
  const { postId } = await context.params;
  const trimmedPostId = postId.trim();

  if (!trimmedPostId) {
    return Response.json({ error: 'Missing postId' }, { status: 400 });
  }

  try {
    const payload = await fetchSankaJson<SankaServerPayload>(`/anime/samehadaku/server/${encodeURIComponent(trimmedPostId)}`);
    const url = payload.data?.url?.trim() || '';

    if (!url) {
      return Response.json({ error: 'Resolved server URL unavailable' }, { status: 502 });
    }

    return Response.json(
      { url },
      {
        headers: {
          'Cache-Control': buildEdgeCacheControl(300, 1800),
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resolve stream URL';
    return Response.json({ error: message }, { status: 502 });
  }
}
