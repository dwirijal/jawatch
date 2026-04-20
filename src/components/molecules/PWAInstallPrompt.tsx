'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { buildPwaPromptDismissedUntil, isPwaPromptAutoShowPath, isPwaPromptDismissed } from '@/lib/pwa';
import { resolveThemeFromPathname, ThemeType, cn } from '@/lib/utils';

const PWA_PROMPT_SESSION_SEEN_KEY = 'jawatch:pwa-prompt-session-seen';
const PWA_PROMPT_DISMISSED_UNTIL_KEY = 'jawatch:pwa-prompt-dismissed-until';

export function PWAInstallPrompt() {
  const { showPrompt, showIOSGuide, handleInstall, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasSeenSessionPrompt, setHasSeenSessionPrompt] = React.useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = React.useState<boolean | null>(null);
  const promptRef = React.useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const theme = resolveThemeFromPathname(pathname);
  const installVariant: ThemeType | 'outline' = theme === 'default' ? 'outline' : theme;
  const canShowPrompt = showPrompt || showIOSGuide;
  const shouldRenderPrompt = canShowPrompt && isPwaPromptAutoShowPath(pathname);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setHasSeenSessionPrompt(window.sessionStorage.getItem(PWA_PROMPT_SESSION_SEEN_KEY) === '1');
    setIsDismissed(isPwaPromptDismissed(window.localStorage.getItem(PWA_PROMPT_DISMISSED_UNTIL_KEY), Date.now()));
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (
        hasSeenSessionPrompt === null ||
        isDismissed === null ||
        hasSeenSessionPrompt ||
        isDismissed ||
        isStandalone ||
        !shouldRenderPrompt
      ) {
        return;
      }

      window.sessionStorage.setItem(PWA_PROMPT_SESSION_SEEN_KEY, '1');
      setHasSeenSessionPrompt(true);
      setIsVisible(true);
    }
  }, [hasSeenSessionPrompt, isDismissed, isStandalone, shouldRenderPrompt]);

  const dismissPrompt = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PWA_PROMPT_SESSION_SEEN_KEY, '1');
      window.localStorage.setItem(PWA_PROMPT_DISMISSED_UNTIL_KEY, String(buildPwaPromptDismissedUntil(Date.now())));
    }
    setHasSeenSessionPrompt(true);
    setIsDismissed(true);
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;

    if (isStandalone || !isVisible || !shouldRenderPrompt) {
      root.style.removeProperty('--mobile-overlay-offset');
      return;
    }

    const updateOffset = () => {
      if (window.innerWidth >= 768 || !promptRef.current) {
        root.style.removeProperty('--mobile-overlay-offset');
        return;
      }

      root.style.setProperty('--mobile-overlay-offset', `${Math.ceil(promptRef.current.offsetHeight) + 10}px`);
    };

    updateOffset();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null;
    if (promptRef.current && resizeObserver) {
      resizeObserver.observe(promptRef.current);
    }
    window.addEventListener('resize', updateOffset);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateOffset);
      root.style.removeProperty('--mobile-overlay-offset');
    };
  }, [isStandalone, isVisible, shouldRenderPrompt, showIOSGuide]);

  if (isStandalone || !isVisible || !shouldRenderPrompt) return null;

  return (
    <div
      ref={promptRef}
      data-ui="pwa-install-prompt"
      data-theme={theme}
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] left-3 right-3 z-[300] animate-in slide-in-from-bottom-8 duration-500 md:bottom-6 md:left-auto md:right-6 md:w-[22rem]"
    >
      <Paper tone="muted" shadow="md" className="group relative overflow-hidden rounded-[var(--radius-2xl)] px-3 py-2.5 text-foreground md:px-5 md:py-5">
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-accent-soft blur-[56px] transition-opacity group-hover:opacity-90" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismissPrompt}
          aria-label="Tutup prompt install"
          className="absolute right-1 top-1 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground md:right-1.5 md:top-1.5 md:h-11 md:w-11"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative md:hidden">
          <div className="flex items-center gap-2.5 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-[var(--accent-contrast)] hard-shadow-sm">
              <Download className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black leading-tight tracking-tight text-foreground">Pasang jawatch</h3>
                {!showIOSGuide ? (
                  <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    App
                  </span>
                ) : null}
              </div>
              {showIOSGuide ? (
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Bagikan, lalu tambah ke Home supaya aksesnya lebih cepat.</p>
              ) : (
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Buka lebih cepat tanpa chrome browser.</p>
              )}
            </div>

            {!showIOSGuide ? (
              <Button
                onClick={handleInstall}
                variant={installVariant}
                className={cn(
                  'h-8 shrink-0 rounded-full px-3 text-[11px] font-black',
                  installVariant === 'outline' ? 'border-border-subtle bg-surface-1 hover:bg-surface-elevated' : undefined
                )}
              >
                Pasang
              </Button>
            ) : null}
          </div>

          {showIOSGuide ? (
            <div className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-xl)] border border-white/10 bg-black/16 px-3 py-2 text-[11px] leading-4 text-white/92 backdrop-blur-sm">
              <Share className="h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" />
              <span className="font-semibold text-white">Bagikan</span>
              <span className="text-white/56">›</span>
              <PlusSquare className="h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" />
              <span className="font-semibold text-white">Tambah ke Home</span>
            </div>
          ) : null}
        </div>

        <div className="relative hidden md:block">
          <div className="flex items-start gap-3 pr-12">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-[var(--accent-contrast)] hard-shadow-sm">
              <Download className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent-strong)]">Pasang app</p>
              <h3 className="text-base font-black leading-tight tracking-tight text-foreground">Pasang jawatch</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {showIOSGuide
                  ? 'Pakai Bagikan, lalu Tambah ke Layar Utama supaya nonton dan baca lebih cepat.'
                  : 'Buka lebih cepat dan nikmati tampilan layar penuh dari perangkat kamu.'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-0">
            {showIOSGuide ? (
              <div className="grid grid-cols-2 gap-2">
                <Paper tone="outline" padded={false} className="flex h-11 items-center gap-2 rounded-[var(--radius-xl)] px-3 py-2 md:min-h-12 md:px-3.5 md:py-3">
                  <Share className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Langkah 1</span>
                    <span className="block text-sm font-semibold text-foreground">Bagikan</span>
                  </div>
                </Paper>
                <Paper tone="outline" padded={false} className="flex h-11 items-center gap-2 rounded-[var(--radius-xl)] px-3 py-2 md:min-h-12 md:px-3.5 md:py-3">
                  <PlusSquare className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Langkah 2</span>
                    <span className="block text-sm font-semibold text-foreground">Tambah ke Home</span>
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
                Pasang jawatch
              </Button>
            )}
          </div>
        </div>
      </Paper>
    </div>
  );
}
