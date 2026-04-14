import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DrachinDetailPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/series/short/${slug}`);
}
