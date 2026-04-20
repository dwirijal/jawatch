import 'server-only';

import { cache } from 'react';
import type { AuthStatus } from '../auth-types.ts';
import { getCurrentUser } from '../auth/session.ts';

async function loadServerAuthStatus(request?: Request): Promise<AuthStatus> {
  const user = await getCurrentUser(request);
  return {
    authenticated: user !== null,
    user,
  };
}

const getCachedServerAuthStatus = cache(async (): Promise<AuthStatus> => loadServerAuthStatus());

export async function getServerAuthStatus(request?: Request): Promise<AuthStatus> {
  if (request) {
    return loadServerAuthStatus(request);
  }

  return getCachedServerAuthStatus();
}
