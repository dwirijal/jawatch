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

test('top-level navigation exposes Home, Watch, Read, and Vault', () => {
  assert.deepEqual(getPrimaryNavLabels(DESKTOP_NAV_ITEMS), ['Home', 'Watch', 'Read', 'Vault']);
});

test('mobile nav keeps search as an action and avoids legacy top-level labels', () => {
  const searchItem = MOBILE_NAV_ITEMS.find((item) => item.key === 'search');

  assert.equal(searchItem?.label, 'Search');
  assert.equal('action' in (searchItem || {}) ? searchItem?.action : null, 'search');
  assert.deepEqual(
    MOBILE_NAV_ITEMS.map((item) => item.label),
    ['Home', 'Watch', 'Search', 'Vault'],
  );
});

test('mobile menu groups expose the new Watch, Read, and Vault sections', () => {
  assert.deepEqual(
    MOBILE_MENU_GROUPS.map((group) => group.label),
    ['Watch', 'Read', 'Vault'],
  );
});
