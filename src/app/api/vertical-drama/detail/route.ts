import { getVerticalDramaDetailFromDb } from '@/lib/server/drama-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.trim() || '';
  const detail = slug ? await getVerticalDramaDetailFromDb(slug) : null;
  return Response.json(detail);
}
