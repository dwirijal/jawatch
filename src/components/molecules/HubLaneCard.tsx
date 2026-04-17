import * as React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { cn, THEME_CONFIG, type ThemeType } from '@/lib/utils';

interface HubLaneCardProps {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  theme: ThemeType;
  icon: LucideIcon;
  highlights?: string[];
  className?: string;
}

export function HubLaneCard({
  href,
  title,
  description,
  eyebrow,
  theme,
  icon: Icon,
  highlights = [],
  className,
}: HubLaneCardProps) {
  const config = THEME_CONFIG[theme] ?? THEME_CONFIG.default;

  return (
    <Link
      href={href}
      className={cn(
        'focus-tv surface-panel-elevated group relative flex min-h-[16rem] flex-col overflow-hidden p-5 md:min-h-[18rem] md:p-6',
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-75 blur-3xl', config.primary)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_72%)]" />

      <div className="relative z-10 flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="type-kicker">{eyebrow}</p>
            <h2 className="text-balance font-[var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground">
              {title}
            </h2>
          </div>

          <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border-subtle shadow-[0_18px_44px_-34px_var(--shadow-color)]', config.primary)}>
            <Icon className={cn('h-5 w-5', config.contrast)} />
          </span>
        </div>

        <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-[0.98rem]">
          {description}
        </p>

        {highlights.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {highlights.map((item) => (
              <span
                key={item}
                className={cn(
                  'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
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

        <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-4">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-foreground">
            Open lane
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-surface-elevated">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
