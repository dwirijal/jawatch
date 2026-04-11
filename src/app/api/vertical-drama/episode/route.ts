import { getVerticalDramaEpisodeFromDb } from '@/lib/server/drama-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.trim() || '';
  const parsedIndex = Number.parseInt(searchParams.get('index') || '1', 10);
  const index = Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex : 1;
  const detail = slug ? await getVerticalDramaEpisodeFromDb(slug, index) : null;
  return Response.json(detail);
}
