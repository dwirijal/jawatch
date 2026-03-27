import { BookMarked, BookOpen, Clapperboard, Compass, FileText, Home, Play, UserRound, Zap } from 'lucide-react';

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
    { label: 'Anime', href: '/anime', description: 'Anime discovery and episodes.' },
    { label: 'Donghua', href: '/donghua', description: 'Chinese animation hub.' },
    { label: 'Drachin', href: '/drachin', description: 'Short-form dubbed drama episodes.' },
    { label: 'DramaBox', href: '/dramabox', description: 'Short drama discovery feed.' },
  ],
};

const KOMIK_GROUP: NavigationGroup = {
  key: 'komik',
  label: 'Komik',
  icon: BookOpen,
  description: 'Read-first surfaces for comics and serialized panels.',
  isActive: startsWithPath,
  items: [
    { label: 'Manga', href: '/manga', description: 'Japanese manga catalog.' },
    { label: 'Manhwa', href: '/manhwa', description: 'Korean webtoon and manhwa catalog.' },
    { label: 'Manhua', href: '/manhua', description: 'Chinese manhua catalog.' },
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
    { label: 'Light Novel', description: 'Coming soon.' },
    { label: 'Long Novel', description: 'Coming soon.' },
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
    match: (pathname) => ['/movies', '/anime', '/donghua', '/drachin', '/dramabox'].some((href) => startsWithPath(pathname, href)),
  },
  {
    key: 'komik',
    type: 'group',
    group: KOMIK_GROUP,
    match: (pathname) => ['/manga', '/manhwa', '/manhua'].some((href) => startsWithPath(pathname, href)),
  },
  {
    key: 'novel',
    type: 'group',
    group: NOVEL_GROUP,
    match: () => false,
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
  { key: 'search', label: 'Search', icon: Compass, action: 'search' as const },
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
  drama: Clapperboard,
  drachin: Clapperboard,
  dramabox: Clapperboard,
};
