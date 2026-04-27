import { Link } from '@/components/atoms/Link';
import { TrackedMarketingLink } from '@/components/molecules/TrackedMarketingLink';
import { buildSupportCta } from '@/lib/marketing';
import { SHORTS_HUB_ENABLED } from '@/lib/shorts-paths';

const FOOTER_GROUPS = [
  {
    title: 'Nonton',
    links: [
      { href: '/watch/movies', label: 'Film' },
      { href: '/watch/series', label: 'Series' },
      ...(SHORTS_HUB_ENABLED ? [{ href: '/watch/shorts', label: 'Shorts' }] : []),
    ],
  },
  {
    title: 'Baca',
    links: [
      { href: '/read/comics', label: 'Komik' },
      { href: '/read/comics#latest', label: 'Chapter terbaru' },
      { href: '/read/comics#popular', label: 'Komik populer' },
    ],
  },
  {
    title: 'Akun',
    links: [
      { href: '/', label: 'Beranda' },
      { href: '/search', label: 'Cari' },
      { href: '/vault', label: 'Koleksi' },
      { href: '/support', label: 'Dukung' },
      { href: '/login', label: 'Masuk' },
    ],
  },
] as const;

const LEGAL_ITEMS = [
  { href: '/terms', label: 'Syarat Layanan' },
  { href: '/privacy', label: 'Kebijakan Privasi' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/contact', label: 'Kontak' },
] as const;

export function FooterContent() {
  const supportCta = buildSupportCta();

  return (
    <footer className="w-full border-t border-border-subtle bg-surface-1 py-12 backdrop-blur md:py-16">
      <div className="app-container-wide flex flex-col gap-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)] lg:items-start">
          <div className="space-y-5">
            <Link href="/" className="group inline-flex items-center gap-[var(--space-sm)]">
              <span className="font-[var(--font-heading)] text-3xl font-bold tracking-[-0.06em] text-foreground">
                Ja<span className="text-[var(--accent-strong)]">watch</span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              Katalog nonton dan baca untuk anime, donghua, drama Asia, film, manga, manhwa, dan manhua bahasa Indonesia.
            </p>
            <div className="inline-flex items-center gap-[var(--space-xs)] rounded-full border border-border-subtle bg-accent-soft px-[var(--space-md)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Watch dan read dalam satu katalog
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2 p-[var(--space-md)]">
              <p className="text-sm font-bold text-foreground">{supportCta.title}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{supportCta.description}</p>
              <TrackedMarketingLink
                href={supportCta.href}
                eventName="support_click"
                eventProperties={{ placement: 'footer-support-card', title: supportCta.title }}
                className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-[var(--space-md)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground transition-colors hover:bg-[var(--accent-strong)]"
              >
                {supportCta.label}
              </TrackedMarketingLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-2xl)] sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">{group.title}</h4>
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

        <div className="flex flex-col gap-[var(--space-md)] border-t border-border-subtle pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
            &copy; {new Date().getFullYear()} jawatch. Dibangun untuk sesi nonton dan baca yang nyaman.
          </p>
        </div>
      </div>
    </footer>
  );
}
