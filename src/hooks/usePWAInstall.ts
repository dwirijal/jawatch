'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Navigator type for iOS standalone detection
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if app is already installed
    const nav = window.navigator as NavigatorStandalone;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || nav.standalone 
      || (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
    
    // Use requestAnimationFrame to avoid cascading render warning in ESLint
    requestAnimationFrame(() => {
      setIsStandalone(!!isStandaloneMode);
      
      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    });

    // Handle standard PWA prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
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
    isStandalone
  };
}
