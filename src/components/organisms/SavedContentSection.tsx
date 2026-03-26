'use client';

import * as React from 'react';
import { Bookmark } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { useAuthGate } from '@/components/hooks/useAuthGate';
import { getBookmarks, BookmarkItem, MediaType } from '@/lib/store';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { THEME_CONFIG } from '@/lib/utils';
import { CardGrid } from '@/components/molecules/card';

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
        <SectionHeader
          title={title}
          subtitle="Login to view and keep your saved picks in one place"
          leading={
            <div className={`rounded-[1.15rem] border p-2.5 md:rounded-2xl md:p-3 ${config.bg} ${config.text} ${config.border}`}>
              <Bookmark className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          }
        />

        <AuthGateNotice
          compact
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
      <SectionHeader
        title={title}
        subtitle="Items you have bookmarked"
        leading={
          <div className={`rounded-[1.15rem] border p-2.5 md:rounded-2xl md:p-3 ${config.bg} ${config.text} ${config.border}`}>
            <Bookmark className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        }
      />

      <CardGrid>
        {items.map((item) => (
          <Card
            key={item.id}
            href={`/${item.type === 'movie' ? 'movies' : item.type}/${item.id}`}
            image={item.image}
            title={item.title}
            subtitle={item.type.toUpperCase()}
            theme={item.type}
          />
        ))}
      </CardGrid>
    </section>
  );
}
