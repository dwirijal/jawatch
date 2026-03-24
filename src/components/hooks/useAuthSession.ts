'use client';

// Contract: auth.dwizzy.my.id is the only auth authority consumed by dwizzyWEEB.

import * as React from 'react';
import { AuthSessionContext } from '@/components/providers/AuthSessionProvider';

export function useAuthSession() {
  const session = React.useContext(AuthSessionContext);

  if (!session) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }

  return session;
}
