'use client';

// Contract: auth.dwizzy.my.id is the only auth authority consumed by dwizzyWEEB.

import * as React from 'react';
import { getAuthStatus } from '@/lib/auth-gateway';
import type { AuthSessionState, AuthStatus } from '@/lib/auth-types';

const INITIAL_STATE: AuthSessionState = {
  loading: true,
  authenticated: false,
  user: null,
};

const AuthSessionContext = React.createContext<AuthSessionState | null>(null);

function toSessionState(status?: AuthStatus | null): AuthSessionState {
  if (!status) {
    return INITIAL_STATE;
  }

  return {
    loading: false,
    authenticated: status.authenticated,
    user: status.user,
  };
}

export function AuthSessionProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: AuthStatus | null;
}) {
  const [state, setState] = React.useState<AuthSessionState>(() => toSessionState(initialState));

  React.useEffect(() => {
    let cancelled = false;

    getAuthStatus()
      .then((session) => {
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          authenticated: session.authenticated,
          user: session.user,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          authenticated: false,
          user: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>;
}

export { AuthSessionContext };
