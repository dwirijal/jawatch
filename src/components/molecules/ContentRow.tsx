'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  viewAllHref?: string;
  className?: string;
}

export function ContentRow({ title, subtitle, children, viewAllHref, className }: ContentRowProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between px-2 md:px-0">
        <div className="space-y-1">
          <h2 className="text-xl md:text-3xl font-black italic tracking-tighter uppercase leading-none">
            {title}
          </h2>
          {subtitle && <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Button variant="ghost" size="sm" asChild className="text-zinc-500 hover:text-white transition-colors">
            <Link href={viewAllHref} className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
              Explore All <ChevronRight className="w-3 h-3" />
            </Link>
          </Button>
        )}
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 md:gap-6 pb-6 px-2 md:px-0">
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
