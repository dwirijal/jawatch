import * as React from 'react';
import { DetailPageScaffold } from '@/components/organisms/DetailPageScaffold';
import { ThemeType } from '@/lib/utils';

interface ReaderMediaDetailPageProps {
  hero: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  theme: ThemeType;
  showAdSection?: boolean;
  desktopColumnsClassName?: string;
}

export function ReaderMediaDetailPage({
  hero,
  children,
  sidebar,
  footer,
  theme,
  showAdSection = true,
  desktopColumnsClassName = 'xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.95fr)] xl:grid-rows-1',
}: ReaderMediaDetailPageProps) {
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
