'use client';

import type { AuthStatus, AuthSessionState } from '@/lib/auth-types';

export const INITIAL_AUTH_SESSION_STATE: AuthSessionState = {
  loading: true,
  authenticated: false,
  user: null,
};

function toSessionState(status?: AuthStatus | null): AuthSessionState {
  if (!status) {
    return INITIAL_AUTH_SESSION_STATE;
  }

  return {
    loading: false,
    authenticated: status.authenticated,
    user: status.user,
  };
}

export function createAuthSessionStore(loader: () => Promise<AuthStatus>) {
  let state = INITIAL_AUTH_SESSION_STATE;
  let inFlightLoad: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (nextState: AuthSessionState) => {
    state = nextState;
    emit();
  };

  const load = async () => {
    if (inFlightLoad) {
      return inFlightLoad;
    }

    inFlightLoad = (async () => {
      try {
        setState(toSessionState(await loader()));
      } catch {
        setState({
          loading: false,
          authenticated: false,
          user: null,
        });
      } finally {
        inFlightLoad = null;
      }
    })();

    return inFlightLoad;
  };

  return {
    ensureLoaded() {
      if (state.loading) {
        return load();
      }

      return inFlightLoad ?? Promise.resolve();
    },
    getSnapshot() {
      return state;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (state.loading) {
        void load();
      }

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
