'use client';

import dynamic from 'next/dynamic';
import { NoSsr } from '@/components/atoms/NoSsr';

const DeviceListener = dynamic(
  () => import('@/components/atoms/DeviceListener').then((mod) => mod.DeviceListener),
  { ssr: false }
);

const AdNetworkScripts = dynamic(
  () => import('@/components/organisms/AdNetworkScripts').then((mod) => mod.AdNetworkScripts),
  { ssr: false }
);

const MobileNav = dynamic(
  () => import('@/components/organisms/MobileNav').then((mod) => mod.MobileNav),
  { ssr: false }
);

const PWAInstallPrompt = dynamic(
  () => import('@/components/molecules/PWAInstallPrompt').then((mod) => mod.PWAInstallPrompt),
  { ssr: false }
);

export function ClientShell() {
  return (
    <>
      <AdNetworkScripts />
      <DeviceListener />
      <NoSsr>
        <PWAInstallPrompt />
      </NoSsr>
      <MobileNav />
    </>
  );
}
