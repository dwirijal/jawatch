'use client';

import { NoSsr } from '@/components/atoms/NoSsr';
import { DeviceListener } from '@/components/atoms/DeviceListener';
import { PWAInstallPrompt } from '@/components/molecules/PWAInstallPrompt';
import { DeferredAnalytics } from '@/components/organisms/DeferredAnalytics';
import { MobileNav } from '@/components/organisms/MobileNav';

export function ClientShell() {
  return (
    <>
      <DeviceListener />
      <DeferredAnalytics />
      <NoSsr>
        <PWAInstallPrompt />
      </NoSsr>
      <MobileNav />
    </>
  );
}
