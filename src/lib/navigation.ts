import { BookMarked, BookOpen, Clapperboard, Home, Play, Search, UserRound, Zap } from 'lucide-react';
import { SHORTS_HUB_ENABLED } from './shorts-paths.ts';

export type NavigationLeafItem = {
  description: string;
  href?: string;
  label: string;
};

export type NavigationGroup = {
  description: string;
  icon: typeof Home;
  isActive?: (pathname: string, href: string) => boolean;
  key: 'watch' | 'read' | 'vault';
  label: string;
  items: NavigationLeafItem[];
};

export type NavigationPrimaryItem =
  | {
      href: string;
      icon: typeof Home;
      key: 'home' | 'vault';
      label: string;
      match: (pathname: string) => boolean;
      type: 'link';
    }
  | {
      group: NavigationGroup;
      key: NavigationGroup['key'];
      match: (pathname: string) => boolean;
      type: 'group';
    };

function startsWithPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function startsWithAnyPath(pathname: string, hrefs: readonly string[]): boolean {
  return hrefs.some((href) => startsWithPath(pathname, href));
}

function createGroupPathMatcher(pathAliases: Record<string, readonly string[]>) {
  return (pathname: string, href: string) => startsWithAnyPath(pathname, pathAliases[href] ?? [href]);
}

const WATCH_PATH_ALIASES: Record<string, readonly string[]> = {
  '/watch': ['/watch'],
  '/watch/movies': ['/watch/movies', '/movies'],
  '/watch/series': ['/watch/series', '/series'],
  '/watch/shorts': ['/watch/shorts', '/shorts'],
};

const READ_PATH_ALIASES: Record<string, readonly string[]> = {
  '/read': ['/read'],
  '/read/comics': ['/read/comics', '/comics'],
};

const VAULT_PATH_ALIASES: Record<string, readonly string[]> = {
  '/vault': ['/vault'],
};

const WATCH_GROUP: NavigationGroup = {
  key: 'watch',
  label: 'Nonton',
  icon: Clapperboard,
  description: SHORTS_HUB_ENABLED
    ? 'Film, series, dan shorts dalam satu rak nonton.'
    : 'Film dan series dalam satu rak nonton.',
  isActive: createGroupPathMatcher(WATCH_PATH_ALIASES),
  items: [
    { label: 'Beranda nonton', href: '/watch', description: 'Mulai pilih tontonan dari sini.' },
    { label: 'Film', href: '/watch/movies', description: 'Film populer, terbaru, dan siap diputar.' },
    { label: 'Series', href: '/watch/series', description: 'Anime, donghua, dan drama episodik.' },
    ...(SHORTS_HUB_ENABLED
      ? [{ label: 'Shorts', href: '/watch/shorts', description: 'Cerita vertikal buat sesi cepat.' }]
      : []),
  ],
};

const READ_GROUP: NavigationGroup = {
  key: 'read',
  label: 'Baca',
  icon: BookOpen,
  description: 'Manga, manhwa, dan manhua dalam satu rak baca.',
  isActive: createGroupPathMatcher(READ_PATH_ALIASES),
  items: [
    { label: 'Beranda baca', href: '/read', description: 'Mulai pilih bacaan dari sini.' },
    { label: 'Komik', href: '/read/comics', description: 'Rak manga, manhwa, dan manhua.' },
  ],
};

const VAULT_GROUP: NavigationGroup = {
  key: 'vault',
  label: 'Koleksi',
  icon: BookMarked,
  description: 'Simpanan, riwayat, dan area akun.',
  isActive: createGroupPathMatcher(VAULT_PATH_ALIASES),
  items: [
    { label: 'Ringkasan', href: '/vault', description: 'Lihat aktivitas watch dan read kamu.' },
    { label: 'Riwayat', href: '/vault/history', description: 'Lanjutkan tontonan dan bacaan terakhir.' },
    { label: 'Tersimpan', href: '/vault/saved', description: 'Buka judul yang sudah kamu simpan.' },
    { label: 'Profil', href: '/vault/profile', description: 'Kelola identitas dan preferensi.' },
  ],
};

export const EDITORIAL_NAV_ITEMS = [
  { label: 'Beranda', href: '/', key: 'home' },
  { label: 'Nonton', href: '/watch', key: 'watch' },
  { label: 'Baca', href: '/read', key: 'read' },
  { label: 'Koleksi', href: '/vault', key: 'vault' },
];

export const DESKTOP_NAV_ITEMS: NavigationPrimaryItem[] = [
  {
    key: 'home',
    type: 'link',
    label: 'Beranda',
    href: '/',
    icon: Home,
    match: (pathname) => pathname === '/',
  },
  {
    key: 'watch',
    type: 'group',
    group: WATCH_GROUP,
    match: (pathname) => startsWithAnyPath(pathname, ['/watch', '/movies', '/series', '/shorts']),
  },
  {
    key: 'read',
    type: 'group',
    group: READ_GROUP,
    match: (pathname) => startsWithAnyPath(pathname, ['/read', '/comics']),
  },
  {
    key: 'vault',
    type: 'group',
    group: VAULT_GROUP,
    match: (pathname) => startsWithAnyPath(pathname, ['/vault']),
  },
];

export const MOBILE_NAV_ITEMS = [
  { key: 'home', label: 'Beranda', href: '/', icon: Home },
  { key: 'watch', label: 'Nonton', href: '/watch', icon: Clapperboard },
  { key: 'search', label: 'Cari', icon: Search, action: 'search' as const },
  { key: 'vault', label: 'Koleksi', href: '/vault', icon: BookMarked },
];

export const MOBILE_MENU_GROUPS: NavigationGroup[] = [WATCH_GROUP, READ_GROUP, VAULT_GROUP];

export const ACCOUNT_PANEL_META = {
  label: 'Akun',
  description: 'Identitas, pengaturan, dan sinkronisasi.',
  icon: UserRound,
};

export const CATEGORY_ICON_MAP = {
  anime: Play,
  donghua: Zap,
  manga: BookOpen,
  manhwa: BookOpen,
  manhua: BookOpen,
  movie: Clapperboard,
  series: Clapperboard,
  drama: Clapperboard,
  drachin: Clapperboard,
  dramabox: Clapperboard,
};
