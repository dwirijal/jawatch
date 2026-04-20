import test from 'node:test';
import assert from 'node:assert/strict';

test('seo helpers can be imported directly by the Node test runner', async () => {
  const seo = await import('../../src/lib/seo.ts');

  assert.equal(typeof seo.buildMetadata, 'function');
  assert.equal(typeof seo.absoluteUrl, 'function');
});
