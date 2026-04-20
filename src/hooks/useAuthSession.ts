'use client';

// Contract: jawatch uses embedded Supabase auth state.

import * as React from 'react';
import { getAuthStatus } from '@/lib/auth-gateway';
import { createAuthSessionStore, INITIAL_AUTH_SESSION_STATE } from './auth-session-store';

const authSessionStore = createAuthSessionStore(getAuthStatus);

export { createAuthSessionStore };

export function useAuthSession() {
  const session = React.useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getSnapshot,
    authSessionStore.getSnapshot
  );

  React.useEffect(() => {
    void authSessionStore.ensureLoaded();
  }, []);

  return session ?? INITIAL_AUTH_SESSION_STATE;
}
