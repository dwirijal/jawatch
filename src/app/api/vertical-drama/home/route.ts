import { getVerticalDramaHomeFromDb } from '@/lib/server/drama-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entry = searchParams.get('entry') === 'dramabox' ? 'dramabox' : 'drachin';
  const home = await getVerticalDramaHomeFromDb(entry);
  if (entry === 'dramabox') {
    return Response.json({
      latest: home.latest,
      trending: home.trending,
    });
  }
  return Response.json({
    featured: home.featured,
    latest: home.latest,
    popular: home.popular,
  });
}
