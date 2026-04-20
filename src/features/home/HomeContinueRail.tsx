'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useAuthSession } from '@/hooks/useAuthSession';
import { summarizeContinueHistory } from '@/lib/home-ia';
import { getHistoryForAuth } from '@/lib/store';

const ContinueWatching = dynamic(
  () => import('@/components/organisms/ContinueWatching').then((mod) => mod.ContinueWatching),
  {
    ssr: false,
    loading: () => null,
  },
);

const EMPTY_CONTINUE_SUMMARY = {
  hasAny: false,
  hasWatch: false,
  hasRead: false,
};

export function HomeContinueRail() {
  const authSession = useAuthSession();
  const [continueSummary, setContinueSummary] = React.useState(EMPTY_CONTINUE_SUMMARY);

  React.useEffect(() => {
    if (authSession.loading) {
      return;
    }

    setContinueSummary(summarizeContinueHistory(getHistoryForAuth(authSession.authenticated)));
  }, [authSession.authenticated, authSession.loading]);

  if (!continueSummary.hasAny) {
    return null;
  }

  return (
    <section className="space-y-6">
      {continueSummary.hasWatch ? (
        <ContinueWatching
          type={['anime', 'donghua', 'movie', 'drama']}
          title="Continue Watching"
          limit={8}
          hideWhenUnavailable
        />
      ) : null}
      {continueSummary.hasRead ? (
        <ContinueWatching
          type="manga"
          title="Continue Reading"
          limit={8}
          hideWhenUnavailable
        />
      ) : null}
    </section>
  );
}
