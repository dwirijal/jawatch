import 'server-only';

import { getComicDb, hasComicDatabase, closeComicDb } from './comic-db';
import {
  buildComicCacheKey,
  deleteComicCacheValue,
  getComicCacheValue,
  hasComicCache,
  rememberComicCacheValue,
  setComicCacheValue,
} from './comic-cache';
import { hasComicAnalyticsSink, trackComicAnalyticsEvent } from './comic-analytics';

export const comicService = {
  db: {
    available: hasComicDatabase,
    get: getComicDb,
    close: closeComicDb,
  },
  cache: {
    available: hasComicCache,
    key: buildComicCacheKey,
    get: getComicCacheValue,
    set: setComicCacheValue,
    delete: deleteComicCacheValue,
    remember: rememberComicCacheValue,
  },
  analytics: {
    available: hasComicAnalyticsSink,
    track: trackComicAnalyticsEvent,
  },
} as const;

export type ComicService = typeof comicService;

