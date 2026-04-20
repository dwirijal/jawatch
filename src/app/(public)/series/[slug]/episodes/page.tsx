import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SeriesEpisodesIndexPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/series/${slug}?tab=episodes`);
}
