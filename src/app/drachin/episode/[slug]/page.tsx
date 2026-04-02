import { StateInfo } from '@/components/molecules/StateInfo';
import { PageStateScaffold } from '@/components/organisms/PageStateScaffold';
import { getDrachinDetailBySlug, getDrachinEpisodeBySlug } from '@/lib/adapters/drama';
import DrachinEpisodeClient from './DrachinEpisodeClient';

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
  const [detail, episode] = await Promise.all([
    getDrachinDetailBySlug(slug),
    getDrachinEpisodeBySlug(slug, episodeIndex),
  ]);

  if (!detail || !episode) {
    return (
      <PageStateScaffold>
        <StateInfo
          type="error"
          title="Playback unavailable"
          description="This episode could not be loaded."
        />
      </PageStateScaffold>
    );
  }

  return (
    <DrachinEpisodeClient
      slug={slug}
      episodeIndex={episodeIndex}
      detail={detail}
      episode={episode}
    />
  );
}
