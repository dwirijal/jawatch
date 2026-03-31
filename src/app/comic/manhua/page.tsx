import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype = 'manhua';

export default async function ComicManhuaPage() {
  const { popular, newest } = await loadComicPageData(VARIANT);

  return (
    <ComicPageClient
      variant={VARIANT}
      routeBase="/comic"
      initialPopular={popular}
      initialNewest={newest}
    />
  );
}
