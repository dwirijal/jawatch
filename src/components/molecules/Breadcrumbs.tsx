import { ChevronRight } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-[var(--space-xs)]">
              {item.href && !isLast ? (
                <Link href={item.href} className="max-w-[14rem] truncate transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className={cn('max-w-[18rem] truncate', isLast && 'text-foreground')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronRight className="h-[var(--size-icon-sm)] w-[var(--size-icon-sm)] shrink-0" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
