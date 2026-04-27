import Link from 'next/link';
import { Paper } from '@/components/atoms/Paper';

const adminNavItems = [
  { href: '/admin/titles', label: 'Titles' },
  { href: '/admin/units', label: 'Units' },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="app-shell">
      <div className="app-container-wide space-y-6 py-10">
        <Paper tone="muted" shadow="sm" className="space-y-4 p-[var(--space-xl)]">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Jawatch Admin</p>
            <h1 className="text-3xl font-black tracking-[var(--type-tracking-normal)] text-foreground">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <nav className="flex flex-wrap gap-[var(--space-xs)]" aria-label="Admin sections">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border-subtle px-[var(--space-md)] py-[var(--space-xs)] text-sm font-bold text-foreground transition-colors hover:border-brand/70 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Paper>
        {children}
      </div>
    </main>
  );
}
