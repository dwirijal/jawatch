export type MediaType = 'manga' | 'anime' | 'donghua' | 'movie' | 'drama';
export type InterestType = MediaType;

export interface HistoryItem {
  id: string; // slug
  type: MediaType;
  title: string;
  image: string;
  lastChapterOrEpisode: string;
  lastLink: string;
  timestamp: number;
}

export interface BookmarkItem {
  id: string; 
  type: MediaType;
  title: string;
  image: string;
  timestamp: number;
}

const HISTORY_KEY = 'dwizzy_history';
const BOOKMARKS_KEY = 'dwizzy_bookmarks';
const INTEREST_KEY = 'dwizzy_interests';
const DEAD_MIRRORS_KEY = 'dwizzy_dead_mirrors';
const VIDEO_TRAILER_PREF_KEY = 'dwizzy_video_trailer_pref';

export function canUseLocalHistory(authenticated: boolean): boolean {
  return authenticated;
}

// --- DEAD MIRRORS (Source Filtering) ---
export function reportDeadMirror(url: string) {
  if (typeof window === 'undefined') return;
  const dead = getDeadMirrors();
  if (!dead.includes(url)) {
    const updated = [...dead, url].slice(-50); // Keep last 50 reported
    localStorage.setItem(DEAD_MIRRORS_KEY, JSON.stringify(updated));
  }
}

export function getDeadMirrors(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(DEAD_MIRRORS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// --- HISTORY ---
export function saveHistory(item: HistoryItem) {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  const filtered = history.filter(h => h.id !== item.id);
  const updated = [item, ...filtered].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  incrementInterest(item.type);
}

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getHistoryForAuth(authenticated: boolean): HistoryItem[] {
  if (!canUseLocalHistory(authenticated)) {
    return [];
  }

  return getHistory();
}

export function saveHistoryForAuth(authenticated: boolean, item: HistoryItem): boolean {
  if (!canUseLocalHistory(authenticated)) {
    return false;
  }

  saveHistory(item);
  return true;
}

export function clearHistory() {
  if (typeof window !== 'undefined') localStorage.removeItem(HISTORY_KEY);
}

// --- BOOKMARKS ---
export function toggleBookmark(item: BookmarkItem): boolean {
  if (typeof window === 'undefined') return false;
  const bookmarks = getBookmarks();
  const exists = bookmarks.find(b => b.id === item.id);
  
  let updated;
  let isAdded = false;

  if (exists) {
    updated = bookmarks.filter(b => b.id !== item.id);
  } else {
    updated = [item, ...bookmarks];
    isAdded = true;
    incrementInterest(item.type);
  }
  
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  return isAdded;
}

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BOOKMARKS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function checkIsBookmarked(id: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === id);
}

// --- INTERESTS ---
export function incrementInterest(type: MediaType) {
  if (typeof window === 'undefined') return;
  const interests = getInterests();
  interests[type] = (interests[type] || 0) + 1;
  localStorage.setItem(INTEREST_KEY, JSON.stringify(interests));
}

export function getInterests(): Record<MediaType, number> {
  const defaultInterests: Record<MediaType, number> = { manga: 0, anime: 0, donghua: 0, movie: 0, drama: 0 };
  if (typeof window === 'undefined') return defaultInterests;
  const data = localStorage.getItem(INTEREST_KEY);
  if (!data) return defaultInterests;
  try {
    return { ...defaultInterests, ...JSON.parse(data) };
  } catch {
    return defaultInterests;
  }
}

// --- VIDEO TRAILER PREFERENCE ---
export function getVideoTrailerPreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(VIDEO_TRAILER_PREF_KEY);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export function setVideoTrailerPreference(value: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VIDEO_TRAILER_PREF_KEY, String(value));
}

// Kept for backward compatibility
export interface RecentManga {
  slug: string;
  title: string;
  image: string;
  lastReadAt: number;
}

export function saveRecentManga(item: RecentManga) {
  saveHistory({
    id: item.slug,
    type: 'manga',
    title: item.title,
    image: item.image,
    lastChapterOrEpisode: 'Recently viewed',
    lastLink: `/manga/${item.slug}`,
    timestamp: item.lastReadAt,
  });
}

export function getRecentManga(): RecentManga[] {
  const history = getHistory().filter(h => h.type === 'manga');
  return history.map(h => ({
    slug: h.id,
    title: h.title,
    image: h.image,
    lastReadAt: h.timestamp
  }));
}
