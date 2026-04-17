import { Link } from '@/components/atoms/Link';

const FOOTER_GROUPS = [
  {
    title: 'Watch',
    links: [
      { href: '/watch/movies', label: 'Movies' },
      { href: '/watch/series', label: 'Series' },
      { href: '/watch/shorts', label: 'Shorts' },
    ],
  },
  {
    title: 'Read',
    links: [
      { href: '/read/comics', label: 'Comics' },
      { href: '/read/comics#latest', label: 'Latest chapters' },
      { href: '/read/comics#popular', label: 'Popular comics' },
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
] as const;

const LEGAL_ITEMS = ['Terms of Service', 'Privacy Policy', 'DMCA'] as const;

export function FooterContent() {
  return (
    <footer className="w-full border-t border-border-subtle bg-surface-1 py-12 backdrop-blur md:py-16">
      <div className="app-container-wide flex flex-col gap-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)] lg:items-start">
          <div className="space-y-5">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="font-[var(--font-heading)] text-3xl font-bold tracking-[-0.06em] text-foreground">
                Ja<span className="text-[var(--accent-strong)]">watch</span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              Premium watch and reader hub untuk sesi panjang. Shell, controls, dan surfaces dibangun ulang supaya tetap cepat, tenang, dan mudah dipakai di semua ukuran layar.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-accent-soft px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Watch and read surfaces in sync
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{group.title}</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {group.links.map((item) => (
                    <li key={`${group.title}-${item.href}`}>
                      <Link href={item.href} className="inline-block transition-colors hover:text-foreground">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border-subtle pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_ITEMS.map((label) => (
              <span
                key={label}
                aria-disabled="true"
                className="cursor-default text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            &copy; {new Date().getFullYear()} jawatch. Built for long watch and read sessions.
          </p>
        </div>
      </div>
    </footer>
  );
}
