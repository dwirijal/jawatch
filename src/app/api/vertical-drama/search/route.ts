import { searchVerticalDramaFromDb } from '@/lib/server/drama-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const results = await searchVerticalDramaFromDb(query);
  return Response.json(results);
}
