'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ThemeType, THEME_CONFIG } from '@/lib/utils';
import { MediaCard } from '@/components/molecules/MediaCard';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';

type HomeItem = {
  slug: string;
  title: string;
  thumb?: string;
  poster?: string;
  image?: string;
  thumbnail?: string;
  episode?: string;
  chapter?: string;
  year?: string;
  status?: string;
  type?: string;
};

interface HomeContentSectionProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  theme: ThemeType;
  items: HomeItem[];
  loading: boolean;
  viewAllHref: string;
  itemType: 'anime' | 'manga' | 'donghua' | 'movie';
}

export function HomeContentSection({
  title,
  subtitle,
  icon: Icon,
  theme,
  items,
  loading,
  viewAllHref,
  itemType
}: HomeContentSectionProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${config.bg} ${config.text} border ${config.border}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              {title}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">
              {subtitle}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" asChild className="text-zinc-500 hover:text-white group">
          <Link href={viewAllHref} className="flex items-center gap-2">
            Browse All <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          items.map((item, idx) => (
            <MediaCard
              key={`${item.slug || idx}`}
              href={`/${itemType === 'movie' ? 'movies' : itemType}/${item.slug}`}
              image={item.thumb || item.poster || item.image || item.thumbnail || ''}
              title={item.title}
              subtitle={item.episode || item.chapter || item.year}
              badgeText={item.status || item.type}
              theme={theme}
            />
          ))
        )}
      </div>
    </section>
  );
}
