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
  key: 'video' | 'komik' | 'novel';
  label: string;
  items: NavigationLeafItem[];
};

export type NavigationPrimaryItem =
  | {
      href: string;
      icon: typeof Home;
      key: 'home' | 'bookmark';
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

const VIDEO_GROUP: NavigationGroup = {
  key: 'video',
  label: 'Video',
  icon: Clapperboard,
  description: 'Watch-first library across film and animation.',
  isActive: startsWithPath,
  items: [
    { label: 'Film', href: '/movies', description: 'Movies and watch pages.' },
    { label: 'Series', href: '/series', description: 'Anime, donghua, and episodic drama from the unified catalog.' },
    { label: 'Donghua in Series', href: '/series', description: 'Chinese animation now lives inside the series catalog.' },
    { label: 'Drama China', href: '/drachin', description: 'Unified vertical short-drama hub.' },
  ],
};

const KOMIK_GROUP: NavigationGroup = {
  key: 'komik',
  label: 'Komik',
  icon: BookOpen,
  description: 'Read-first surfaces for comics and serialized panels.',
  isActive: startsWithPath,
  items: [
    { label: 'Comic', href: '/comic', description: 'Unified comic hub across manga, manhwa, and manhua.' },
    { label: 'Manga', href: '/comic/manga', description: 'Japanese manga shelf inside the comic hub.' },
    { label: 'Manhwa', href: '/comic/manhwa', description: 'Korean webtoon and manhwa shelf inside the comic hub.' },
    { label: 'Manhua', href: '/comic/manhua', description: 'Chinese manhua shelf inside the comic hub.' },
    { label: 'Comic US', description: 'Coming soon.' },
  ],
};

const NOVEL_GROUP: NavigationGroup = {
  key: 'novel',
  label: 'Novel',
  icon: FileText,
  description: 'Novel shelves and long-form reading surfaces.',
  isActive: startsWithPath,
  items: [
    { label: 'Novel', href: '/novel', description: 'Readable web novel catalog and chapter flow.' },
  ],
};

function startsWithPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
    key: 'video',
    type: 'group',
    group: VIDEO_GROUP,
    match: (pathname) => ['/movies', '/series', '/drachin', '/dramabox'].some((href) => startsWithPath(pathname, href)),
  },
  {
    key: 'komik',
    type: 'group',
    group: KOMIK_GROUP,
    match: (pathname) => startsWithPath(pathname, '/comic'),
  },
  {
    key: 'novel',
    type: 'group',
    group: NOVEL_GROUP,
    match: (pathname) => startsWithPath(pathname, '/novel'),
  },
  {
    key: 'bookmark',
    type: 'link',
    label: 'Bookmark',
    href: '/collection',
    icon: BookMarked,
    match: (pathname) => startsWithPath(pathname, '/collection'),
  },
];

export const MOBILE_NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'search', label: 'Search', icon: Search, action: 'search' as const },
  { key: 'bookmark', label: 'Bookmark', href: '/collection', icon: BookMarked },
  { key: 'menu', label: 'Menu', icon: UserRound, action: 'menu' as const },
];

export const MOBILE_MENU_GROUPS: NavigationGroup[] = [VIDEO_GROUP, KOMIK_GROUP, NOVEL_GROUP];

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
