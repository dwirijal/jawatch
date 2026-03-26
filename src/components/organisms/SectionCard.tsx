'use client';

import * as React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { CardGrid, CardRail } from '@/components/molecules/card';

type SectionCardMode = 'grid' | 'rail';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  viewAllHref?: string;
  mode?: SectionCardMode;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  icon,
  viewAllHref,
  mode = 'grid',
  children,
}: SectionCardProps) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={
          viewAllHref ? (
            <Button variant="ghost" size="sm" asChild className="hidden text-zinc-500 hover:text-white md:inline-flex">
              <Link href={viewAllHref} className="focus-tv flex items-center gap-2 text-xs font-semibold tracking-[0.02em]">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null
        }
      />

      {mode === 'rail' ? (
        <ScrollArea className="w-full">
          <CardRail>{children}</CardRail>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <CardGrid>{children}</CardGrid>
      )}
    </section>
  );
}
