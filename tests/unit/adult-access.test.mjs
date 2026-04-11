import test from 'node:test';
import assert from 'node:assert/strict';

import { ageInYears, canAccessNsfw, getAdultAccessState } from '../../src/lib/auth/adult-access.ts';

test('computes age in UTC calendar years', () => {
  const age = ageInYears('2005-04-12', new Date('2026-04-11T00:00:00.000Z'));
  assert.equal(age, 20);

  const onBirthday = ageInYears('2005-04-11', new Date('2026-04-11T00:00:00.000Z'));
  assert.equal(onBirthday, 21);
});

test('nsfw access requires both age >= 21 and adult_content_enabled', () => {
  const eligibleWithOptIn = canAccessNsfw(
    {
      birthDate: '2000-01-10',
      adultContentEnabled: true,
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );
  assert.equal(eligibleWithOptIn, true);

  const adultWithoutOptIn = canAccessNsfw(
    {
      birthDate: '2000-01-10',
      adultContentEnabled: false,
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );
  assert.equal(adultWithoutOptIn, false);

  const underageWithOptIn = canAccessNsfw(
    {
      birthDate: '2010-01-10',
      adultContentEnabled: true,
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );
  assert.equal(underageWithOptIn, false);
});

test('returns explicit status fields for UI and server guards', () => {
  const status = getAdultAccessState(
    {
      birthDate: null,
      adultContentEnabled: true,
    },
    new Date('2026-04-11T00:00:00.000Z'),
  );

  assert.deepEqual(status, {
    age: null,
    isAdultByAge: false,
    adultContentEnabled: true,
    canAccessNsfw: false,
  });
});
