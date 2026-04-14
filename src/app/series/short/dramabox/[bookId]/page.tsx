import DramaboxDetailClient from '../../../../dramabox/[bookId]/DramaboxDetailClient';

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function ShortSeriesDramaboxDetailPage({ params }: PageProps) {
  const { bookId } = await params;
  return <DramaboxDetailClient bookId={bookId} backHref="/series/short" backLabel="Back to Short Series" />;
}
