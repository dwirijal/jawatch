import * as React from 'react';
import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import type { MovieDownloadGroup } from '@/lib/adapters/movie';
import { HorizontalPlayerPage } from '@/components/organisms/HorizontalPlayerPage';
import { MediaWatchExtras } from '@/components/organisms/MediaWatchExtras';

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
  children?: React.ReactNode;
}

export function MediaWatchPage({
  historyTracker,
  backHref,
  eyebrow = 'Sedang nonton',
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
        <MediaWatchExtras downloadGroups={downloadGroups} community={community} theme={theme} />
        {children}
      </HorizontalPlayerPage>
    </>
  );
}
