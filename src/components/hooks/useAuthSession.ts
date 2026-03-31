'use client';

// Contract: auth.dwizzy.my.id is the only auth authority consumed by dwizzyWEEB.

import * as React from 'react';
import { AuthSessionContext } from '@/components/providers/AuthSessionProvider';
import type { AuthSessionState } from '@/lib/auth-types';

const FALLBACK_SESSION: AuthSessionState = {
  loading: true,
  authenticated: false,
  user: null,
};

export function useAuthSession() {
  const session = React.useContext(AuthSessionContext);

  if (!session) {
    return FALLBACK_SESSION;
  }

  return session;
}
