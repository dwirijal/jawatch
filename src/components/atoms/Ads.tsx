'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Paper } from '@/components/atoms/Paper';
import { AdRenderState } from '@/lib/ad-section-visibility';
import { AdNetworkBootstrap } from '@/components/organisms/AdNetworkBootstrap';
import { cn, ThemeType } from '@/lib/utils';

interface AdsProps {
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
  theme?: ThemeType;
  onStatusChange?: (status: AdRenderState) => void;
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

function hasRenderedAdContent(slot: HTMLElement): boolean {
  const adStatus = slot.getAttribute('data-ad-status');
  if (adStatus === 'filled') {
    return true;
  }

  if (adStatus === 'unfilled') {
    return false;
  }

  return Boolean(slot.querySelector('iframe, img, video, object, embed') || slot.childElementCount > 0);
}

export function Ads({ type = 'horizontal', className, theme, onStatusChange }: AdsProps) {
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
  const [status, setStatus] = React.useState<AdRenderState>('pending');

  React.useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  React.useEffect(() => {
    setStatus(provider === 'adsense' ? (hasAdsenseInventory ? 'pending' : 'hidden') : (hasAdultInventory ? 'pending' : 'hidden'));
  }, [hasAdsenseInventory, hasAdultInventory, provider]);

  React.useEffect(() => {
    if (provider !== 'adsense' || !hasAdsenseInventory || !adsenseRef.current) {
      if (provider === 'adsense' && !hasAdsenseInventory) {
        setStatus('hidden');
      }
      return undefined;
    }

    const slot = adsenseRef.current;
    let settled = false;

    const updateStatus = (nextStatus: AdRenderState) => {
      if (settled && nextStatus === 'pending') {
        return;
      }

      if (nextStatus !== 'pending') {
        settled = true;
      }

      setStatus((current) => (current === nextStatus ? current : nextStatus));
    };

    const inspectSlot = () => {
      const adStatus = slot.getAttribute('data-ad-status');
      if (adStatus === 'unfilled') {
        updateStatus('hidden');
        return;
      }

      if (hasRenderedAdContent(slot)) {
        updateStatus('ready');
      }
    };

    const serve = () => {
      if (slot.dataset.loaded === 'true') {
        inspectSlot();
        return;
      }

      if (!Array.isArray(window.adsbygoogle)) {
        return;
      }

      try {
        window.adsbygoogle.push({});
        slot.dataset.loaded = 'true';
        inspectSlot();
      } catch {
        updateStatus('hidden');
      }
    };

    const observer = new MutationObserver(inspectSlot);
    observer.observe(slot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ad-status', 'style'],
    });

    serve();
    window.addEventListener('dwizzy:adsense-ready', serve);
    const retryTimer = window.setTimeout(serve, 400);
    const settleTimer = window.setTimeout(() => {
      inspectSlot();
      if (!hasRenderedAdContent(slot)) {
        updateStatus('hidden');
      }
    }, 2500);

    return () => {
      observer.disconnect();
      window.removeEventListener('dwizzy:adsense-ready', serve);
      window.clearTimeout(retryTimer);
      window.clearTimeout(settleTimer);
    };
  }, [hasAdsenseInventory, provider]);

  React.useEffect(() => {
    if (provider !== 'adult' || !adultZoneId || !adultRef.current) {
      if (provider === 'adult' && !adultZoneId) {
        setStatus('hidden');
      }
      return undefined;
    }

    const slot = adultRef.current;
    let settled = false;

    const updateStatus = (nextStatus: AdRenderState) => {
      if (settled && nextStatus === 'pending') {
        return;
      }

      if (nextStatus !== 'pending') {
        settled = true;
      }

      setStatus((current) => (current === nextStatus ? current : nextStatus));
    };

    const inspectSlot = () => {
      if (hasRenderedAdContent(slot)) {
        updateStatus('ready');
      }
    };

    const serve = () => {
      if (slot.dataset.loaded === 'true') {
        inspectSlot();
        return;
      }

      if (!Array.isArray(window.AdProvider)) {
        return;
      }

      try {
        window.AdProvider.push({ serve: {} });
        slot.dataset.loaded = 'true';
        inspectSlot();
      } catch {
        updateStatus('hidden');
      }
    };

    const observer = new MutationObserver(inspectSlot);
    observer.observe(slot, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    serve();
    window.addEventListener('dwizzy:adult-ads-ready', serve);
    const retryTimer = window.setTimeout(serve, 400);
    const settleTimer = window.setTimeout(() => {
      inspectSlot();
      if (!hasRenderedAdContent(slot)) {
        updateStatus('hidden');
      }
    }, 2500);

    return () => {
      observer.disconnect();
      window.removeEventListener('dwizzy:adult-ads-ready', serve);
      window.clearTimeout(retryTimer);
      window.clearTimeout(settleTimer);
    };
  }, [adultZoneId, provider]);

  if (status === 'hidden') {
    return null;
  }

  return (
    <>
      <AdNetworkBootstrap
        provider={provider}
        enabled={provider === 'adsense' ? hasAdsenseInventory : hasAdultInventory}
      />
      <Paper
        data-theme={theme}
        tone="muted"
        shadow="sm"
        className={cn(
          'relative overflow-hidden border border-border-subtle/80 bg-surface-1',
          status !== 'ready' && 'pointer-events-none opacity-0',
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
      </Paper>
    </>
  );
}
