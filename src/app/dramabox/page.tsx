import type { Metadata } from 'next';
import DramaboxPageClient from './DramaboxPageClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'DramaBox Subtitle Indonesia',
  description: 'Temukan katalog short drama Dramabox subtitle Indonesia dengan halaman yang ringan dan mudah dijelajahi.',
  path: '/dramabox',
});

export default function DramaboxPage() {
  return <DramaboxPageClient />;
}
