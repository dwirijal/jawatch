import type { MediaType } from '@/lib/store';

export type VaultTab = 'all' | 'watch' | 'read';

const WATCH_MEDIA_TYPES: MediaType[] = ['anime', 'donghua', 'movie', 'drama'];
const READ_MEDIA_TYPES: MediaType[] = ['manga'];

export function resolveVaultTab(value: string | null | undefined): VaultTab {
  switch ((value || '').trim().toLowerCase()) {
    case 'watch':
      return 'watch';
    case 'read':
      return 'read';
    default:
      return 'all';
  }
}

export function resolveVaultMediaTypes(tab: VaultTab): MediaType[] | null {
  if (tab === 'watch') {
    return WATCH_MEDIA_TYPES;
  }

  if (tab === 'read') {
    return READ_MEDIA_TYPES;
  }

  return null;
}

export function getVaultTabCopy(tab: VaultTab): {
  label: 'Semua' | 'Nonton' | 'Baca';
  emptyLabel: 'Semua riwayat' | 'Riwayat nonton' | 'Riwayat baca';
  href: string;
} {
  if (tab === 'watch') {
    return {
      label: 'Nonton',
      emptyLabel: 'Riwayat nonton',
      href: '?tab=watch',
    };
  }

  if (tab === 'read') {
    return {
      label: 'Baca',
      emptyLabel: 'Riwayat baca',
      href: '?tab=read',
    };
  }

  return {
    label: 'Semua',
    emptyLabel: 'Semua riwayat',
    href: '?tab=all',
  };
}
