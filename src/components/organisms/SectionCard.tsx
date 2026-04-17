'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { CardRail } from '@/components/molecules/card';
import type { CardRailVariant } from '@/components/molecules/card/CardRail';
import { resolveLucideIcon } from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';

type SectionCardMode = 'grid' | 'rail';
type CardGridDensity = 'dense' | 'default' | 'comfortable';

interface SectionCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconName?: string;
  viewAllHref?: string;
  mode?: SectionCardMode;
  gridDensity?: CardGridDensity;
  railVariant?: CardRailVariant;
  children: React.ReactNode;
}

export function SectionCard({
  id,
  title,
  subtitle,
  icon,
  iconName,
  viewAllHref,
  mode = 'grid',
  gridDensity = 'default',
  railVariant = 'default',
  children,
}: SectionCardProps) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const resolvedIcon = icon ?? resolveLucideIcon(iconName);

  const scrollRailByPage = React.useCallback((direction: 'prev' | 'next') => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const distance = Math.max(rail.clientWidth * 0.82, 240);
    rail.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  }, []);

  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={resolvedIcon ?? undefined}
        iconName={resolvedIcon ? undefined : iconName}
        action={
          <div className="flex items-center gap-2">
            {mode === 'rail' ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Scroll ${title} backward`}
                  onClick={() => scrollRailByPage('prev')}
                  className="h-8 w-8 text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Scroll ${title} forward`}
                  onClick={() => scrollRailByPage('next')}
                  className="h-8 w-8 text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            {viewAllHref ? (
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:bg-surface-1 hover:text-foreground">
                <Link href={viewAllHref} className="focus-tv flex items-center gap-2 text-xs font-semibold tracking-[0.02em]">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {mode === 'rail' ? (
        <CardRail ref={railRef} variant={railVariant}>{children}</CardRail>
      ) : (
        <div className={cn('media-grid')} data-grid-density={gridDensity}>
          {children}
        </div>
      )}
    </section>
  );
}
