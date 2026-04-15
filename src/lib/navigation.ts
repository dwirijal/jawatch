import { BookMarked, BookOpen, Clapperboard, FileText, Home, Play, Search, UserRound, Zap } from 'lucide-react';

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
  '/watch/shorts': ['/watch/shorts', '/series/short'],
};

const READ_PATH_ALIASES: Record<string, readonly string[]> = {
  '/read': ['/read'],
  '/read/comics': ['/read/comics', '/comic'],
};

const VAULT_PATH_ALIASES: Record<string, readonly string[]> = {
  '/collection': ['/collection'],
};

const WATCH_GROUP: NavigationGroup = {
  key: 'watch',
  label: 'Watch',
  icon: Clapperboard,
  description: 'Movies, series, and shorts in one watch surface.',
  isActive: createGroupPathMatcher(WATCH_PATH_ALIASES),
  items: [
    { label: 'Watch Home', href: '/watch', description: 'Entry point for the watch hub.' },
    { label: 'Movies', href: '/watch/movies', description: 'Film catalog and playback entry.' },
    { label: 'Series', href: '/watch/series', description: 'Episodic anime, donghua, and drama.' },
    { label: 'Shorts', href: '/watch/shorts', description: 'Vertical short-form playback.' },
  ],
};

const READ_GROUP: NavigationGroup = {
  key: 'read',
  label: 'Read',
  icon: BookOpen,
  description: 'Comics and long-form reading in one reading surface.',
  isActive: createGroupPathMatcher(READ_PATH_ALIASES),
  items: [
    { label: 'Read Home', href: '/read', description: 'Entry point for the reading hub.' },
    { label: 'Comics', href: '/read/comics', description: 'Manga, manhwa, and manhua shelf.' },
  ],
};

const VAULT_GROUP: NavigationGroup = {
  key: 'vault',
  label: 'Vault',
  icon: BookMarked,
  description: 'Saved content, history, and account-adjacent surfaces.',
  isActive: createGroupPathMatcher(VAULT_PATH_ALIASES),
  items: [
    { label: 'Vault', href: '/collection', description: 'Open your saved library.' },
  ],
};

export const EDITORIAL_NAV_ITEMS = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Watch', href: '/watch', key: 'watch' },
  { label: 'Read', href: '/read', key: 'read' },
  { label: 'Vault', href: '/collection', key: 'vault' },
];

export const DESKTOP_NAV_ITEMS: NavigationPrimaryItem[] = [
  {
    key: 'home',
    type: 'link',
    label: 'Home',
    href: '/',
    icon: Home,
    match: (pathname) => pathname === '/',
  },
  {
    key: 'watch',
    type: 'group',
    group: WATCH_GROUP,
    match: (pathname) => startsWithAnyPath(pathname, ['/watch', '/movies', '/series', '/series/short']),
  },
  {
    key: 'read',
    type: 'group',
    group: READ_GROUP,
    match: (pathname) => startsWithAnyPath(pathname, ['/read', '/comic']),
  },
  {
    key: 'vault',
    type: 'link',
    label: 'Vault',
    href: '/collection',
    icon: BookMarked,
    match: (pathname) => startsWithPath(pathname, '/collection'),
  },
];

export const MOBILE_NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'watch', label: 'Watch', href: '/watch', icon: Clapperboard },
  { key: 'search', label: 'Search', icon: Search, action: 'search' as const },
  { key: 'vault', label: 'Vault', href: '/collection', icon: BookMarked },
];

export const MOBILE_MENU_GROUPS: NavigationGroup[] = [WATCH_GROUP, READ_GROUP, VAULT_GROUP];

export const ACCOUNT_PANEL_META = {
  label: 'Account',
  description: 'Identity, settings, and sync surfaces.',
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
  novel: FileText,
};
