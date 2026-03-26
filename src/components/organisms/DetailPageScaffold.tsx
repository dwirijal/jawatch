import * as React from 'react';
import { SplitLayout } from '@/components/atoms/SplitLayout';
import { AdSection } from '@/components/organisms/AdSection';

interface DetailPageScaffoldProps {
  hero: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailPageScaffold({ hero, children, sidebar, footer }: DetailPageScaffoldProps) {
  return (
    <div className="app-shell" data-view-mode="comfortable">
      <div className="app-container-wide flex flex-col gap-12 pb-6 pt-8 md:gap-16">
        {hero}

        <AdSection />

        {sidebar ? (
          <SplitLayout
            breakpoint="xl"
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
