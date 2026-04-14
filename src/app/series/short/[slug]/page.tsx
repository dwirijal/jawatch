import DrachinDetailClient from '../../../drachin/[slug]/DrachinDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShortSeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <DrachinDetailClient slug={slug} basePath="/series/short" />;
}
