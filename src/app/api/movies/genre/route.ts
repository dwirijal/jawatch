import { getMovieGenreItems } from '@/lib/adapters/movie';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = (searchParams.get('genre') || '').trim();
  const limit = Number(searchParams.get('limit') || '24');

  if (!genre) {
    return Response.json([]);
  }

  const results = await getMovieGenreItems(genre, Number.isFinite(limit) ? limit : 24).catch(() => []);
  return Response.json(results, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(900, 3600),
    },
  });
}
