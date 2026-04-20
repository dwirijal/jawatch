'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { loadRemoteVaultCommunitySummary } from '@/lib/personalization-sync';
import { getVaultCommunitySummary } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  formatActivityTime,
  formatCount,
  type VaultCommunitySummaryProps,
} from './community-panel-shared';

export function VaultCommunitySummary({ className }: VaultCommunitySummaryProps) {
  const authSession = useAuthSession();
  const [summary, setSummary] = React.useState(() => getVaultCommunitySummary());

  React.useEffect(() => {
    if (authSession.loading) {
      return;
    }

    if (authSession.authenticated) {
      void loadRemoteVaultCommunitySummary()
        .then((nextSummary) => {
          setSummary(nextSummary);
        })
        .catch(() => {
          setSummary(getVaultCommunitySummary());
        });
      return;
    }

    setSummary(getVaultCommunitySummary());
  }, [authSession.authenticated, authSession.loading]);

  return (
    <div className={cn('flex h-full flex-col gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-4', className)}>
      <MessageSquare className="h-4.5 w-4.5 text-zinc-300" />
      <span className="text-sm font-black uppercase tracking-[0.16em] text-white">Community</span>
      <span className="text-xs leading-5 text-zinc-500">
        {formatCount(summary.likeCount, 'unit like')}, {formatCount(summary.commentCount, 'comment')}, across {formatCount(summary.activeTitleCount, 'title')} in this browser or vault scope.
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        Latest activity {formatActivityTime(summary.latestActivityAt)}
      </span>
    </div>
  );
}
