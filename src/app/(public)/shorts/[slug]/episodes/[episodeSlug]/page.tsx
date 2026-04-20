import { permanentRedirect } from 'next/navigation';
import { StateInfo } from '@/components/molecules/StateInfo';
import { PageStateScaffold } from '@/components/organisms/PageStateScaffold';
import ShortsEpisodeClient from '@/features/shorts/DrachinEpisodeClient';
import { getDrachinDetailBySlug, getDrachinEpisodeBySlug } from '@/lib/adapters/drama';
import { getShortsEpisodeHref } from '@/lib/shorts-paths';

interface PageProps {
  params: Promise<{ slug: string; episodeSlug: string }>;
  searchParams?: Promise<{ index?: string | string[] }>;
}

function normalizeEpisodeIndex(value?: string | string[]): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function ShortsEpisodePage({
  params,
  searchParams,
}: PageProps) {
  const { slug, episodeSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedEpisodeIndex = normalizeEpisodeIndex(resolvedSearchParams?.index);

  const episode = await getDrachinEpisodeBySlug(episodeSlug, requestedEpisodeIndex);
  let detail = await getDrachinDetailBySlug(slug);

  if (!detail) {
    detail = await getDrachinDetailBySlug(episodeSlug);
  }

  if (!detail || !episode) {
    return (
      <PageStateScaffold>
        <StateInfo
          type="error"
          title="Playback unavailable"
          description="This short episode could not be loaded."
        />
      </PageStateScaffold>
    );
  }

  if (detail.slug !== slug || episode.episodeSlug !== episodeSlug) {
    permanentRedirect(getShortsEpisodeHref(detail.slug, episode.episodeSlug, episode.episodeIndex));
  }

  const resolvedEpisodeIndex =
    detail.episodes.find((item) => item.slug === episode.episodeSlug)?.index ?? String(episode.episodeIndex);

  return (
    <ShortsEpisodeClient
      slug={detail.slug}
      episodeIndex={Number.parseInt(resolvedEpisodeIndex, 10) || episode.episodeIndex}
      detail={detail}
      episode={episode}
    />
  );
}
