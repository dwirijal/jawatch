import { notFound, permanentRedirect } from 'next/navigation';
import { getSeriesEpisodePageData } from '@/domains/series/server/series-episode-data';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';

interface PageProps {
  params: Promise<{ slug: string; episodeSlug: string }>;
}

export default async function LegacySeriesEpisodeRedirectPage({ params }: PageProps) {
  const { episodeSlug } = await params;
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await getSeriesEpisodePageData(episodeSlug, includeNsfw);

  if (!episode) {
    notFound();
  }

  permanentRedirect(episode.href);
}
