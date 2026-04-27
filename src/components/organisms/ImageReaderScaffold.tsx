import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';

interface ImageReaderScaffoldProps {
  backHref: string;
  title: string;
  breadcrumbs?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  leftAside?: React.ReactNode;
  rightAside?: React.ReactNode;
  children: React.ReactNode;
}

export function ImageReaderScaffold({
  backHref,
  title,
  breadcrumbs,
  subtitle,
  headerActions,
  leftAside,
  rightAside,
  children,
}: ImageReaderScaffoldProps) {
  return (
    <div className="app-shell bg-background text-foreground">
      <header className="sticky top-0 z-[160] border-b border-border-subtle bg-surface-1/95 backdrop-blur-xl transition-all">
        <div className="app-container flex items-center justify-between gap-[var(--space-sm)] py-[calc(var(--space-xs)+var(--space-2xs))] sm:py-3">
          <div className="flex min-w-0 items-center gap-[var(--space-sm)]">
            <Button variant="ghost" size="icon" asChild className="h-[var(--size-control-md)] w-[var(--size-control-md)] shrink-0 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="line-clamp-1 text-sm font-semibold tracking-[var(--type-tracking-normal)] text-foreground md:text-base">{title}</h1>
              {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
            </div>
          </div>

          {headerActions ? <div className="flex items-center gap-[var(--space-xs)]">{headerActions}</div> : null}
        </div>
      </header>

      <main className="app-container-wide min-h-screen py-5 md:py-7">
        {breadcrumbs ? <div className="mb-[var(--space-md)]">{breadcrumbs}</div> : null}
        <div className="grid grid-cols-1 gap-[var(--space-lg)] xl:grid-cols-[minmax(150px,190px)_minmax(0,1fr)_minmax(150px,190px)] xl:gap-6">
          <aside className="hidden xl:block">{leftAside}</aside>
          <div className="flex min-w-0 flex-col items-center">{children}</div>
          <aside className="hidden xl:block">{rightAside}</aside>
        </div>
      </main>
    </div>
  );
}
