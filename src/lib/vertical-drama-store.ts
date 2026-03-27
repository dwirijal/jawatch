export type VerticalDramaProvider = 'drachin' | 'dramabox';

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

export function getDrachinPlaybackHref(slug: string, fallbackIndex = 1): string {
  const resume = getVerticalDramaProgress('drachin', slug);
  const index = resume?.episodeIndex ?? fallbackIndex;
  return `/drachin/episode/${slug}?index=${index}`;
}
