import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';

interface VerticalSeriesDetailScaffoldProps {
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function VerticalSeriesDetailScaffold({
  backHref,
  backLabel,
  children,
  footer,
}: VerticalSeriesDetailScaffoldProps) {
  return (
    <div className="app-shell bg-background text-[var(--accent-contrast)]">
      <main className="app-container-wide app-section-stack py-6 md:py-8">
        <div className="flex items-center gap-[var(--space-sm)]">
          <Button variant="outline" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>

        {children}
        {footer}
      </main>
    </div>
  );
}
