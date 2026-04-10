'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { resolveThemeFromPathname, ThemeType, cn } from '@/lib/utils';

const PWA_PROMPT_SESSION_SEEN_KEY = 'dwizzyweeb:pwa-prompt-session-seen';

export function PWAInstallPrompt() {
  const { showPrompt, showIOSGuide, handleInstall, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasSeenSessionPrompt, setHasSeenSessionPrompt] = React.useState<boolean | null>(null);
  const pathname = usePathname();
  const theme = resolveThemeFromPathname(pathname);
  const installVariant: ThemeType | 'outline' = theme === 'default' ? 'outline' : theme;
  const canShowPrompt = showPrompt || showIOSGuide;

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setHasSeenSessionPrompt(window.sessionStorage.getItem(PWA_PROMPT_SESSION_SEEN_KEY) === '1');
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (hasSeenSessionPrompt === null || hasSeenSessionPrompt || isStandalone || !canShowPrompt) {
        return;
      }

      window.sessionStorage.setItem(PWA_PROMPT_SESSION_SEEN_KEY, '1');
      setHasSeenSessionPrompt(true);
      setIsVisible(true);
    }
  }, [canShowPrompt, hasSeenSessionPrompt, isStandalone]);

  const dismissPrompt = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  if (isStandalone || !isVisible || !canShowPrompt) return null;

  return (
    <div
      data-theme={theme}
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-3 right-3 z-[300] animate-in slide-in-from-bottom-8 duration-500 md:bottom-6 md:left-auto md:right-6 md:w-[22rem]"
    >
      <Paper tone="muted" shadow="md" className="group relative overflow-hidden rounded-[var(--radius-2xl)] px-3 py-3 md:px-5 md:py-5">
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-accent-soft blur-[56px] transition-opacity group-hover:opacity-90" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismissPrompt}
          aria-label="Dismiss install prompt"
          className="absolute right-1.5 top-1.5 h-11 w-11 rounded-full text-zinc-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative flex items-start gap-2.5 pr-11 md:gap-3 md:pr-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-white hard-shadow-sm md:h-12 md:w-12">
            <Download className="h-4 w-4 md:h-5 md:w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5 md:space-y-1">
            <p className="hidden text-[10px] font-black uppercase tracking-[0.22em] text-accent md:block">Install App</p>
            <h3 className="text-sm font-black leading-tight tracking-tight text-white md:text-base">Install dwizzyWEEB</h3>
            <p className="text-[11px] leading-4 text-zinc-400 md:hidden">
              {showIOSGuide ? 'Share, then Add to Home.' : 'Fast full-screen access.'}
            </p>
            <p className="hidden text-[13px] leading-5 text-zinc-400 md:block md:text-sm md:leading-6">
              {showIOSGuide
                ? 'Use Share, then Add to Home Screen for faster playback and cleaner browsing.'
                : 'Launch faster and get a cleaner full-screen experience straight from your device.'}
            </p>
          </div>
        </div>

        <div className="relative mt-3 md:mt-4">
          {showIOSGuide ? (
            <div className="grid grid-cols-2 gap-2">
              <Paper tone="outline" padded={false} className="flex h-11 items-center gap-2 rounded-[var(--radius-xl)] px-3 py-2 md:min-h-12 md:px-3.5 md:py-3">
                <Share className="h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0">
                  <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 md:block">Step 1</span>
                  <span className="block text-[13px] font-semibold text-zinc-100 md:text-sm">Share</span>
                </div>
              </Paper>
              <Paper tone="outline" padded={false} className="flex h-11 items-center gap-2 rounded-[var(--radius-xl)] px-3 py-2 md:min-h-12 md:px-3.5 md:py-3">
                <PlusSquare className="h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0">
                  <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 md:block">Step 2</span>
                  <span className="block text-[13px] font-semibold text-zinc-100 md:text-sm">Add to Home</span>
                </div>
              </Paper>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              variant={installVariant}
              className={cn(
                'h-12 w-full rounded-[var(--radius-xl)] text-sm font-black',
                installVariant === 'outline' ? 'border-border-subtle bg-surface-1 hover:bg-surface-elevated' : undefined
              )}
            >
              Install dwizzyWEEB
            </Button>
          )}
        </div>
      </Paper>
    </div>
  );
}
