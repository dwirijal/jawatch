import type { MangaSubtype } from '@/lib/types';
import { SHORTS_HUB_ENABLED } from './shorts-paths.ts';

export type HubSegment = {
  href: string;
  label: string;
  description: string;
};

export type SeriesHubFilter = 'all' | 'anime' | 'donghua' | 'drama';
export type ComicHubFilter = 'all' | MangaSubtype;

export const WATCH_PRIMARY_SEGMENTS: readonly HubSegment[] = Object.freeze(
  SHORTS_HUB_ENABLED
    ? [
        {
          href: '/watch/shorts',
          label: 'Shorts',
          description: 'Cerita vertikal buat sesi nonton singkat.',
        },
        {
          href: '/watch/series',
          label: 'Series',
          description: 'Anime, donghua, dan drama dalam satu rak nonton.',
        },
        {
          href: '/watch/movies',
          label: 'Film',
          description: 'Film populer, baru update, dan siap dipilih.',
        },
      ]
    : [
        {
          href: '/watch/series',
          label: 'Series',
          description: 'Anime, donghua, dan drama dalam satu rak nonton.',
        },
        {
          href: '/watch/movies',
          label: 'Film',
          description: 'Film populer, baru update, dan siap dipilih.',
        },
      ],
);

export const READ_PRIMARY_SEGMENTS: readonly HubSegment[] = Object.freeze([
  {
    href: '/read/comics',
    label: 'Komik',
    description: 'Manga, manhwa, dan manhua dalam satu rak baca.',
  },
]);

export const SERIES_FILTER_SEGMENTS: readonly HubSegment[] = Object.freeze([
  {
    href: '/watch/series',
    label: 'Semua',
    description: 'Lihat semua anime, donghua, dan drama.',
  },
  {
    href: '/watch/series?type=anime',
    label: 'Anime',
    description: 'Tampilkan anime saja.',
  },
  {
    href: '/watch/series?type=donghua',
    label: 'Donghua',
    description: 'Tampilkan donghua saja.',
  },
  {
    href: '/watch/series?type=drama',
    label: 'Drama',
    description: 'Tampilkan drama saja.',
  },
]);

export const COMIC_FILTER_SEGMENTS: readonly HubSegment[] = Object.freeze([
  {
    href: '/read/comics',
    label: 'Semua',
    description: 'Lihat semua manga, manhwa, dan manhua.',
  },
  {
    href: '/read/comics?type=manga',
    label: 'Manga',
    description: 'Tampilkan manga saja.',
  },
  {
    href: '/read/comics?type=manhwa',
    label: 'Manhwa',
    description: 'Tampilkan manhwa saja.',
  },
  {
    href: '/read/comics?type=manhua',
    label: 'Manhua',
    description: 'Tampilkan manhua saja.',
  },
]);

export function buildSeriesFilterHref(filter: SeriesHubFilter): string {
  if (filter === 'all') {
    return '/watch/series';
  }

  return `/watch/series?type=${filter}`;
}

export function buildComicFilterHref(filter: ComicHubFilter): string {
  if (filter === 'all') {
    return '/read/comics';
  }

  return `/read/comics?type=${filter}`;
}
