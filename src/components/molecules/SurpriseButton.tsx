'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dices, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { getRandomMedia } from '@/lib/adapters/random';
import { cn, ThemeType, THEME_CONFIG } from '@/lib/utils';
import type { MediaType } from '@/lib/store';

interface SurpriseButtonProps {
  type: MediaType;
  theme: ThemeType;
  className?: string;
  hrefBase?: string;
  resolveSlug?: () => string | Promise<string>;
}

export function SurpriseButton({
  type,
  theme,
  className,
  hrefBase,
  resolveSlug,
}: SurpriseButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  const handleSurprise = async () => {
    setLoading(true);
    try {
      const slug = resolveSlug ? await resolveSlug() : (await getRandomMedia(type)).slug;
      if (!slug) {
        setLoading(false);
        return;
      }

      setTimeout(() => {
        router.push(`${hrefBase ?? `/${type === 'movie' ? 'movies' : type}`}/${slug}`);
        setLoading(false);
      }, 800);
    } catch { setLoading(false); }
  };

  return (
    <Button variant="outline" onClick={handleSurprise} disabled={loading} className={cn("h-12 gap-3 rounded-[var(--radius-lg)] border-zinc-800 group relative overflow-hidden", className)}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : <Dices className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", config.text)} />}
      <span className="text-[10px] font-black uppercase tracking-widest">Surprise Me</span>
      {loading && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
    </Button>
  );
}
