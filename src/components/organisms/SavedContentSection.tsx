'use client';

import * as React from 'react';
import { Bookmark } from 'lucide-react';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { useAuthGate } from '@/components/hooks/useAuthGate';
import { getBookmarks, BookmarkItem, MediaType } from '@/lib/store';
import { MediaCard } from '@/components/molecules/MediaCard';
import { Typography } from '@/components/atoms/Typography';
import { THEME_CONFIG } from '@/lib/utils';

interface SavedContentSectionProps {
  type?: MediaType;
  title?: string;
  limit?: number;
}

export function SavedContentSection({ type, title = "Your Collection", limit }: SavedContentSectionProps) {
  const authGate = useAuthGate();
  const [items, setItems] = React.useState<BookmarkItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!authGate.authenticated) {
      setMounted(true);
      setItems([]);
      return;
    }

    setMounted(true);
    const allBookmarks = getBookmarks();
    const filtered = type ? allBookmarks.filter(b => b.type === type) : allBookmarks;
    setItems(limit ? filtered.slice(0, limit) : filtered);
  }, [authGate.authenticated, limit, type]);

  if (!mounted || authGate.loading) return null;

  const theme = type || 'default';
  const config = THEME_CONFIG[theme];

  if (!authGate.authenticated) {
    return (
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 md:space-y-8">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-5 md:pb-6">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className={`rounded-[1.15rem] p-2.5 md:rounded-2xl md:p-3 ${config.bg} ${config.text} border ${config.border}`}>
              <Bookmark className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <Typography as="h2" size="2xl" className="text-xl leading-none text-white md:text-2xl">
                {title}
              </Typography>
              <Typography size="xs" className="mt-1.5 text-[10px] text-zinc-500 md:mt-2 md:text-xs">
                Login to view and keep your saved picks in one place
              </Typography>
            </div>
          </div>
        </div>

        <AuthGateNotice
          loginHref={authGate.loginHref}
          title="Saved content is available after login"
          description="Sign in to unlock your personal collection. Once you are in, your existing local-only saved content behavior stays the same."
          actionLabel="Login"
        />
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 md:space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-5 md:pb-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <div className={`rounded-[1.15rem] p-2.5 md:rounded-2xl md:p-3 ${config.bg} ${config.text} border ${config.border}`}>
            <Bookmark className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="min-w-0">
            <Typography as="h2" size="2xl" className="text-xl leading-none text-white md:text-2xl">
              {title}
            </Typography>
            <Typography size="xs" className="mt-1.5 text-[10px] text-zinc-500 md:mt-2 md:text-xs">
              Items you have bookmarked
            </Typography>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-8 xl:grid-cols-6">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            href={`/${item.type === 'movie' ? 'movies' : item.type}/${item.id}`}
            image={item.image}
            title={item.title}
            subtitle={item.type.toUpperCase()}
            theme={item.type}
          />
        ))}
      </div>
    </section>
  );
}
