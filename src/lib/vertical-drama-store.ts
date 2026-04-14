export type VerticalDramaProvider = 'drachin' | 'dramabox';

export const DEFAULT_VERTICAL_DRAMA_BASE_PATH = '/series/short';

type DramaboxHrefInput = {
  slug: string;
  title: string;
  image?: string;
  subtitle?: string;
  bookId?: string;
};

type ResumeEntry = {
  episodeIndex: number;
  updatedAt: number;
};

type ResumeMap = Record<string, ResumeEntry>;

const STORAGE_KEY = 'dwizzy_vertical_drama_resume';

function getResumeKey(provider: VerticalDramaProvider, id: string): string {
  return `${provider}:${id}`;
}

function readResumeMap(): ResumeMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as ResumeMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeResumeMap(value: ResumeMap) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function saveVerticalDramaProgress(provider: VerticalDramaProvider, id: string, episodeIndex: number) {
  if (typeof window === 'undefined' || !id || !Number.isFinite(episodeIndex) || episodeIndex <= 0) {
    return;
  }

  const current = readResumeMap();
  current[getResumeKey(provider, id)] = {
    episodeIndex,
    updatedAt: Date.now(),
  };
  writeResumeMap(current);
}

export function getVerticalDramaProgress(provider: VerticalDramaProvider, id: string): ResumeEntry | null {
  const current = readResumeMap();
  return current[getResumeKey(provider, id)] ?? null;
}

export function getVerticalDramaChunkIndex(episodeIndex: number, chunkSize = 20): number {
  if (!Number.isFinite(episodeIndex) || episodeIndex <= 0) {
    return 0;
  }

  return Math.floor((episodeIndex - 1) / chunkSize);
}

export function isVerticalDramaEpisodeWatched(
  provider: VerticalDramaProvider,
  id: string,
  episodeIndex: number
): boolean {
  const resume = getVerticalDramaProgress(provider, id);
  if (!resume || !Number.isFinite(episodeIndex) || episodeIndex <= 0) {
    return false;
  }

  return episodeIndex <= resume.episodeIndex;
}

export function buildVerticalDramaStoryHref(slug: string, basePath = DEFAULT_VERTICAL_DRAMA_BASE_PATH): string {
  return `${basePath}/${slug}`;
}

export function buildVerticalDramaWatchHref(
  slug: string,
  basePath = DEFAULT_VERTICAL_DRAMA_BASE_PATH,
  fallbackIndex = 1,
): string {
  return `${basePath}/watch/${slug}?index=${fallbackIndex}`;
}

export function buildVerticalDramaDramaboxHref(
  item: DramaboxHrefInput,
  basePath = DEFAULT_VERTICAL_DRAMA_BASE_PATH,
): string {
  const params = new URLSearchParams();
  params.set('title', item.title);
  if (item.image) {
    params.set('image', item.image);
  }
  if (item.subtitle) {
    params.set('subtitle', item.subtitle);
  }
  if (item.bookId) {
    params.set('bookId', item.bookId);
  }

  return `${basePath}/dramabox/${item.bookId || item.slug}?${params.toString()}`;
}

export function getDrachinPlaybackTarget(
  slug: string,
  fallbackIndex = 1,
  basePath = DEFAULT_VERTICAL_DRAMA_BASE_PATH,
): { href: string; episodeIndex: number } {
  const resume = getVerticalDramaProgress('drachin', slug);
  const episodeIndex = resume?.episodeIndex ?? fallbackIndex;
  return {
    href: buildVerticalDramaWatchHref(slug, basePath, episodeIndex),
    episodeIndex,
  };
}

export function getDrachinPlaybackHref(
  slug: string,
  fallbackIndex = 1,
  basePath = DEFAULT_VERTICAL_DRAMA_BASE_PATH,
): string {
  return getDrachinPlaybackTarget(slug, fallbackIndex, basePath).href;
}
