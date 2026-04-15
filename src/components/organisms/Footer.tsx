'use client';

import { Link } from '@/components/atoms/Link';
import { useUIStore } from '@/store/useUIStore';

const FOOTER_GROUPS = [
  {
    title: 'Watch',
    links: [
      { href: '/watch', label: 'Watch Home' },
      { href: '/watch/movies', label: 'Movies' },
      { href: '/watch/series', label: 'Series' },
      { href: '/watch/shorts', label: 'Shorts' },
    ],
  },
  {
    title: 'Read',
    links: [
      { href: '/read', label: 'Read Home' },
      { href: '/read/comics', label: 'Comics' },
    ],
  },
  {
    title: 'Vault',
    links: [
      { href: '/', label: 'Home' },
      { href: '/search', label: 'Search' },
      { href: '/vault', label: 'Vault' },
      { href: '/login', label: 'Login' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { href: '/', label: 'Home' },
      { href: '/search', label: 'Search' },
      { href: '/login', label: 'Login' },
      { href: '/onboarding', label: 'Onboarding' },
    ],
  },
] as const;

const LEGAL_ITEMS = ['Terms of Service', 'Privacy Policy', 'DMCA'] as const;

export function Footer() {
  const isFooterHidden = useUIStore((state) => state.isFooterHidden);

  if (isFooterHidden) {
    return null;
  }

  return (
    <footer className="w-full border-t border-zinc-100 bg-white py-20 md:py-32">
      <div className="app-container-wide flex flex-col gap-20">
        <div className="grid gap-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:items-start">
          <div className="flex flex-col items-center gap-8 text-center md:items-start md:text-left">
            <Link href="/" className="group flex items-center gap-4">
              <span className="font-[var(--font-heading)] text-4xl tracking-tight text-zinc-900">
                Ja<span className="italic text-zinc-400">watch</span>
              </span>
            </Link>
            <p className="max-w-sm font-[var(--font-body)] text-[15px] leading-relaxed text-zinc-500 font-light">
              Unified catalog for watch, read, and vault surfaces. Source-specific scrape data is normalized into one production database before it reaches the app.
            </p>
            <div className="inline-flex items-center gap-3 rounded-full border border-zinc-100 bg-zinc-50 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
              Canonical Database
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="space-y-8">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-900">{group.title}</h4>
                <ul className="space-y-4 text-[14px] font-normal text-zinc-500">
                  {group.links.map((item) => (
                    <li key={`${group.title}-${item.href}`}>
                      <Link href={item.href} className="transition-all duration-300 hover:text-pink-500 hover:translate-x-1 inline-block">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8 border-t border-zinc-50 pt-12 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:justify-start">
            {LEGAL_ITEMS.map((label) => (
              <span
                key={label}
                aria-disabled="true"
                className="cursor-default text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 md:text-left">
            &copy; {new Date().getFullYear()} jawatch. Crafted for cinematic excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}
