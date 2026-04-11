import test from 'node:test';
import assert from 'node:assert/strict';

import { getAdultEligibility, toAuthUser } from '../../src/lib/auth/session.ts';

test('maps Supabase user metadata into auth user contract', () => {
  const user = toAuthUser({
    id: 'a777a777-a777-a777-a777-a777a777a777',
    email: 'jawatch@example.com',
    user_metadata: {
      full_name: 'Jawatch User',
      avatar_url: 'https://cdn.example/avatar.jpg',
    },
    app_metadata: {
      provider: 'discord',
    },
    identities: [],
  });

  assert.deepEqual(user, {
    id: 'a777a777-a777-a777-a777-a777a777a777',
    email: 'jawatch@example.com',
    displayName: 'Jawatch User',
    avatarUrl: 'https://cdn.example/avatar.jpg',
    provider: 'discord',
  });
});

test('falls back to email token when display name metadata is absent', () => {
  const user = toAuthUser({
    id: 'b777b777-b777-b777-b777-b777b777b777',
    email: 'fallback-user@example.com',
    user_metadata: {},
    app_metadata: {},
    identities: [{ provider: 'google' }],
  });

  assert.equal(user.displayName, 'fallback-user');
  assert.equal(user.provider, 'google');
});

test('marks adult eligible only when age is >= 21', () => {
  const eligible = getAdultEligibility(
    {
      birthDate: '2000-01-10',
      ageVerifiedAt: '2026-01-01T00:00:00.000Z',
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );

  assert.deepEqual(eligible, {
    isAdultEligible: true,
    age: 26,
    ageVerified: true,
  });

  const notEligible = getAdultEligibility(
    {
      birthDate: '2010-01-10',
      ageVerifiedAt: '2026-01-01T00:00:00.000Z',
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );

  assert.deepEqual(notEligible, {
    isAdultEligible: false,
    age: 16,
    ageVerified: true,
  });
});

test('adult eligibility does not require ageVerifiedAt when age is already >= 21', () => {
  const eligible = getAdultEligibility(
    {
      birthDate: '2000-01-10',
      ageVerifiedAt: null,
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );

  assert.deepEqual(eligible, {
    isAdultEligible: true,
    age: 26,
    ageVerified: false,
  });
});
