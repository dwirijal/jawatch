'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/components/atoms/Popover';
import type { NavigationGroup } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface DesktopNavGroupProps {
  active: boolean;
  group: NavigationGroup;
  pathname: string;
}

export function DesktopNavGroup({ active, group, pathname }: DesktopNavGroupProps) {
  const [open, setOpen] = React.useState(false);
  const activeHref = group.items.reduce<string | undefined>((current, item) => {
    if (!item.href || !group.isActive?.(pathname, item.href)) {
      return current;
    }

    return !current || item.href.length > current.length ? item.href : current;
  }, undefined);

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            className={cn(
              'focus-tv relative flex items-center gap-[var(--space-xs)] rounded-full px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] transition-colors outline-none',
              active || open
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <group.icon className="h-4 w-4" />
            {group.label}
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open ? 'rotate-180' : 'rotate-0')} />
            {active || open ? <span className="absolute inset-x-3 bottom-0 h-px bg-[var(--accent)]" /> : null}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={14}
          className="z-[220] w-[22rem] rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_94%,white_6%)_0%,var(--surface-1)_100%)] p-[var(--space-xs)] shadow-[0_36px_92px_-52px_var(--shadow-color-strong)] backdrop-blur-2xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div role="menu" aria-label={group.label}>
            <div className="border-b border-border-subtle px-[var(--space-sm)] py-[var(--space-sm)]">
              <p className="text-xs font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground">{group.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.description}</p>
            </div>

            <div className="space-y-1 p-[var(--space-2xs)]">
              {group.items.map((item) => {
                const itemActive = item.href === activeHref;

                if (!item.href) {
                  return (
                    <div
                      key={item.label}
                      role="presentation"
                      className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-[var(--space-sm)] py-[var(--space-sm)] opacity-70"
                    >
                      <div className="flex items-center justify-between gap-[var(--space-sm)]">
                        <p className="text-sm font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground">{item.label}</p>
                        <span className="rounded-full border border-border-subtle px-[var(--space-xs)] py-0.5 text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
                          Soon
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    className={cn(
                      'block rounded-[var(--radius-sm)] border px-[var(--space-sm)] py-[var(--space-sm)] transition-colors outline-none',
                      itemActive
                        ? 'border-border-subtle bg-surface-1'
                        : 'border-transparent hover:border-border-subtle hover:bg-surface-1 focus:border-border-subtle focus:bg-surface-1'
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-center justify-between gap-[var(--space-sm)]">
                      <p className="text-sm font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground">{item.label}</p>
                      {itemActive ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border-subtle bg-foreground text-background">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </div>
                    <p className={cn('mt-1 text-xs', itemActive ? 'text-foreground' : 'text-muted-foreground')}>{item.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </div>
    </PopoverRoot>
  );
}
