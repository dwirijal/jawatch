'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import type { NavigationGroup } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface DesktopNavGroupProps {
  active: boolean;
  group: NavigationGroup;
  pathname: string;
}

export function DesktopNavGroup({ active, group, pathname }: DesktopNavGroupProps) {
  const [open, setOpen] = React.useState(false);

  const closeIfFocusLeaves = React.useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setOpen(false);
    }
  }, []);

  return (
    <div
      className="relative"
      onBlur={closeIfFocusLeaves}
      onFocusCapture={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'focus-tv flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold tracking-[0.02em] transition-all outline-none',
          active ? 'border border-border-subtle bg-surface-elevated text-white hard-shadow-sm' : 'text-zinc-500 hover:bg-surface-2 hover:text-white'
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <group.icon className="h-4 w-4" />
        {group.label}
        <ChevronDown className="h-4 w-4" />
      </button>

      <div
        className={cn(
          'absolute left-0 top-full z-[150] pt-3 transition-all duration-150 ease-out',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0 pointer-events-none'
        )}
      >
        <div
          role="menu"
          aria-label={group.label}
          className="z-[150] w-[20rem] rounded-[var(--radius-sm)] border border-border-subtle bg-background p-2 shadow-2xl"
        >
          <div className="border-b border-border-subtle px-3 py-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white">{group.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{group.description}</p>
          </div>

          <div className="space-y-1 p-1">
            {group.items.map((item) => {
              const itemActive = Boolean(item.href && group.isActive?.(pathname, item.href));

              if (!item.href) {
                return (
                  <div
                    key={item.label}
                    role="presentation"
                    className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-3 opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-200">{item.label}</p>
                      <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        Soon
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={cn(
                    'block rounded-[var(--radius-sm)] border px-3 py-3 transition-colors outline-none',
                    itemActive
                      ? 'border-border-subtle bg-surface-1'
                      : 'border-transparent hover:border-border-subtle hover:bg-surface-1 focus:border-border-subtle focus:bg-surface-1'
                  )}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">{item.label}</p>
                    {itemActive ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <p className={cn('mt-1 text-xs', itemActive ? 'text-zinc-300' : 'text-zinc-500')}>{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
