'use client';

import * as React from 'react';
import { BadgeAlert, Megaphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Paper } from '@/components/atoms/Paper';
import { cn, ThemeType } from '@/lib/utils';

interface AdsProps {
  type?: 'horizontal' | 'vertical' | 'square';
  compact?: boolean;
  className?: string;
  theme?: ThemeType;
}

const ADS_SIZES = {
  horizontal: 'min-h-32 w-full md:min-h-40',
  vertical: 'h-[600px] w-full max-w-sm',
  square: 'aspect-square w-full',
} as const;

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8868090753979495';
const ADSENSE_SLOT_IDS = {
  horizontal: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HORIZONTAL || '',
  vertical: process.env.NEXT_PUBLIC_ADSENSE_SLOT_VERTICAL || '',
  square: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE || '',
} as const;
const EXOCLICK_ZONE_IDS = {
  horizontal: process.env.NEXT_PUBLIC_EXOCLICK_ZONE_HORIZONTAL || '',
  vertical: process.env.NEXT_PUBLIC_EXOCLICK_ZONE_VERTICAL || '',
  square: process.env.NEXT_PUBLIC_EXOCLICK_ZONE_SQUARE || '',
} as const;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    AdProvider?: Array<{ serve: Record<string, never> }>;
  }
}

function hashToPositiveInt(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return String(Math.abs(hash) || 1);
}

function getAdultKeywords(pathname: string, theme?: ThemeType): string {
  if (pathname.startsWith('/nsfw/comic/')) {
    return 'adult,comic,hentai,manga';
  }
  if (pathname.startsWith('/nsfw/movies/')) {
    return 'adult,movie,hentai,ova';
  }
  if (pathname.startsWith('/nsfw/series/')) {
    return 'adult,series,hentai,episode';
  }
  if (theme === 'manga') {
    return 'adult,comic,hentai';
  }
  return 'adult,hentai';
}

export function Ads({ type = 'horizontal', compact = false, className, theme }: AdsProps) {
  const pathname = usePathname() || '/';
  const isNsfwRoute = pathname === '/nsfw' || pathname.startsWith('/nsfw/');
  const adsenseRef = React.useRef<HTMLModElement | null>(null);
  const adultRef = React.useRef<HTMLModElement | null>(null);
  const adsenseSlotId = ADSENSE_SLOT_IDS[type];
  const hasAdsenseInventory = Boolean(ADSENSE_CLIENT && adsenseSlotId);
  const adultZoneId = EXOCLICK_ZONE_IDS[type];
  const hasAdultInventory = Boolean(adultZoneId);
  const provider = isNsfwRoute ? 'adult' : 'adsense';
  const adultSubId = React.useMemo(() => hashToPositiveInt(`${pathname}:${type}`), [pathname, type]);

  React.useEffect(() => {
    if (provider !== 'adsense' || !hasAdsenseInventory || !adsenseRef.current) {
      return undefined;
    }

    const slot = adsenseRef.current;

    const serve = () => {
      if (slot.dataset.loaded === 'true') {
        return;
      }

      if (!Array.isArray(window.adsbygoogle)) {
        return;
      }

      try {
        window.adsbygoogle.push({});
        slot.dataset.loaded = 'true';
      } catch {
        // Ignore provider errors and keep the reserved slot intact.
      }
    };

    serve();
    window.addEventListener('dwizzy:adsense-ready', serve);
    const retryTimer = window.setTimeout(serve, 400);

    return () => {
      window.removeEventListener('dwizzy:adsense-ready', serve);
      window.clearTimeout(retryTimer);
    };
  }, [hasAdsenseInventory, provider]);

  React.useEffect(() => {
    if (provider !== 'adult' || !adultZoneId || !adultRef.current) {
      return undefined;
    }

    const slot = adultRef.current;

    const serve = () => {
      if (slot.dataset.loaded === 'true') {
        return;
      }

      if (!Array.isArray(window.AdProvider)) {
        return;
      }

      try {
        window.AdProvider.push({ serve: {} });
        slot.dataset.loaded = 'true';
      } catch {
        // Ignore provider errors and keep the reserved slot intact.
      }
    };

    serve();
    window.addEventListener('dwizzy:adult-ads-ready', serve);
    const retryTimer = window.setTimeout(serve, 400);

    return () => {
      window.removeEventListener('dwizzy:adult-ads-ready', serve);
      window.clearTimeout(retryTimer);
    };
  }, [adultZoneId, provider]);

  const fallbackIcon = provider === 'adult' ? BadgeAlert : Megaphone;
  const FallbackIcon = fallbackIcon;

  return (
    <Paper
      data-theme={theme}
      tone="muted"
      shadow="sm"
      className={cn(
        'relative overflow-hidden border border-border-subtle/80 bg-surface-1',
        ADS_SIZES[type],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
        <span className="rounded-[var(--radius-xs)] border border-border-subtle bg-background/80 px-2 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-zinc-500 backdrop-blur">
          {provider === 'adult' ? 'Adult Sponsor' : 'Sponsored'}
        </span>
      </div>

      {provider === 'adsense' && hasAdsenseInventory ? (
        <div className="h-full w-full px-2 py-8 md:px-3">
          <ins
            ref={adsenseRef}
            className="adsbygoogle block h-full w-full overflow-hidden"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={adsenseSlotId}
            data-ad-format="auto"
            data-full-width-responsive={type === 'horizontal' ? 'true' : 'false'}
          />
        </div>
      ) : null}

      {provider === 'adult' && adultZoneId ? (
        <div className="h-full w-full px-2 py-8 md:px-3">
          <ins
            ref={adultRef}
            className="eas6a97888e block h-full w-full overflow-hidden"
            data-zoneid={adultZoneId}
            data-sub={adultSubId}
            data-keywords={getAdultKeywords(pathname, theme)}
          />
        </div>
      ) : null}

      {((provider === 'adsense' && !hasAdsenseInventory) || (provider === 'adult' && !hasAdultInventory)) ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_30%)]" />
          <div
            className={cn(
              'relative flex h-full min-h-full flex-col items-center justify-center text-center',
              compact ? 'gap-2 px-4 py-3.5' : 'gap-3 px-6 py-8'
            )}
          >
            <div
              className={cn(
                'inline-flex items-center justify-center border border-border-subtle bg-accent-soft text-accent',
                compact ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 rounded-2xl'
              )}
            >
              <FallbackIcon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent">
                {provider === 'adult' ? 'Adult Inventory Pending' : 'Sponsored Placement'}
              </p>
              <p className={cn('text-zinc-400', compact ? 'max-w-[14rem] text-[11px] leading-4' : 'max-w-xs text-xs leading-5')}>
                {provider === 'adult'
                  ? 'Configure adult zone IDs to activate NSFW monetization on this placement.'
                  : 'Auto ads stay active across SFW pages. Add slot IDs if you want this exact placement reserved for AdSense.'}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </Paper>
  );
}
