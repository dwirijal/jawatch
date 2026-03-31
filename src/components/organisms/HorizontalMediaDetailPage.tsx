import * as React from 'react';
import { DetailPageScaffold } from '@/components/organisms/DetailPageScaffold';
import { ThemeType } from '@/lib/utils';

interface HorizontalMediaDetailPageProps {
  hero: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  theme: ThemeType;
  showAdSection?: boolean;
  desktopColumnsClassName?: string;
}

export function HorizontalMediaDetailPage({
  hero,
  children,
  sidebar,
  footer,
  theme,
  showAdSection = true,
  desktopColumnsClassName = 'xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)] xl:grid-rows-1',
}: HorizontalMediaDetailPageProps) {
  return (
    <DetailPageScaffold
      hero={hero}
      sidebar={sidebar}
      footer={footer}
      theme={theme}
      showAdSection={showAdSection}
      desktopColumnsClassName={desktopColumnsClassName}
    >
      {children}
    </DetailPageScaffold>
  );
}
