import DramaboxDetailClient from './DramaboxDetailClient';

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function DramaboxDetailPage({ params }: PageProps) {
  const { bookId } = await params;
  return <DramaboxDetailClient bookId={bookId} />;
}

