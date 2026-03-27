'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share, PlusSquare, ArrowUp } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { resolveThemeFromPathname, ThemeType, cn } from '@/lib/utils';

const PWA_PROMPT_DISMISSED_KEY = 'dwizzyweeb:pwa-prompt-dismissed';

export function PWAInstallPrompt() {
  const { showPrompt, showIOSGuide, handleInstall, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = React.useState(true);
  const pathname = usePathname();
  const theme = resolveThemeFromPathname(pathname);
  const installVariant: ThemeType | 'outline' = theme === 'default' ? 'outline' : theme;

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsVisible(window.localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) !== '1');
  }, []);

  const dismissPrompt = React.useCallback(() => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1');
    }
  }, []);

  if (isStandalone || !isVisible) return null;
  if (!showPrompt && !showIOSGuide) return null;

  return (
    <div
      data-theme={theme}
      className="fixed bottom-20 left-4 right-4 z-[300] animate-in slide-in-from-bottom-10 duration-700 md:bottom-8 md:left-auto md:right-8 md:w-96"
    >
      <Paper tone="muted" shadow="md" className="group relative overflow-hidden rounded-[var(--radius-2xl)] p-5 md:p-6">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent-soft blur-[72px] transition-opacity group-hover:opacity-90" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismissPrompt}
          className="absolute right-4 top-4 h-9 w-9 rounded-full text-zinc-500"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-white hard-shadow-sm">
            <Download className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5 pr-10">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Install App</p>
            <h3 className="text-base font-black tracking-tight text-white">Save dwizzyWEEB to your home screen</h3>
            <p className="text-sm leading-6 text-zinc-400">
              {showIOSGuide
                ? "Use Share, then Add to Home Screen for the best playback and browsing experience."
                : "Launch faster and get a cleaner full-screen experience straight from your device."}
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          {showIOSGuide ? (
            <Paper tone="outline" padded={false} className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Share className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Share</span>
              </div>
              <div className="h-4 w-px bg-border-subtle" />
              <div className="flex min-w-0 items-center gap-2.5">
                <PlusSquare className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Add to Home</span>
              </div>
              <ArrowUp className="h-4 w-4 shrink-0 animate-bounce text-accent" />
            </Paper>
          ) : (
            <Button
              onClick={handleInstall}
              variant={installVariant}
              className={cn(
                'h-12 w-full rounded-[var(--radius-xl)]',
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
