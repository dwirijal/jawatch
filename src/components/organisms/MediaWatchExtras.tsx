'use client';

import type { MovieDownloadGroup } from '@/lib/adapters/movie';
import MediaDownloadOptionsPanel from '@/components/organisms/MediaDownloadOptionsPanel';
import { AdSection } from '@/components/organisms/AdSection';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';

type MediaWatchExtrasProps = {
  downloadGroups: MovieDownloadGroup[];
  community: {
    mediaId: string;
    title: string;
    type: 'series' | 'movie';
    theme: 'anime' | 'donghua' | 'movie' | 'drama';
  };
  theme: 'anime' | 'donghua' | 'movie' | 'drama';
};

export function MediaWatchExtras({
  downloadGroups,
  community,
  theme,
}: MediaWatchExtrasProps) {
  return (
    <>
      <MediaDownloadOptionsPanel groups={downloadGroups} accent="indigo" />
      <AdSection theme={theme} />
      <CommunityCTA mediaId={community.mediaId} title={community.title} type={community.type} theme={community.theme} />
    </>
  );
}
