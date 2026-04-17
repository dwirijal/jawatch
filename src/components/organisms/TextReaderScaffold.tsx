import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Ads } from '@/components/atoms/Ads';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';

interface TextReaderScaffoldProps {
  backHref: string;
  title: string;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function TextReaderScaffold({
  backHref,
  title,
  subtitle,
  headerActions,
  children,
  footer,
}: TextReaderScaffoldProps) {
  return (
    <div className="app-shell bg-background text-foreground">
      <header className="sticky top-0 z-[160] border-b border-border-subtle bg-surface-1/95 backdrop-blur-xl transition-all">
        <div className="app-container flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-11 w-11 shrink-0 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground md:text-base">{title}</h1>
              {subtitle ? <div className="line-clamp-1 text-xs text-muted-foreground">{subtitle}</div> : null}
            </div>
          </div>

          {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
        </div>
      </header>

      <main className="app-container max-w-4xl py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <Ads type="horizontal" />
        </div>
        {children}
      </main>
      {footer}
    </div>
  );
}
