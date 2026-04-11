import type { NovelDetail, NovelGenre, NovelListItem, NovelRead } from '@/lib/types';

export async function getNovelHome() {
  return {
    featured: [] as NovelListItem[],
    latest: [] as NovelListItem[],
  };
}

export async function getNovelGenres(): Promise<NovelGenre[]> {
  return [];
}

export async function getNovelsByGenre(slug?: string): Promise<NovelListItem[]> {
  void slug;
  return [];
}

export async function getNovelDetail(slug?: string): Promise<NovelDetail | null> {
  void slug;
  return null;
}

export async function getNovelRead(slug?: string): Promise<NovelRead | null> {
  void slug;
  return null;
}
