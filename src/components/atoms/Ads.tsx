'use client';

import * as React from 'react';
import { Paper } from '@/components/atoms/Paper';
import { AdRenderState } from '@/lib/ad-section-visibility';
import { trackMarketingEvent } from '@/lib/marketing-events';
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

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';
const ADSENSE_SLOT_IDS = {
  horizontal: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HORIZONTAL || '',
  vertical: process.env.NEXT_PUBLIC_ADSENSE_SLOT_VERTICAL || '',
  square: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE || '',
} as const;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
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
  const adsenseRef = React.useRef<HTMLModElement | null>(null);
  const adsenseSlotId = ADSENSE_SLOT_IDS[type];
  const hasAdsenseInventory = Boolean(ADSENSE_CLIENT && adsenseSlotId);
  const [status, setStatus] = React.useState<AdRenderState>('pending');

  React.useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  React.useEffect(() => {
    setStatus(hasAdsenseInventory ? 'pending' : 'hidden');
  }, [hasAdsenseInventory]);

  React.useEffect(() => {
    if (!hasAdsenseInventory || !adsenseRef.current) {
      setStatus('hidden');
      return undefined;
    }

    const slot = adsenseRef.current;
    let settled = false;
    let trackedReady = false;

    const updateStatus = (nextStatus: AdRenderState) => {
      if (settled && nextStatus === 'pending') {
        return;
      }

      if (nextStatus !== 'pending') {
        settled = true;
      }

      if (nextStatus === 'ready' && !trackedReady) {
        trackedReady = true;
        trackMarketingEvent('ad_slot_ready', { type });
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
  }, [hasAdsenseInventory, type]);

  if (status === 'hidden') {
    return null;
  }

  return (
    <>
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
          <span className="rounded-[var(--radius-xs)] border border-border-subtle bg-background/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500 backdrop-blur">
            Sponsor
          </span>
        </div>

        {hasAdsenseInventory ? (
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
      </Paper>
    </>
  );
}
