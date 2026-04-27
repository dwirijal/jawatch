import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';

export interface SegmentedNavItem {
  href: string;
  label: string;
  title?: string;
  active?: boolean;
  prefetch?: boolean | null;
}

interface SegmentedNavProps {
  ariaLabel: string;
  items: readonly SegmentedNavItem[];
  className?: string;
}

export function SegmentedNav({ ariaLabel, items, className }: SegmentedNavProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('w-full', className)}>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full items-center gap-[var(--space-xs)] rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_92%,white_8%)_0%,var(--surface-1)_100%)] p-[calc(var(--space-2xs)*1.5)] md:min-w-0 md:flex-wrap">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              prefetch={item.prefetch}
              aria-current={item.active ? 'page' : undefined}
              style={item.active ? { color: 'var(--accent-contrast)' } : undefined}
              className={cn(
                'focus-tv whitespace-nowrap rounded-[var(--radius-md)] px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] transition-colors md:px-[calc(var(--space-sm)+var(--space-2xs))]',
                item.active
                  ? 'bg-accent text-[var(--accent-contrast)] shadow-[0_22px_42px_-28px_var(--shadow-color-strong)]'
                  : 'bg-transparent text-muted-foreground hover:bg-surface-1 hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
