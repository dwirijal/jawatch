import type { Metadata } from 'next';
import DrachinPageClient from './DrachinPageClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Drama China Pendek Subtitle Indonesia',
  description: 'Jelajahi short drama China subtitle Indonesia dalam surface Drachin yang terpisah dari katalog series utama.',
  path: '/drachin',
});

export default function DrachinPage() {
  return <DrachinPageClient />;
}
