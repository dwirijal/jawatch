import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DESKTOP_NAV_ITEMS,
  MOBILE_MENU_GROUPS,
  MOBILE_NAV_ITEMS,
} from '../../src/lib/navigation.ts';

function getPrimaryNavLabels(items) {
  return items.map((item) => ('group' in item ? item.group.label : item.label));
}

test('top-level navigation exposes Beranda, Nonton, Baca, and Koleksi', () => {
  assert.deepEqual(getPrimaryNavLabels(DESKTOP_NAV_ITEMS), ['Beranda', 'Nonton', 'Baca', 'Koleksi']);

  const vaultItem = DESKTOP_NAV_ITEMS.find((item) => item.key === 'vault');
  assert.equal(vaultItem && 'href' in vaultItem ? vaultItem.href : null, '/vault');
});

test('mobile nav keeps search as an action and avoids legacy top-level labels', () => {
  const searchItem = MOBILE_NAV_ITEMS.find((item) => item.key === 'search');

  assert.equal(searchItem?.label, 'Cari');
  assert.equal('action' in (searchItem || {}) ? searchItem?.action : null, 'search');
  assert.deepEqual(
    MOBILE_NAV_ITEMS.map((item) => item.label),
    ['Beranda', 'Nonton', 'Cari', 'Koleksi'],
  );
  assert.deepEqual(
    MOBILE_NAV_ITEMS.map((item) => ('href' in item ? item.href : null)),
    ['/', '/watch', null, '/vault'],
  );
});

test('mobile menu groups expose the new Nonton, Baca, and Koleksi sections', () => {
  assert.deepEqual(
    MOBILE_MENU_GROUPS.map((group) => group.label),
    ['Nonton', 'Baca', 'Koleksi'],
  );

  const vaultGroup = MOBILE_MENU_GROUPS.find((group) => group.key === 'vault');
  assert.ok(vaultGroup);
  assert.deepEqual(
    vaultGroup?.items.map((item) => item.href),
    ['/vault'],
  );
});
