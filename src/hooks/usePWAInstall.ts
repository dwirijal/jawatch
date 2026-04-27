'use client';

import { useState, useEffect } from 'react';
import { getMediaQueryMatches } from '@/lib/media-query';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

function isInstalledPwa() {
  const nav = window.navigator as NavigatorStandalone;
  return (
    getMediaQueryMatches('(display-mode: standalone)') ||
    Boolean(nav.standalone) ||
    document.referrer.includes('android-app://')
  );
}

function isIOSDevice() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsStandalone(isInstalledPwa());
      setIsIOS(isIOSDevice());
    });

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return {
    showPrompt: !!installPrompt,
    showIOSGuide: isIOS && !isStandalone,
    handleInstall,
    isStandalone,
  };
}
