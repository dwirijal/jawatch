import { normalizeComicImageUrl } from '../comic-media.ts';
import type { ChapterDetail } from '../types.ts';

export function normalizeChapterImages(images: string[]): string[] {
  const seenImages = new Set<string>();

  return images
    .map((image) => normalizeComicImageUrl(image))
    .filter(Boolean)
    .filter((image) => {
      if (seenImages.has(image)) {
        return false;
      }

      seenImages.add(image);
      return true;
    });
}

export function normalizeChapterDetailPayload(chapter: ChapterDetail): ChapterDetail {
  return {
    ...chapter,
    images: normalizeChapterImages(chapter.images),
  };
}
