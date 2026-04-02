import * as React from 'react';
import { SplitLayout } from '@/components/atoms/SplitLayout';
import { ThemeType } from '@/lib/utils';

interface DetailPageScaffoldProps {
  hero: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  theme?: ThemeType;
  showAdSection?: boolean;
  desktopColumnsClassName?: string;
}

export async function DetailPageScaffold({
  hero,
  children,
  sidebar,
  footer,
  theme,
  showAdSection = true,
  desktopColumnsClassName,
}: DetailPageScaffoldProps) {
  const AdSection = showAdSection
    ? (await import('@/components/organisms/AdSection')).AdSection
    : null;

  return (
    <div className="app-shell" data-theme={theme} data-view-mode="comfortable">
      <div className="app-container-wide flex flex-col gap-12 pb-6 pt-8 md:gap-16">
        {hero}

        {AdSection ? <AdSection theme={theme} /> : null}

        {sidebar ? (
          <SplitLayout
            breakpoint="xl"
            desktopColumnsClassName={desktopColumnsClassName}
            className="items-start gap-12 xl:gap-16"
            stage={<div className="app-section-stack">{children}</div>}
            gallery={<div className="space-y-8">{sidebar}</div>}
          />
        ) : (
          <main className="app-section-stack">{children}</main>
        )}

        {footer}
      </div>
    </div>
  );
}
