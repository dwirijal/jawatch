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
        <div className="inline-flex min-w-full items-center gap-2 rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_92%,white_8%)_0%,var(--surface-1)_100%)] p-1.5 md:min-w-0 md:flex-wrap">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              prefetch={item.prefetch}
              aria-current={item.active ? 'page' : undefined}
              style={item.active ? { color: '#0b0d11' } : undefined}
              className={cn(
                'focus-tv whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors md:px-3.5',
                item.active
                  ? 'bg-white text-black shadow-[0_22px_42px_-28px_rgba(15,23,42,0.82)]'
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
