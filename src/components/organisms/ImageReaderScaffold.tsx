import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';

interface ImageReaderScaffoldProps {
  backHref: string;
  title: string;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  leftAside?: React.ReactNode;
  rightAside?: React.ReactNode;
  children: React.ReactNode;
}

export function ImageReaderScaffold({
  backHref,
  title,
  subtitle,
  headerActions,
  leftAside,
  rightAside,
  children,
}: ImageReaderScaffoldProps) {
  return (
    <div className="app-shell bg-background text-white">
      <header className="sticky top-0 z-[160] border-b border-border-subtle bg-surface-1/95 backdrop-blur-xl transition-all">
        <div className="app-container flex items-center justify-between gap-3 py-2.5 sm:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="line-clamp-1 text-sm font-semibold tracking-tight text-white md:text-base">{title}</h1>
              {subtitle ? <div className="text-xs text-zinc-500">{subtitle}</div> : null}
            </div>
          </div>

          {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
        </div>
      </header>

      <main className="app-container-wide min-h-screen py-5 md:py-7">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(150px,190px)_minmax(0,1fr)_minmax(150px,190px)] xl:gap-6">
          <aside className="hidden xl:block">{leftAside}</aside>
          <div className="flex min-w-0 flex-col items-center">{children}</div>
          <aside className="hidden xl:block">{rightAside}</aside>
        </div>
      </main>
    </div>
  );
}
