import { Link } from '@/components/atoms/Link';

export function Footer() {
  const navLinks = [
    { href: '/anime', label: 'Anime' },
    { href: '/drachin', label: 'Drama China' },
    { href: '/manga', label: 'Manga' },
    { href: '/manhwa', label: 'Manhwa' },
    { href: '/manhua', label: 'Manhua' },
    { href: '/donghua', label: 'Donghua' },
  ];

  const legalLinks = [
    { href: '#', label: 'Terms of Service' },
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'DMCA' },
  ];

  return (
    <footer className="w-full border-t border-border-subtle bg-background py-10 md:py-12">
      <div className="app-container-wide flex flex-col gap-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 transition-colors group-hover:bg-surface-elevated">
                <span className="text-xs font-black italic text-white">W</span>
              </div>
              <span className="text-lg font-black italic tracking-tighter">
                dwizzyWEEB
              </span>
            </Link>
            <p className="max-w-xs text-center text-xs leading-6 text-zinc-500 md:text-left">
              Your premium destination for Anime, Donghua, short drama, Manga, Manhwa, and Manhua content.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-10 md:justify-end">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Navigation</h4>
              <ul className="space-y-2 text-xs font-bold text-zinc-500">
                {navLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Legal</h4>
              <ul className="space-y-2 text-xs font-bold text-zinc-500">
                {legalLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6 text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">
            &copy; {new Date().getFullYear()} dwizzyWEEB. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
