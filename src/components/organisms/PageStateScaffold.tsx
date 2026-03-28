import * as React from 'react';

interface PageStateScaffoldProps {
  children: React.ReactNode;
}

export function PageStateScaffold({ children }: PageStateScaffoldProps) {
  return (
    <div className="app-shell bg-background text-white">
      <main className="app-container-immersive py-6">{children}</main>
    </div>
  );
}
