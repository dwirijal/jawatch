import { permanentRedirect } from 'next/navigation';
import ShortsDetailClient from '@/features/shorts/DrachinDetailClient';
import { getDrachinDetailBySlug } from '@/lib/adapters/drama';
import { getShortsDetailHref } from '@/lib/shorts-paths';

export default async function ShortsTitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getDrachinDetailBySlug(slug);

  if (detail && detail.slug !== slug) {
    permanentRedirect(getShortsDetailHref(detail.slug));
  }

  return <ShortsDetailClient slug={slug} />;
}
