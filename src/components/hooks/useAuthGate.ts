'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { buildLoginUrl } from '@/lib/auth-gateway';

type AuthenticatedAction = () => void;

interface GateOptions {
  onBlocked?: () => void;
}

export function useAuthGate() {
  const session = useAuthSession();
  const pathname = usePathname() || '/';
  const [noticeVisible, setNoticeVisible] = React.useState(false);

  const redirectTarget = pathname;
  const loginHref = React.useMemo(() => buildLoginUrl(redirectTarget), [redirectTarget]);

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
