'use client';

import type { MovieDownloadGroup } from '@/lib/adapters/movie';
import MediaDownloadOptionsPanel from '@/components/organisms/MediaDownloadOptionsPanel';
import { DeferredAdSection } from '@/components/organisms/DeferredAdSection';
import { UnitCommunityPanel } from '@/components/organisms/CommunityPanel';

type MediaWatchExtrasProps = {
  downloadGroups: MovieDownloadGroup[];
  community: {
    titleId: string;
    titleLabel: string;
    unitId: string;
    unitLabel: string;
    unitHref: string;
    mediaType: 'anime' | 'donghua' | 'movie' | 'drama';
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
      <DeferredAdSection theme={theme} />
      <UnitCommunityPanel
        titleId={community.titleId}
        titleLabel={community.titleLabel}
        unitId={community.unitId}
        unitLabel={community.unitLabel}
        unitHref={community.unitHref}
        mediaType={community.mediaType}
        theme={community.theme}
      />
    </>
  );
}
