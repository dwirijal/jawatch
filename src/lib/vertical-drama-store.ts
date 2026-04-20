import { readStoredJson, writeStoredJson } from './browser-storage.ts';

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
  const parsed = readStoredJson(STORAGE_KEY);
  if (parsed && typeof parsed === 'object') {
    return parsed as ResumeMap;
  }

  return {};
}

function writeResumeMap(value: ResumeMap) {
  writeStoredJson(STORAGE_KEY, value);
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
