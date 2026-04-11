'use client';

// Contract: jawatch uses embedded Supabase auth state.

import * as React from 'react';
import { getAuthStatus } from '@/lib/auth-gateway';
import { AuthSessionContext } from '@/components/providers/AuthSessionProvider';
import { createAuthSessionStore, INITIAL_AUTH_SESSION_STATE } from './auth-session-store';

const authSessionStore = createAuthSessionStore(getAuthStatus);
const noopUnsubscribe = () => {};
const noopSubscribe = () => noopUnsubscribe;
const initialSnapshot = () => INITIAL_AUTH_SESSION_STATE;

export { createAuthSessionStore };

export function useAuthSession() {
  const contextSession = React.useContext(AuthSessionContext);
  const useStore = !contextSession;

  const session = React.useSyncExternalStore(
    useStore ? authSessionStore.subscribe : noopSubscribe,
    useStore ? authSessionStore.getSnapshot : initialSnapshot,
    useStore ? authSessionStore.getSnapshot : initialSnapshot
  );

  React.useEffect(() => {
    if (useStore) {
      void authSessionStore.ensureLoaded();
    }
  }, [useStore]);

  return contextSession ?? session ?? INITIAL_AUTH_SESSION_STATE;
}
