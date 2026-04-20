import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ComicChaptersIndexPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/comics/${slug}?tab=chapters`);
}
