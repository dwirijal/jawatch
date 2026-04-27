'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { useAuthGate } from '@/hooks/useAuthGate';
import { checkIsBookmarked, toggleBookmark, BookmarkItem } from '@/lib/store';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  item: BookmarkItem;
  theme?: 'manga' | 'anime' | 'donghua' | 'movie' | 'drama';
  className?: string;
  saveLabel?: string;
  savedLabel?: string;
  loadingLabel?: string;
}

export function BookmarkButton({
  item,
  theme = 'anime',
  className,
  saveLabel = 'Simpan',
  savedLabel = 'Tersimpan',
  loadingLabel = 'Mengecek...',
}: BookmarkButtonProps) {
  const [, setRefreshKey] = useState(0);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const authGate = useAuthGate();
  const isSaved = checkIsBookmarked(item.id);
  const isPending = authGate.loading;

  const handleToggle = () => {
    const isAdded = toggleBookmark(item);
    setRefreshKey((value) => value + 1);
    if (!authGate.authenticated) {
      setNoticeVisible(isAdded);
      return;
    }

    setNoticeVisible(false);
  };

  const handleClick = () => {
    if (isPending) {
      return;
    }

    handleToggle();
  };

  const themeClasses = {
    manga: isSaved ? 'bg-[var(--signal-warning)] text-[var(--accent-contrast)] hover:brightness-[1.05] border-transparent' : 'text-[var(--signal-warning)] hover:bg-[var(--signal-warning)]/10 border-[color:var(--signal-warning)]',
    anime: isSaved ? 'bg-blue-600 text-[var(--accent-contrast)] hover:bg-blue-700 border-transparent' : 'text-blue-500 hover:bg-blue-600/10 border-blue-600/50',
    donghua: isSaved ? 'bg-[var(--signal-danger)] text-[var(--accent-contrast)] hover:brightness-[1.05] border-transparent' : 'text-[var(--signal-danger)] hover:bg-[var(--signal-danger)]/10 border-[color:var(--signal-danger)]',
    movie: isSaved ? 'bg-indigo-600 text-[var(--accent-contrast)] hover:bg-indigo-700 border-transparent' : 'text-indigo-500 hover:bg-indigo-600/10 border-indigo-600/50',
    drama: isSaved ? 'bg-[var(--signal-danger)] text-[var(--accent-contrast)] hover:brightness-[1.05] border-transparent' : 'text-[var(--signal-danger)] hover:bg-[var(--signal-danger)]/10 border-[color:var(--signal-danger)]',
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        className={cn(
          "h-[var(--size-control-md)] gap-[var(--space-xs)] px-[calc(var(--space-md)+var(--space-2xs))] transition-all duration-300",
          isPending && "cursor-wait opacity-70",
          themeClasses[theme],
          className
        )}
      >
        <Bookmark className={cn("w-4 h-4", isSaved && "fill-current", isPending && "animate-pulse")} />
        {isPending ? loadingLabel : isSaved ? savedLabel : saveLabel}
      </Button>

      {!authGate.authenticated && noticeVisible ? (
        <AuthGateNotice
          compact
          loginHref={authGate.loginHref}
          title="Tersimpan di browser ini"
          description="Masuk nanti supaya jawatch membawa simpanan ini ke akun kamu."
          actionLabel="Masuk"
        />
      ) : null}
    </div>
  );
}
