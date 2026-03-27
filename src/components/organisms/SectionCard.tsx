'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { CardRail } from '@/components/molecules/card';
import type { CardRailVariant } from '@/components/molecules/card/CardRail';
import { cn } from '@/lib/utils';

type SectionCardMode = 'grid' | 'rail';
type CardGridDensity = 'dense' | 'default' | 'comfortable';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  viewAllHref?: string;
  mode?: SectionCardMode;
  gridDensity?: CardGridDensity;
  railVariant?: CardRailVariant;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  icon,
  viewAllHref,
  mode = 'grid',
  gridDensity = 'default',
  railVariant = 'default',
  children,
}: SectionCardProps) {
  const railRef = React.useRef<HTMLDivElement>(null);

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
    <section className="space-y-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
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
                  className="h-8 w-8 text-zinc-500 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Scroll ${title} forward`}
                  onClick={() => scrollRailByPage('next')}
                  className="h-8 w-8 text-zinc-500 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            {viewAllHref ? (
              <Button variant="ghost" size="sm" asChild className="text-zinc-500 hover:text-white">
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
