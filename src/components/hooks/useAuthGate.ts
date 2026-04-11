'use client';

import * as React from 'react';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { useRedirectTarget } from '@/components/hooks/useRedirectTarget';

type AuthenticatedAction = () => void;

interface GateOptions {
  onBlocked?: () => void;
}

function sanitizeRelativePath(nextPath: string): string {
  const candidate = nextPath.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }

  return candidate;
}

export function useAuthGate() {
  const session = useAuthSession();
  const [noticeVisible, setNoticeVisible] = React.useState(false);
  const redirectTarget = useRedirectTarget();
  const loginHref = React.useMemo(() => {
    const target = sanitizeRelativePath(redirectTarget);
    return `/login?next=${encodeURIComponent(target)}`;
  }, [redirectTarget]);

  const requireAuth = React.useCallback(
    (action: AuthenticatedAction, options?: GateOptions) => {
      return () => {
        if (session.loading) {
          return;
        }

        if (!session.authenticated) {
          setNoticeVisible(true);
          options?.onBlocked?.();
          return;
        }

        setNoticeVisible(false);
        action();
      };
    },
    [session.authenticated, session.loading]
  );

  const dismissNotice = React.useCallback(() => {
    setNoticeVisible(false);
  }, []);

  return {
    authenticated: session.authenticated,
    loading: session.loading,
    loginHref,
    redirectTarget,
    noticeVisible,
    requireAuth,
    dismissNotice,
  };
}
