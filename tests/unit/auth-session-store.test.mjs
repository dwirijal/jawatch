import test from 'node:test';
import assert from 'node:assert/strict';

import { createAuthSessionStore } from '../../src/hooks/auth-session-store.ts';

test('dedupes concurrent auth status loads and updates subscribers once data arrives', async () => {
  let calls = 0;
  let resolveLoader;
  const store = createAuthSessionStore(
    () =>
      new Promise((resolve) => {
        calls += 1;
        resolveLoader = resolve;
      }),
  );

  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });

  const firstLoad = store.ensureLoaded();
  const secondLoad = store.ensureLoaded();

  resolveLoader({
    authenticated: true,
    user: {
      id: 'user-1',
      displayName: 'Dwizzy User',
      provider: 'discord',
    },
  });

  await Promise.all([firstLoad, secondLoad]);

  assert.equal(calls, 1);
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getSnapshot().authenticated, true);
  assert.equal(store.getSnapshot().user?.displayName, 'Dwizzy User');
  assert.equal(notifications, 1);

  unsubscribe();
});

test('falls back to signed-out state when auth bridge fails', async () => {
  const store = createAuthSessionStore(async () => {
    throw new Error('bridge unavailable');
  });

  await store.ensureLoaded();

  assert.deepEqual(store.getSnapshot(), {
    loading: false,
    authenticated: false,
    user: null,
  });
});
