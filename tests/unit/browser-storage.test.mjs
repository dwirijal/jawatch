import test from 'node:test';
import assert from 'node:assert/strict';

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('browser storage helpers read and write strings and JSON safely', async () => {
  const storage = createStorage();
  global.window = { localStorage: storage };
  global.localStorage = storage;

  const browserStorage = await import('../../src/lib/browser-storage.ts');

  assert.equal(browserStorage.readStoredString('missing'), null);
  assert.equal(browserStorage.writeStoredString('mirror', 'alpha'), true);
  assert.equal(storage.getItem('mirror'), 'alpha');
  assert.equal(browserStorage.readStoredString('mirror'), 'alpha');

  assert.equal(browserStorage.writeStoredJson('resume', { episode: 12 }), true);
  assert.deepEqual(browserStorage.readStoredJson('resume'), { episode: 12 });

  storage.setItem('broken', '{oops');
  assert.equal(browserStorage.readStoredJson('broken'), null);

  assert.equal(browserStorage.removeStoredItem('mirror'), true);
  assert.equal(storage.getItem('mirror'), null);

  delete global.window;
  delete global.localStorage;
});
