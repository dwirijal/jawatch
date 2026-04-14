import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ index?: string | string[] }>;
}

function normalizeEpisodeIndex(value?: string | string[]): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function DrachinEpisodePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const episodeIndex = normalizeEpisodeIndex(resolvedSearchParams?.index);
  redirect(`/series/short/watch/${slug}?index=${episodeIndex}`);
}
