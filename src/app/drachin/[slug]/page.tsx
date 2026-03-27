import DrachinDetailClient from './DrachinDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DrachinDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <DrachinDetailClient slug={slug} />;
}

