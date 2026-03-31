import * as React from 'react';
import { LayoutGrid } from 'lucide-react';
import { AdSection } from '@/components/organisms/AdSection';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import MediaDownloadOptionsPanel, { type MediaDownloadGroup } from '@/components/organisms/MediaDownloadOptionsPanel';
import { HorizontalPlayerPage } from '@/components/organisms/HorizontalPlayerPage';

interface MediaWatchPageProps {
  historyTracker?: React.ReactNode;
  backHref: string;
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  browseHref: string;
  browseLabel: string;
  theme: 'anime' | 'donghua' | 'movie' | 'drama';
  stage: React.ReactNode;
  sidebar: React.ReactNode;
  downloadGroups: MediaDownloadGroup[];
  community: {
    mediaId: string;
    title: string;
    type: 'series' | 'movie';
    theme: 'anime' | 'donghua' | 'movie' | 'drama';
  };
  children?: React.ReactNode;
}

export function MediaWatchPage({
  historyTracker,
  backHref,
  eyebrow = 'Now Watching',
  title,
  subtitle,
  browseHref,
  browseLabel,
  theme,
  stage,
  sidebar,
  downloadGroups,
  community,
  children,
}: MediaWatchPageProps) {
  return (
    <>
      {historyTracker}

      <HorizontalPlayerPage
        backHref={backHref}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        headerActions={
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href={browseHref}>
              <LayoutGrid className="mr-2 h-4 w-4" /> {browseLabel}
            </Link>
          </Button>
        }
        desktopColumnsClassName="xl:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] xl:grid-rows-1"
        stretchSidebarToStage
        stage={stage}
        sidebar={sidebar}
      >
        <MediaDownloadOptionsPanel groups={downloadGroups} accent="indigo" />
        <AdSection theme={theme} />
        <CommunityCTA mediaId={community.mediaId} title={community.title} type={community.type} theme={community.theme} />
        {children}
      </HorizontalPlayerPage>
    </>
  );
}
