import ComicPageClient from '@/app/comic/ComicPageClient';
import { loadComicPageData } from '@/app/comic/loadComicPageData';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype = 'manga';

export default async function ComicMangaPage() {
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
