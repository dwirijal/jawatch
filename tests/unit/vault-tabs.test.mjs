import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getVaultTabCopy,
  resolveVaultMediaTypes,
  resolveVaultTab,
} from '../../src/lib/vault-tabs.ts';

test('vault tabs normalize to all watch and read', () => {
  assert.equal(resolveVaultTab(undefined), 'all');
  assert.equal(resolveVaultTab('watch'), 'watch');
  assert.equal(resolveVaultTab('read'), 'read');
  assert.equal(resolveVaultTab('unknown'), 'all');
});

test('vault tabs map watch and read to the correct media families', () => {
  assert.deepEqual(resolveVaultMediaTypes('all'), null);
  assert.deepEqual(resolveVaultMediaTypes('watch'), ['anime', 'donghua', 'movie', 'drama']);
  assert.deepEqual(resolveVaultMediaTypes('read'), ['manga']);
});

test('vault tab copy exposes the segmented labels', () => {
  assert.deepEqual(getVaultTabCopy('watch'), {
    label: 'Nonton',
    emptyLabel: 'Riwayat nonton',
    href: '?tab=watch',
  });
  assert.deepEqual(getVaultTabCopy('read'), {
    label: 'Baca',
    emptyLabel: 'Riwayat baca',
    href: '?tab=read',
  });
});
