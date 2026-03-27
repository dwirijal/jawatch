import DrachinEpisodeClient from './DrachinEpisodeClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DrachinEpisodePage({ params }: PageProps) {
  const { slug } = await params;
  return <DrachinEpisodeClient slug={slug} />;
}

