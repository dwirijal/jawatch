import {
  canUseBrowserStorage,
  readStoredJson,
  readStoredString,
  writeStoredJson,
  writeStoredString,
} from '../browser-storage.ts';

const DEAD_MIRRORS_KEY = 'dwizzy_dead_mirrors';
const VIDEO_TRAILER_PREF_KEY = 'dwizzy_video_trailer_pref';

export function reportDeadMirror(url: string) {
  if (!canUseBrowserStorage()) return;
  const dead = getDeadMirrors();
  if (!dead.includes(url)) {
    const updated = [...dead, url].slice(-50);
    writeStoredJson(DEAD_MIRRORS_KEY, updated);
  }
}

export function getDeadMirrors(): string[] {
  if (!canUseBrowserStorage()) return [];
  const parsed = readStoredJson(DEAD_MIRRORS_KEY);
  return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
}

export function getVideoTrailerPreference(): boolean | null {
  if (!canUseBrowserStorage()) return null;
  const value = readStoredString(VIDEO_TRAILER_PREF_KEY);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export function setVideoTrailerPreference(value: boolean) {
  if (!canUseBrowserStorage()) return;
  writeStoredString(VIDEO_TRAILER_PREF_KEY, String(value));
}
