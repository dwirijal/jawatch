'use client';

// Contract: jawatch uses embedded Supabase auth state.

import * as React from 'react';
import { getAuthStatus } from '@/lib/auth-gateway';
import type { AuthSessionState, AuthStatus } from '@/lib/auth-types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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
    const supabase = createSupabaseBrowserClient();
    const setSignedOut = () => {
      if (cancelled) {
        return;
      }

      setState({
        loading: false,
        authenticated: false,
        user: null,
      });
    };

    const loadStatus = async () => {
      try {
        const session = await getAuthStatus();
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          authenticated: session.authenticated,
          user: session.user,
        });
      } catch {
        setSignedOut();
      }
    };

    void loadStatus();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadStatus();
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>;
}

export { AuthSessionContext };
