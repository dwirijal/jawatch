import * as React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { cn, THEME_CONFIG, type ThemeType } from '@/lib/utils';

interface CategoryCardProps {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  theme: ThemeType;
  icon: LucideIcon;
  highlights?: string[];
  className?: string;
}

export function CategoryCard({
  href,
  title,
  description,
  eyebrow,
  theme,
  icon: Icon,
  highlights = [],
  className,
}: CategoryCardProps) {
  const config = THEME_CONFIG[theme] ?? THEME_CONFIG.default;

  return (
    <Link
      href={href}
      className={cn(
        'focus-tv surface-panel-elevated group relative flex min-h-[14rem] flex-col overflow-hidden p-[var(--space-md)] md:min-h-[15.5rem] md:p-5',
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-75 blur-3xl', config.primary)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_72%)]" />

      <div className="relative z-10 flex h-full flex-col gap-[var(--space-md)]">
        <div className="flex items-start justify-between gap-[var(--space-md)]">
          <div className="space-y-2">
            <p className="type-kicker">{eyebrow}</p>
            <h2 className="text-balance font-[var(--font-heading)] text-[clamp(1.85rem,4vw,2.9rem)] font-bold leading-[0.94] tracking-[-0.055em] text-foreground">
              {title}
            </h2>
          </div>

          <span className={cn('inline-flex h-[var(--size-control-lg)] w-[var(--size-control-lg)] shrink-0 items-center justify-center rounded-2xl border border-border-subtle shadow-[0_18px_44px_-34px_var(--shadow-color)]', config.primary)}>
            <Icon className={cn('h-5 w-5', config.contrast)} />
          </span>
        </div>

        <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-[0.98rem]">
          {description}
        </p>

        {highlights.length > 0 ? (
          <div className="flex flex-wrap gap-[var(--space-xs)]">
            {highlights.map((item) => (
              <span
                key={item}
                className={cn(
                  'rounded-full border px-[var(--space-sm)] py-[var(--space-2xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)]',
                  config.border,
                  config.bg,
                  config.text,
                )}
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-3.5">
          <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground transition-colors group-hover:text-foreground">
            Buka rak
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-surface-elevated">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
